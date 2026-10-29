import type { PostProcessor } from '$lib/api/test-sessions';
import { DatabaseExporter } from '$lib/utils/databaseExport';
import {
	readOutputRows,
	shiftOutputFile,
	slideOfOutputFile,
	type ProcessorOutputFile,
	type ShiftContext
} from '$lib/utils/postProcessing/outputs';
import { buildCorrections, buildGeometryMap } from './builders';
import type { CorrectedExportMeta, ExportedProcessorOutput } from './export';
import { correctionForSlide, shiftMapper, type CorrectionSnapshot } from './layers';
import { createFluencyResolver } from './metrics/fluencyRegistry';
import { runReplay } from './replay';
import { identityCorrection, transformRawEntry } from './transform';
import { describeSession } from './sessionView';
import type { ParsedTaskName } from './taskName';
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
	type RecordedSlideGeometry,
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

/** A processor's output recomputed on corrected raw data. */
export interface ProcessorRerun {
	processor: PostProcessor;
	files: ProcessorOutputFile[];
	/** The correction the input was transformed with. */
	corrections: CorrectionSnapshot;
	parameters: Record<string, unknown>;
}

/** A processor's output as shown, before shifting; computedUnder null = uncorrected data. */
export interface ProcessorLayer {
	processor: PostProcessor;
	files: ProcessorOutputFile[];
	source: 'stored' | 'rerun';
	computedUnder: CorrectionSnapshot | null;
}

