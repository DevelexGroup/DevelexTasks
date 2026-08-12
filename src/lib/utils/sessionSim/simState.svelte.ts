import { buildCorrections, buildGeometryMap, distinctSlides } from './builders';
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
	type ReplayResult,
	type SlideGeometry,
	type SpatialCorrection
} from './types';

const RECOMPUTE_DEBOUNCE_MS = 120;

export class SessionSimState {
	session = $state<LoadedSession | null>(null);
	parsedTask = $state<ParsedTaskName | null>(null);
	slides = $state<number[]>([]);
	stimulusBySlide = $state<Record<number, string>>({});
	resolvedBySlide = $state<Record<number, ResolvedSlide | null>>({});
	selectedSlide = $state<number | null>(null);

	viewportWidth = $state(1920);
	viewportHeight = $state(1080);

	sessionCorrection = $state<SpatialCorrection>(identityCorrection(960, 540));
	slideOverrides = $state<Record<number, SpatialCorrection>>({});
	editSlideOnly = $state(false);

	detectorParams = $state<DetectorParams>({ ...DEFAULT_DETECTOR_PARAMS });
	aoiAttribution = $state<AoiAttributionStrategy>('snapshot-at-start');
	dropUnfinishedFinalFixation = $state(true);
	countFixationsOpenAtWindowEnd = $state(false);
	gapResetMs = $state(DEFAULT_GAP_RESET_MS);
	dropColdStartFixation = $state(false);
	rebaseRawTimestamps = $state(false);
	synthesizeDwellArrow = $state(true);
	synthesizeDwellEye = $state(true);

	capturedAois = $state<Record<number, AoiRect[]>>({});
	result = $state<ReplayResult | null>(null);
	recomputeMs = $state<number | null>(null);
	error = $state('');

	private fluency: FluencyResolver | null = null;
	private recomputeTimer: ReturnType<typeof setTimeout> | null = null;

	get warnings(): string[] {
		return [...(this.session?.warnings ?? []), ...(this.result?.warnings ?? [])];
	}

	loadSession(session: LoadedSession): void {
		this.session = session;
		this.parsedTask = parseTaskName(session.taskName);
		this.error = this.parsedTask
			? ''
			: `Neznámý název úlohy "${session.taskName}" – stimuly nelze vykreslit.`;

		const slides = distinctSlides(session.gazeSamples);
		this.slides = slides;

		const stimulusBySlide: Record<number, string> = {};
		const resolvedBySlide: Record<number, ResolvedSlide | null> = {};
		for (const slide of slides) {
			const row = session.gazeSamples.find(
				(sample) => sample.slide_index === slide && sample.stimulus_id !== 'null'
			);
			stimulusBySlide[slide] = row?.stimulus_id ?? 'null';
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
		this.capturedAois = {};
		this.slideOverrides = {};
		this.sessionCorrection = identityCorrection(this.viewportWidth / 2, this.viewportHeight / 2);
		this.result = null;
		this.scheduleRecompute();
	}

	setViewport(width: number, height: number): void {
		if (width === this.viewportWidth && height === this.viewportHeight) return;
		this.viewportWidth = width;
		this.viewportHeight = height;
		// Geometry was captured at the old viewport, AOI rects no longer apply
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

	registerGeometry(slide: number, aois: AoiRect[]): void {
		this.capturedAois = { ...this.capturedAois, [slide]: aois };
		this.scheduleRecompute();
	}

	geometryFor(slide: number | null): SlideGeometry | null {
		if (slide === null) return null;
		return this.buildGeometryMap().get(slide) ?? null;
	}

	private buildGeometryMap(): Map<number, SlideGeometry> {
		return buildGeometryMap(
			this.capturedAois,
			this.stimulusBySlide,
			{ width: this.viewportWidth, height: this.viewportHeight },
			{ dwellArrow: this.synthesizeDwellArrow, dwellEye: this.synthesizeDwellEye }
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
					detectorParams: { ...this.detectorParams },
					postProcessors: [],
					aoiAttribution: this.aoiAttribution,
					dropUnfinishedFinalFixation: this.dropUnfinishedFinalFixation,
					countFixationsOpenAtWindowEnd: this.countFixationsOpenAtWindowEnd,
					gapResetMs: this.gapResetMs,
					dropColdStartFixation: this.dropColdStartFixation,
					rebaseRawTimestamps: this.rebaseRawTimestamps
				},
				fluency: this.fluency ?? undefined
			});
			this.error = '';
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Přepočet selhal';
		}
		this.recomputeMs = performance.now() - startedAt;
	}
}
