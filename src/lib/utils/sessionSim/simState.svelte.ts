import type { FixationDataEntry } from '$lib/database/db.types';
import { buildCorrections, buildGeometryMap, distinctSlides } from './builders';
import type { CorrectedExportMeta } from './export';
import { createFluencyResolver } from './metrics/fluencyRegistry';
import { runReplay } from './replay';
import { identityCorrection } from './transform';
import { parseTaskName, type ParsedTaskName } from './taskName';
import { resolveSlide, type ResolvedSlide } from './taskResolver';
import {
	DEFAULT_DETECTOR_PARAMS,
	DEFAULT_GAP_RESET_MS,
	type AoiAttributionStrategy,
	type AoiRect,
	type DetectorParams,
	type FluencyResolver,
	type LoadedSession,
	type RebaseMode,
	type ReplayResult,
	type SessionSource,
	type SlideGeometry,
	type SpatialCorrection
} from './types';

const RECOMPUTE_DEBOUNCE_MS = 120;

/** Settings shared by every loaded session; corrections stay per session. */
export class SimSettings {
	detectorParams = $state<DetectorParams>({ ...DEFAULT_DETECTOR_PARAMS });
	aoiAttribution = $state<AoiAttributionStrategy>('snapshot-at-start');
	dropUnfinishedFinalFixation = $state(true);
	countFixationsOpenAtWindowEnd = $state(false);
	gapResetMs = $state(DEFAULT_GAP_RESET_MS);
	dropColdStartFixation = $state(false);
	rebaseMode = $state<RebaseMode>('auto');
	synthesizeDwellArrow = $state(true);
	synthesizeDwellEye = $state(true);
	/** Bumped on every change; a session whose result was computed earlier is stale. */
	version = $state(0);

	/** Bridge-stamped recordings store fixation onsets live; rebase reproduces that. */
	rebaseFor(session: LoadedSession): boolean {
		if (this.rebaseMode === 'auto') return session.bridgeStamped;
		return this.rebaseMode === 'on';
	}
}

export type SessionLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export function sessionSourceLabel(source: SessionSource): string {
	const date = source.sessionStartTime
		? ` · ${source.sessionStartTime.toLocaleString('cs-CZ', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})}`
		: '';
	return `${source.username} · ${source.testType}${date}`;
}

/** One session's data, spatial correction and replay result. */
export class SessionSimState {
	readonly source: SessionSource;
	status = $state<SessionLoadStatus>('idle');
	loadError = $state('');

	session = $state<LoadedSession | null>(null);
	parsedTask = $state<ParsedTaskName | null>(null);
	slides = $state<number[]>([]);
	stimulusBySlide = $state<Record<number, string>>({});
	resolvedBySlide = $state<Record<number, ResolvedSlide | null>>({});
	selectedSlide = $state<number | null>(null);

	viewportWidth = $state(1920);
	viewportHeight = $state(1080);
	viewportSource = $state<'geometry' | 'meta' | 'manual'>('manual');

	sessionCorrection = $state<SpatialCorrection>(identityCorrection(960, 540));
	slideOverrides = $state<Record<number, SpatialCorrection>>({});
	editSlideOnly = $state(false);

	/** AOI rects captured by re-rendering the stimulus (legacy fallback). */
	capturedAois = $state<Record<number, AoiRect[]>>({});
	/** AOI rects recorded during the live session; immutable, wins over capture. */
	recordedAois = $state<Record<number, AoiRect[]>>({});
	result = $state<ReplayResult | null>(null);
	recomputeMs = $state<number | null>(null);
	error = $state('');

	private fluency: FluencyResolver | null = null;
	private recomputeTimer: ReturnType<typeof setTimeout> | null = null;
	private computedVersion = -1;
	private loadPromise: Promise<LoadedSession> | null = null;
	private readonly settings: SimSettings;

	constructor(source: SessionSource, settings: SimSettings) {
		this.source = source;
		this.settings = settings;
	}

	get key(): string {
		return this.source.key;
	}

	get label(): string {
		return sessionSourceLabel(this.source);
	}

	get warnings(): string[] {
		return [...(this.session?.warnings ?? []), ...(this.result?.warnings ?? [])];
	}

	/** True when the shared settings changed after the last replay. */
	get isStale(): boolean {
		return this.computedVersion !== this.settings.version;
	}

	/** Resolves the session data, downloading it on first use; concurrent calls share one download. */
	ensureLoaded(): Promise<LoadedSession> {
		if (this.session) return Promise.resolve(this.session);
		if (!this.loadPromise) {
			this.status = 'loading';
			this.loadError = '';
			this.loadPromise = this.source.load().then(
				(session) => {
					this.loadSession(session);
					return session;
				},
				(err: unknown) => {
					this.status = 'error';
					this.loadError = err instanceof Error ? err.message : 'Nepodařilo se načíst data';
					this.loadPromise = null;
					throw err;
				}
			);
		}
		return this.loadPromise;
	}