function layerSlides(layer: ProcessorLayer): number[] {
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const slides = new Set<number>();
	for (const file of layer.files) {
		if (layer.processor.output) {
			for (const row of readOutputRows(file, layer.processor.output)) slides.add(row.slide);
		} else {
			const slide = slideOfOutputFile(file, null);
			if (slide !== null) slides.add(slide);
		}
	}
	return [...slides];
}

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
	/** Processor results recomputed on corrected data, by processor name; they replace the stored output. */
	reruns = $state<Record<string, ProcessorRerun>>({});
	recomputeMs = $state<number | null>(null);
	error = $state('');

	private fluency: FluencyResolver | null = null;
	private recomputeTimer: ReturnType<typeof setTimeout> | null = null;
	private computedVersion = -1;
	private loadPromise: Promise<LoadedSession> | null = null;
	/** Correction adopted before the data arrived; applied once the viewport is known. */
	private pendingCorrection: SpatialCorrection | null = null;
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
		const view = describeSession(session);
		this.parsedTask = view.parsedTask;
		this.error = this.parsedTask
			? ''
			: `Neznámý název úlohy "${session.taskName}" – stimuly nelze vykreslit.`;
		this.slides = view.slides;
		this.stimulusBySlide = view.stimulusBySlide;
		this.resolvedBySlide = view.resolvedBySlide;

		this.fluency = this.parsedTask
			? createFluencyResolver(this.parsedTask.slug, (stimulusId) => {
					const resolved = this.parsedTask ? resolveSlide(this.parsedTask, stimulusId) : null;
					return resolved?.stimulus.raw ?? null;
				})
			: null;

		this.selectedSlide = view.slides[0] ?? null;

		if (view.viewport) {
			this.viewportWidth = view.viewport.width;
			this.viewportHeight = view.viewport.height;
		}
		this.viewportSource = view.viewportSource;
		this.recordedAois = view.recordedAois;
		this.capturedAois = {};
		this.slideOverrides = {};
		this.sessionCorrection = this.pendingCorrection
			? this.centred(this.pendingCorrection)
			: identityCorrection(this.viewportWidth / 2, this.viewportHeight / 2);
		this.pendingCorrection = null;
		this.reruns = {};
		this.result = null;
		this.scheduleRecompute();
	}

	correctionSnapshot(): CorrectionSnapshot {
		return $state.snapshot({
			sessionCorrection: this.sessionCorrection,
			slideOverrides: this.slideOverrides
		});
	}

	/** Each processor's re-run result if any, else its stored output. */
	get layers(): ProcessorLayer[] {
		const layers: ProcessorLayer[] = (this.session?.processorOutputs ?? [])
			.filter((stored) => !this.reruns[stored.processor.name])
			.map((stored) => ({ ...stored, source: 'stored', computedUnder: null }));
		for (const rerun of Object.values(this.reruns)) {
			layers.push({
				processor: rerun.processor,
				files: rerun.files,
				source: 'rerun',
				computedUnder: rerun.corrections
			});
		}
		return layers.sort((a, b) => a.processor.name.localeCompare(b.processor.name));
	}

	/** The layer's files moved from the correction they were computed under to the current one. */
	shiftedFiles(layer: ProcessorLayer, onlySlide?: number): ProcessorOutputFile[] {
		const schema = layer.processor.output;
		if (!schema) return layer.files;
		const mapper = shiftMapper(this.correctionSnapshot(), layer.computedUnder);
		const geometry = this.buildGeometryMap();
		const context: ShiftContext = {
			mapperFor: (slide) => (onlySlide === undefined || slide === onlySlide ? mapper(slide) : null),
			aoisFor: (slide) => geometry.get(slide)?.aois ?? null
		};
		return layer.files.map((file) => shiftOutputFile(file, schema, context));
	}

	/** True when the current correction differs from the one the layer was computed under on any of its slides. */
	isShifted(layer: ProcessorLayer): boolean {
		const mapper = shiftMapper(this.correctionSnapshot(), layer.computedUnder);
		return layerSlides(layer).some((slide) => mapper(slide) !== null);
	}

	/** The sim can only feed processors that read raw gaze. */
	canRerun(processor: PostProcessor): boolean {
		return (
			processor.inputFilePrefix === 'rawGazeData' && (this.session?.rawGazeData.length ?? 0) > 0
		);
	}

	/**
	 * Input files for re-running a processor on the corrected data, or null when
	 * the sim cannot provide its main input. Raw timestamps stay as recorded.
	 */
	rerunInputs(
		processor: PostProcessor,
		corrections: CorrectionSnapshot = this.correctionSnapshot()
	): { name: string; content: string }[] | null {
		const session = this.session;
		if (!session || !this.canRerun(processor)) return null;
		const corrected = session.rawGazeData.map((row) =>
			transformRawEntry(row, correctionForSlide(corrections, row.slide_index))
		);
		const files = [
			{
				name: 'rawGazeData.csv',
				content: DatabaseExporter.createCsvContent(corrected, 'rawGazeData')
			}
		];
		if (processor.auxiliaryInputFilePrefixes.includes('aoiGeometry')) {
			for (const geometry of this.geometryFiles()) {
				files.push({
					name: `aoiGeometry_slide${geometry.slideIndex}.json`,
					content: JSON.stringify(geometry)
				});
			}
		}
		return files;
	}

	/** Recorded geometry, plus captured geometry for slides that have none recorded. */
	private geometryFiles(): RecordedSlideGeometry[] {
		const files = [...(this.session?.recordedGeometry ?? [])];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const recorded = new Set(files.map((geometry) => geometry.slideIndex));
		for (const [slideKey, aois] of Object.entries(this.capturedAois)) {
			const slide = Number(slideKey);
			if (recorded.has(slide)) continue;
			files.push({
				slideIndex: slide,
				stimulusId: this.stimulusBySlide[slide] ?? null,
				viewport: { width: this.viewportWidth, height: this.viewportHeight },
				aois: $state.snapshot(aois)
			});
		}
		return files.sort((a, b) => a.slideIndex - b.slideIndex);
	}

	setRerun(rerun: ProcessorRerun): void {
		this.reruns = { ...this.reruns, [rerun.processor.name]: rerun };
	}

	revertRerun(processorName: string): void {
		const { [processorName]: _removed, ...rest } = this.reruns;
		void _removed;
		this.reruns = rest;
	}

	exportOutputs(): ExportedProcessorOutput[] {
		return this.layers.map((layer) => {
			const shifted = !!layer.processor.output && this.isShifted(layer);
			const stale = !layer.processor.output && this.isShifted(layer);
			return {
				processor: layer.processor,
				files: shifted ? this.shiftedFiles(layer) : layer.files,
				source: layer.source,
				shifted,
				stale,
				parameters: this.reruns[layer.processor.name]?.parameters ?? null
			};
		});
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
		if (!this.session) {
			this.pendingCorrection = correction;
			return;
		}
		this.sessionCorrection = this.centred(correction);
		this.scheduleRecompute();
	}

	private centred(correction: SpatialCorrection): SpatialCorrection {
		return { ...correction, centerX: this.viewportWidth / 2, centerY: this.viewportHeight / 2 };
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
