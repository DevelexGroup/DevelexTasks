import type { AoiRect } from '$lib/utils/sessionSim/types';
import type { RecalculatedItem } from '$lib/utils/sessionMeta';
import {
	addFilesToTestSessionPart,
	addTestSessionPart,
	getTestSessionDetail,
	processSessionPostProcessor,
	relocateSessionLogs,
	I2MC_DEFAULT_PARAMETERS,
	type RecalculationPreviewRow
} from '$lib/api/test-sessions';
import { PartType, type TestSessionDetailDTO, type TestSessionPartDTO } from '$lib/types/api.types';
import { parseTaskName } from '$lib/utils/sessionSim/taskName';
import { resolveSlide, type ResolvedSlide } from '$lib/utils/sessionSim/taskResolver';
import { buildRecalculatedMeta, mergeRecalculatedLedger, metaAsUploadFile } from './metaRebuild';
import { loadRecalcSessionData, slideStartTimestamps, stimulusBySlide } from './sessionData';

export interface RecalcItems {
	i2mc: boolean;
	/** Also reprocess sessions that already have I2MC output. */
	forceI2mc: boolean;
	meta: boolean;
	aoiGeometry: boolean;
	logs: boolean;
}

export interface RecalcSessionOutcome {
	sessionId: string;
	label: string;
	geometryUploaded: number;
	geometrySkipped: number;
	metaCreated: boolean;
	ledgerUpdated: boolean;
	i2mcStatus: string | null;
	logsMoved: number;
	errors: string[];
}

export interface Viewport {
	width: number;
	height: number;
}

/** Renders the resolved stimulus at the given viewport and returns its AOI rects. */
export type CaptureSlideFn = (resolved: ResolvedSlide, viewport: Viewport) => Promise<AoiRect[]>;

const AOI_GEOMETRY_VERSION = 1;

function geometryUploadFile(
	slideIndex: number,
	stimulusId: string,
	viewport: Viewport,
	aois: AoiRect[],
	fromTs: number | undefined
): File {
	const content = {
		version: AOI_GEOMETRY_VERSION,
		slideIndex,
		stimulusId,
		viewport,
		aois: aois.map((aoi) => ({
			id: aoi.id,
			left: aoi.left,
			top: aoi.top,
			right: aoi.right,
			bottom: aoi.bottom,
			bufferSize: aoi.bufferSize,
			...(fromTs !== undefined ? { fromTs } : {})
		}))
	};
	return new File([JSON.stringify(content, null, 2)], `aoiGeometry_slide${slideIndex}.json`, {
		type: 'application/json'
	});
}

export function sessionLabel(session: {
	username: string;
	testType: string;
	sessionStartTime: Date | string;
}): string {
	const start = new Date(session.sessionStartTime);
	const date = Number.isNaN(start.getTime()) ? '' : ` · ${start.toLocaleString('cs-CZ')}`;
	return `${session.username} · ${session.testType}${date}`;
}

function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

/**
 * Drives the session-by-session recalculation: per session it regenerates the
 * selected missing artifacts in dependency order (AOI geometry → meta.json
 * with its `recalculated` ledger → server-side I2MC → log relocation).
 * Stopping finishes the current session's in-flight step and halts, leaving
 * only complete, re-runnable state behind.
 */
export class RecalcRunner {
	running = $state(false);
	stopping = $state(false);
	processed = $state(0);
	total = $state(0);
	currentLabel = $state('');
	outcomes = $state<RecalcSessionOutcome[]>([]);

	constructor(private capture: CaptureSlideFn) {}

	stop(): void {
		if (this.running) this.stopping = true;
	}

	static sessionNeedsWork(row: RecalculationPreviewRow, items: RecalcItems): boolean {
		return (
			(items.i2mc && row.hasRawData && (row.missingI2mc || items.forceI2mc)) ||
			(items.meta && row.missingMeta) ||
			(items.aoiGeometry && row.missingAoiGeometry) ||
			(items.logs && row.misplacedLogs)
		);
	}

	/** Steps that render or describe the screen depend on the viewport. */
	static sessionUsesViewport(row: RecalculationPreviewRow, items: RecalcItems): boolean {
		return (items.meta && row.missingMeta) || (items.aoiGeometry && row.missingAoiGeometry);
	}

	async run(
		rows: RecalculationPreviewRow[],
		items: RecalcItems,
		fallbackViewport: Viewport
	): Promise<void> {
		if (this.running) return;
		const pending = rows.filter((row) => RecalcRunner.sessionNeedsWork(row, items));

		this.running = true;
		this.stopping = false;
		this.processed = 0;
		this.total = pending.length;
		this.outcomes = [];

		try {
			for (const row of pending) {
				if (this.stopping) break;
				const outcome = await this.processSession(row, items, fallbackViewport);
				this.outcomes = [...this.outcomes, outcome];
				this.processed++;
			}
		} finally {
			this.running = false;
			this.stopping = false;
			this.currentLabel = '';
		}
	}