	loadSession(session: LoadedSession): void {
		this.session = session;
		this.status = 'ready';
		this.loadError = '';
		this.parsedTask = parseTaskName(session.taskName);
		this.error = this.parsedTask
			? ''
			: `Neznámý název úlohy "${session.taskName}" – stimuly nelze vykreslit.`;

		const slides = distinctSlides(session.gazeSamples);
		this.slides = slides;

		const geometryStimulus: Record<number, string> = {};
		for (const geometry of session.recordedGeometry) {
			if (geometry.stimulusId) geometryStimulus[geometry.slideIndex] ??= geometry.stimulusId;
		}
		const stimulusBySlide: Record<number, string> = {};
		const resolvedBySlide: Record<number, ResolvedSlide | null> = {};
		for (const slide of slides) {
			const row = session.gazeSamples.find(
				(sample) => sample.slide_index === slide && sample.stimulus_id !== 'null'
			);
			stimulusBySlide[slide] = row?.stimulus_id ?? geometryStimulus[slide] ?? 'null';
			resolvedBySlide[slide] = this.parsedTask
				? resolveSlide(this.parsedTask, stimulusBySlide[slide])
				: null;
		}
		this.stimulusBySlide = stimulusBySlide;
		this.resolvedBySlide = resolvedBySlide;

		this.fluency = this.parsedTask
			? createFluencyResolver(this.parsedTask.slug, (stimulusId) => {
					const resolved = this.parsedTask ? resolveSlide(this.parsedTask, stimulusId) : null;
					return resolved?.stimulus.raw ?? null;
				})
			: null;

		this.selectedSlide = slides[0] ?? null;

		// Geometry recorded during the live session beats DOM re-capture: it has
		// real rects, lifetimes, and works even when the stimulus can't render.
		const recorded = session.recordedGeometry.filter((geometry) => geometry.aois.length > 0);
		const recordedViewport = recorded.find(
			(geometry) => geometry.viewport.width > 0 && geometry.viewport.height > 0
		)?.viewport;
		// Viewport priority: recorded geometry > meta.json > manual entry
		const viewport = recordedViewport ?? session.meta?.viewport;
		if (viewport) {
			this.viewportWidth = viewport.width;
			this.viewportHeight = viewport.height;
		}
		this.viewportSource = recordedViewport
			? 'geometry'
			: session.meta?.viewport
				? 'meta'
				: 'manual';
		const recordedAois: Record<number, AoiRect[]> = {};
		for (const geometry of recorded) {
			recordedAois[geometry.slideIndex] = [
				...(recordedAois[geometry.slideIndex] ?? []),
				...geometry.aois
			];
		}
		this.recordedAois = recordedAois;
		this.capturedAois = {};
		this.slideOverrides = {};
		this.sessionCorrection = identityCorrection(this.viewportWidth / 2, this.viewportHeight / 2);
		this.result = null;
		this.scheduleRecompute();
	}

	/** Replaces the I2MC reference fixations, e.g. with a headless server run. */
	setI2mcFixationData(entries: FixationDataEntry[]): void {
		if (!this.session) return;
		this.session.i2mcFixationData = [...entries].sort((a, b) => a.timestamp - b.timestamp);
	}

	setViewport(width: number, height: number): void {
		if (width === this.viewportWidth && height === this.viewportHeight) return;
		this.viewportWidth = width;
		this.viewportHeight = height;
		this.viewportSource = 'manual';
		// DOM capture ran at the old viewport and no longer applies; recorded
		// geometry shares the recording's pixel space with the gaze data and
		// stays valid regardless of the stage viewport.
		this.capturedAois = {};
		this.sessionCorrection = { ...this.sessionCorrection, centerX: width / 2, centerY: height / 2 };
		this.scheduleRecompute();
	}

	/** The correction the panel currently edits (slide override or session default). */
	get activeCorrection(): SpatialCorrection {
		if (this.editSlideOnly && this.selectedSlide !== null) {
			return this.slideOverrides[this.selectedSlide] ?? this.sessionCorrection;
		}
		return this.sessionCorrection;
	}

	updateCorrection(patch: Partial<SpatialCorrection>): void {
		if (this.editSlideOnly && this.selectedSlide !== null) {
			const base = this.slideOverrides[this.selectedSlide] ?? { ...this.sessionCorrection };
			this.slideOverrides = {
				...this.slideOverrides,
				[this.selectedSlide]: { ...base, ...patch }
			};
		} else {
			this.sessionCorrection = { ...this.sessionCorrection, ...patch };
		}
		this.scheduleRecompute();
	}

	resetCorrection(): void {
		if (this.editSlideOnly && this.selectedSlide !== null) {
			const { [this.selectedSlide]: _removed, ...rest } = this.slideOverrides;
			void _removed;
			this.slideOverrides = rest;
		} else {
			this.sessionCorrection = identityCorrection(this.viewportWidth / 2, this.viewportHeight / 2);
		}
		this.scheduleRecompute();
	}

