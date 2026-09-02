import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
import type { TestSessionDetailDTO } from '$lib/types/api.types';
import { downloadTestSessionFile } from '$lib/api/test-sessions';
import { parseGazeSamplesCsv, parseRawGazeDataCsv } from '$lib/utils/csvParser';
import {
	isBackupFileName,
	parseAoiGeometryJson,
	parseSessionMetaJson
} from '$lib/utils/sessionSim/loaders';
import { SESSION_META_FILE_NAME } from '$lib/utils/sessionMeta';

export interface RecalcSessionData {
	rawGazeData: RawGazeDataEntry[];
	gazeSamples: GazeSampleDataEntry[];
	/** Verbatim meta.json content, when the session has one. */
	metaRaw: string | null;
	/** Recording viewport recovered from geometry files or meta.json. */
	recordedViewport: { width: number; height: number } | null;
}

/**
 * Downloads just the files the recalculation needs (raw gaze + gaze samples
 * for stats and stimulus ids, meta.json and geometry for the recorded
 * viewport), skipping fixation and score CSVs. `samples: false` also skips
 * the gaze-sample CSVs, enough for the viewport verification.
 */
export async function loadRecalcSessionData(
	detail: TestSessionDetailDTO,
	options: { samples?: boolean } = {}
): Promise<RecalcSessionData> {
	const includeSamples = options.samples ?? true;
	type Kind = 'raw' | 'samples' | 'meta' | 'geometry';
	const wanted: { fileId: string; kind: Kind }[] = [];
	for (const part of detail.parts ?? []) {
		for (const file of part.files ?? []) {
			if (isBackupFileName(file.fileName)) continue;
			const lower = file.fileName.toLowerCase();
			if (lower === SESSION_META_FILE_NAME) wanted.push({ fileId: file.id, kind: 'meta' });
			else if (lower.includes('aoigeometry')) wanted.push({ fileId: file.id, kind: 'geometry' });
			else if (lower.includes('rawgazedata')) wanted.push({ fileId: file.id, kind: 'raw' });
			else if (includeSamples && lower.includes('gazesamples'))
				wanted.push({ fileId: file.id, kind: 'samples' });
		}
	}

	const data: RecalcSessionData = {
		rawGazeData: [],
		gazeSamples: [],
		metaRaw: null,
		recordedViewport: null
	};

	const downloads = await Promise.all(
		wanted.map(async ({ fileId, kind }) => {
			const blob = await downloadTestSessionFile(detail.id, fileId);
			return { kind, text: await blob.text() };
		})
	);

	for (const { kind, text } of downloads) {
		if (kind === 'raw') data.rawGazeData.push(...parseRawGazeDataCsv(text));
		else if (kind === 'samples') data.gazeSamples.push(...parseGazeSamplesCsv(text));
		else if (kind === 'meta') {
			if (parseSessionMetaJson(text)) data.metaRaw = text;
		} else {
			const geometry = parseAoiGeometryJson(text);
			if (geometry && geometry.viewport.width > 0 && geometry.viewport.height > 0) {
				data.recordedViewport ??= geometry.viewport;
			}
		}
	}

	if (!data.recordedViewport && data.metaRaw) {
		data.recordedViewport = parseSessionMetaJson(data.metaRaw)?.viewport ?? null;
	}

	data.rawGazeData.sort((a, b) => a.timestamp - b.timestamp);
	data.gazeSamples.sort((a, b) => a.timestamp - b.timestamp);
	return data;
}

/** Same tolerance as the sim's viewport warning; ET drifts slightly out of range. */
export const OUTSIDE_SHARE_WARNING = 0.02;

/** Share of valid gaze points outside the viewport, mirroring the sim's check. */
export function outsideViewportShare(
	rawGazeData: RawGazeDataEntry[],
	viewport: { width: number; height: number }
): number {
	const valid = rawGazeData.filter((row) => row.validityL || row.validityR);
	if (valid.length === 0) return 0;
	const outside = valid.filter(
		(row) => row.x < 0 || row.y < 0 || row.x > viewport.width || row.y > viewport.height
	).length;
	return outside / valid.length;
}

/** First recorded stimulus id per slide, mirroring the sim's resolution rule. */
export function stimulusBySlide(gazeSamples: GazeSampleDataEntry[]): Record<number, string> {
	const result: Record<number, string> = {};
	for (const sample of gazeSamples) {
		if (!(sample.slide_index in result) && sample.stimulus_id !== 'null') {
			result[sample.slide_index] = sample.stimulus_id;
		}
	}
	return result;
}

/** Earliest recorded timestamp per slide, used as the geometry interval start. */
export function slideStartTimestamps(
	rawGazeData: RawGazeDataEntry[],
	gazeSamples: GazeSampleDataEntry[]
): Record<number, number> {
	const result: Record<number, number> = {};
	for (const row of [...rawGazeData, ...gazeSamples]) {
		const current = result[row.slide_index];
		if (current === undefined || row.timestamp < current) result[row.slide_index] = row.timestamp;
	}
	return result;
}