	private async processSession(
		row: RecalculationPreviewRow,
		items: RecalcItems,
		fallbackViewport: Viewport
	): Promise<RecalcSessionOutcome> {
		const outcome: RecalcSessionOutcome = {
			sessionId: row.sessionId,
			label: row.sessionId,
			geometryUploaded: 0,
			geometrySkipped: 0,
			metaCreated: false,
			ledgerUpdated: false,
			i2mcStatus: null,
			logsMoved: 0,
			errors: []
		};

		let detail: TestSessionDetailDTO;
		try {
			detail = await getTestSessionDetail(row.sessionId);
		} catch (err) {
			outcome.errors.push(`Načtení detailu selhalo: ${errorMessage(err)}`);
			return outcome;
		}
		outcome.label = sessionLabel(detail);
		this.currentLabel = outcome.label;

		const rebuildGeometry = items.aoiGeometry && row.missingAoiGeometry;
		const rebuildMeta = items.meta && row.missingMeta;

		let data: Awaited<ReturnType<typeof loadRecalcSessionData>> | null = null;
		if (rebuildGeometry || rebuildMeta) {
			try {
				data = await loadRecalcSessionData(detail);
			} catch (err) {
				outcome.errors.push(`Stažení dat selhalo: ${errorMessage(err)}`);
			}
		}
		const viewport = data?.recordedViewport ?? fallbackViewport;

		if (rebuildGeometry && data) {
			await this.rebuildGeometry(detail, data, viewport, outcome);
		}

		if (this.stopping) return outcome;

		if (rebuildMeta && data) {
			try {
				const metaItems: RecalculatedItem[] = ['meta'];
				if (outcome.geometryUploaded > 0) metaItems.push('aoiGeometry');
				const meta = buildRecalculatedMeta({
					detail,
					rawGazeData: data.rawGazeData,
					gazeSamples: data.gazeSamples,
					viewport,
					items: metaItems
				});
				const metaPart =
					detail.parts?.find((part) => part.partType === PartType.Meta) ??
					(await addTestSessionPart(detail.id, 0, PartType.Meta));
				await addFilesToTestSessionPart(detail.id, metaPart.id, [
					metaAsUploadFile(JSON.stringify(meta, null, 2))
				]);
				outcome.metaCreated = true;
			} catch (err) {
				outcome.errors.push(`Vytvoření meta.json selhalo: ${errorMessage(err)}`);
			}
		} else if (outcome.geometryUploaded > 0 && data?.metaRaw) {
			// Geometry changed under an existing meta.json — extend its ledger in place
			try {
				const metaPart = detail.parts?.find((part) => part.partType === PartType.Meta);
				if (metaPart) {
					const merged = mergeRecalculatedLedger(data.metaRaw, ['aoiGeometry']);
					await addFilesToTestSessionPart(detail.id, metaPart.id, [metaAsUploadFile(merged)], true);
					outcome.ledgerUpdated = true;
				}
			} catch (err) {
				outcome.errors.push(`Aktualizace meta.json selhala: ${errorMessage(err)}`);
			}
		}

		if (this.stopping) return outcome;

		if (items.i2mc && row.hasRawData && (row.missingI2mc || items.forceI2mc)) {
			try {
				const result = await processSessionPostProcessor(
					detail.id,
					'i2mc',
					{ ...I2MC_DEFAULT_PARAMETERS },
					items.forceI2mc
				);
				outcome.i2mcStatus = result.status;
				if (result.status === 'FAILED') {
					outcome.errors.push(`I2MC selhalo: ${result.message ?? 'neznámá chyba'}`);
				}
			} catch (err) {
				outcome.i2mcStatus = 'FAILED';
				outcome.errors.push(`I2MC selhalo: ${errorMessage(err)}`);
			}
		}

		if (this.stopping) return outcome;

		if (items.logs && row.misplacedLogs) {
			try {
				outcome.logsMoved = await relocateSessionLogs(detail.id);
			} catch (err) {
				outcome.errors.push(`Přesun logů selhal: ${errorMessage(err)}`);
			}
		}

		return outcome;
	}

	private async rebuildGeometry(
		detail: TestSessionDetailDTO,
		data: Awaited<ReturnType<typeof loadRecalcSessionData>>,
		viewport: Viewport,
		outcome: RecalcSessionOutcome
	): Promise<void> {
		const parsed = parseTaskName(detail.testType);
		const stimuli = stimulusBySlide(data.gazeSamples);
		const slideStarts = slideStartTimestamps(data.rawGazeData, data.gazeSamples);

		const missingParts = (detail.parts ?? []).filter(
			(part: TestSessionPartDTO) =>
				part.partType !== PartType.Meta &&
				(part.files ?? []).some((file) => file.fileName.startsWith('rawGazeData')) &&
				!(part.files ?? []).some((file) => file.fileName.startsWith('aoiGeometry'))
		);

		for (const part of missingParts) {
			if (this.stopping) return;
			const slide = part.partNumber;
			const stimulusId = stimuli[slide];
			const resolved = parsed && stimulusId ? resolveSlide(parsed, stimulusId) : null;
			if (!resolved) {
				outcome.geometrySkipped++;
				continue;
			}
			try {
				const aois = await this.capture(resolved, viewport);
				const file = geometryUploadFile(slide, stimulusId, viewport, aois, slideStarts[slide]);
				await addFilesToTestSessionPart(detail.id, part.id, [file]);
				outcome.geometryUploaded++;
			} catch (err) {
				outcome.errors.push(`Geometrie slidu ${slide} selhala: ${errorMessage(err)}`);
			}
		}
	}
}