	/** Takes over another session's correction, re-centred on this viewport. */
	adoptCorrection(correction: SpatialCorrection): void {
		this.sessionCorrection = {
			...correction,
			centerX: this.viewportWidth / 2,
			centerY: this.viewportHeight / 2
		};
		this.scheduleRecompute();
	}

	registerGeometry(slide: number, aois: AoiRect[]): void {
		this.capturedAois = { ...this.capturedAois, [slide]: aois };
		this.scheduleRecompute();
	}

	hasGeometry(slide: number): boolean {
		return slide in this.recordedAois || slide in this.capturedAois;
	}

	geometryFor(slide: number | null): SlideGeometry | null {
		if (slide === null) return null;
		return this.buildGeometryMap().get(slide) ?? null;
	}

	private buildGeometryMap(): Map<number, SlideGeometry> {
		return buildGeometryMap(
			{ ...this.capturedAois, ...this.recordedAois },
			this.stimulusBySlide,
			{ width: this.viewportWidth, height: this.viewportHeight },
			{
				dwellArrow: this.settings.synthesizeDwellArrow,
				dwellEye: this.settings.synthesizeDwellEye
			}
		);
	}

	scheduleRecompute(): void {
		if (this.recomputeTimer !== null) clearTimeout(this.recomputeTimer);
		this.recomputeTimer = setTimeout(() => {
			this.recomputeTimer = null;
			this.recomputeNow();
		}, RECOMPUTE_DEBOUNCE_MS);
	}

	recomputeNow(): void {
		if (!this.session || this.session.rawGazeData.length === 0) return;
		const startedAt = performance.now();
		try {
			this.result = runReplay({
				session: this.session,
				corrections: buildCorrections(this.sessionCorrection, this.slideOverrides),
				geometryBySlide: this.buildGeometryMap(),
				options: {
					detectorParams: { ...this.settings.detectorParams },
					postProcessors: [],
					aoiAttribution: this.settings.aoiAttribution,
					dropUnfinishedFinalFixation: this.settings.dropUnfinishedFinalFixation,
					countFixationsOpenAtWindowEnd: this.settings.countFixationsOpenAtWindowEnd,
					gapResetMs: this.settings.gapResetMs,
					dropColdStartFixation: this.settings.dropColdStartFixation,
					rebaseRawTimestamps: this.settings.rebaseFor(this.session)
				},
				fluency: this.fluency ?? undefined
			});
			this.error = '';
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Přepočet selhal';
		}
		this.computedVersion = this.settings.version;
		this.recomputeMs = performance.now() - startedAt;
	}

	exportMeta(): CorrectedExportMeta {
		if (!this.session) throw new Error('Sezení není načteno');
		return {
			session: this.session,
			viewport: { width: this.viewportWidth, height: this.viewportHeight },
			sessionCorrection: $state.snapshot(this.sessionCorrection),
			slideOverrides: $state.snapshot(this.slideOverrides),
			detectorParams: $state.snapshot(this.settings.detectorParams),
			aoiAttribution: this.settings.aoiAttribution,
			dropUnfinishedFinalFixation: this.settings.dropUnfinishedFinalFixation,
			countFixationsOpenAtWindowEnd: this.settings.countFixationsOpenAtWindowEnd,
			gapResetMs: this.settings.gapResetMs,
			dropColdStartFixation: this.settings.dropColdStartFixation,
			rebaseRawTimestamps: this.settings.rebaseFor(this.session),
			synthesizeDwellArrow: this.settings.synthesizeDwellArrow,
			synthesizeDwellEye: this.settings.synthesizeDwellEye
		};
	}
}

/** The set of sessions picked for simulation plus the settings they share. */
export class SessionWorkspace {
	readonly settings = new SimSettings();
	slots = $state<SessionSimState[]>([]);
	activeKey = $state<string | null>(null);

	get active(): SessionSimState | null {
		return this.slots.find((slot) => slot.key === this.activeKey) ?? null;
	}

	get loadedCount(): number {
		return this.slots.filter((slot) => slot.status === 'ready').length;
	}

	/** Replaces the session set; sessions that stay selected keep their state. */
	setSources(sources: SessionSource[]): void {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const existing = new Map(this.slots.map((slot) => [slot.key, slot]));
		this.slots = sources.map(
			(source) => existing.get(source.key) ?? new SessionSimState(source, this.settings)
		);
		if (!this.slots.some((slot) => slot.key === this.activeKey)) {
			this.activeKey = this.slots[0]?.key ?? null;
		}
	}

	settingsChanged(): void {
		this.settings.version++;
		this.active?.scheduleRecompute();
	}

	/** Copies the active session's correction to every other session. */
	applyCorrectionToAll(): void {
		const from = this.active;
		if (!from) return;
		const correction = $state.snapshot(from.sessionCorrection);
		for (const slot of this.slots) {
			if (slot !== from) slot.adoptCorrection(correction);
		}
	}
}
