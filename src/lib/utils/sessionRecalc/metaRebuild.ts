import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
import type { TestSessionDetailDTO } from '$lib/types/api.types';
import type { GazeSignalSummary } from '$lib/utils/analyticsManager';
import {
	SESSION_META_FILE_NAME,
	type RecalculatedItem,
	type SessionMeta,
	type SessionMetaRecalculated
} from '$lib/utils/sessionMeta';
import { parseTaskName } from '$lib/utils/sessionSim/taskName';

export const RECALC_DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

const UNKNOWN = 'unknown';

function ledger(items: RecalculatedItem[]): SessionMetaRecalculated {
	return { at: new Date().toISOString(), appVersion: __APP_VERSION__, items };
}

/** Mirrors the live AnalyticsManager counters, replayed over recorded raw rows. */
function signalFromRawRows(rows: RawGazeDataEntry[]): GazeSignalSummary {
	let validSampleCount = 0;
	let timedSampleCount = 0;
	let firstDeviceMs: number | null = null;
	let lastDeviceMs: number | null = null;
	let firstDeviceTimestamp: string | null = null;
	let lastDeviceTimestamp: string | null = null;

	for (const row of rows) {
		if (row.validityL || row.validityR) validSampleCount++;
		const deviceMs = Date.parse(row.deviceTimeStamp);
		if (!Number.isNaN(deviceMs)) {
			timedSampleCount++;
			firstDeviceMs ??= deviceMs;
			lastDeviceMs = deviceMs;
			firstDeviceTimestamp ??= row.deviceTimeStamp;
			lastDeviceTimestamp = row.deviceTimeStamp;
		}
	}

	const spanMs = firstDeviceMs !== null && lastDeviceMs !== null ? lastDeviceMs - firstDeviceMs : 0;
	const measuredFrequencyHz =
		spanMs > 0 && timedSampleCount > 1
			? Math.round(((timedSampleCount - 1) / spanMs) * 1000 * 10) / 10
			: null;

	return {
		sampleCount: rows.length,
		validSampleCount,
		timedSampleCount,
		measuredFrequencyHz,
		firstDeviceSampleAt: firstDeviceTimestamp,
		lastDeviceSampleAt: lastDeviceTimestamp
	};
}

function toIso(value: Date | string | null | undefined): string | null {
	if (!value) return null;
	const ms = new Date(value).getTime();
	return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

interface BuildRecalculatedMetaOptions {
	detail: TestSessionDetailDTO;
	rawGazeData: RawGazeDataEntry[];
	gazeSamples: GazeSampleDataEntry[];
	viewport: { width: number; height: number };
	items: RecalculatedItem[];
}

/**
 * Reconstructs a meta.json for a session recorded before meta files existed.
 * Session identity and signal stats come from the database and the recorded
 * CSVs; the environment (screen, browser, tracker config) is unrecoverable and
 * gets neutral defaults, flagged by the `recalculated` ledger.
 */
export function buildRecalculatedMeta({
	detail,
	rawGazeData,
	gazeSamples,
	viewport,
	items
}: BuildRecalculatedMetaOptions): SessionMeta {
	const parsed = parseTaskName(detail.testType);
	const result = gazeSamples.findLast((sample) => sample.task_result !== null)?.task_result ?? null;

	const samplesPerSlide: Record<number, number> = {};
	for (const row of rawGazeData) {
		samplesPerSlide[row.slide_index] = (samplesPerSlide[row.slide_index] ?? 0) + 1;
	}

	return {
		metaVersion: 1,
		app: { version: UNKNOWN, sdkVersion: UNKNOWN },
		session: {
			remoteSessionId: detail.id,
			localSessionId: rawGazeData[0]?.session_id ?? gazeSamples[0]?.session_id ?? null,
			userId: detail.userId,
			username: detail.username,
			task: detail.testType,
			taskMode: parsed?.mode ?? null,
			result,
			startedAt: toIso(detail.sessionStartTime),
			endedAt: toIso(detail.sessionEndTime) ?? toIso(detail.sessionStartTime) ?? '',
			samplesPerSlide
		},
		screen: {
			width: viewport.width,
			height: viewport.height,
			availWidth: viewport.width,
			availHeight: viewport.height,
			colorDepth: 24,
			devicePixelRatio: 1,
			orientation: null
		},
		viewport: {
			innerWidth: viewport.width,
			innerHeight: viewport.height,
			outerWidth: viewport.width,
			outerHeight: viewport.height
		},
		viewportCalibration: null,
		tracker: {
			selected: UNKNOWN,
			config: null,
			status: null,
			deviceCalibratedAt: null,
			signal: signalFromRawRows(rawGazeData)
		},
		browser: {
			userAgent: UNKNOWN,
			platform: null,
			brands: null,
			mobile: null,
			languages: [],
			timeZone: null,
			utcOffsetMinutes: 0,
			hardwareConcurrency: null,
			crossOriginIsolated: false
		},
		recalculated: ledger(items)
	};
}

/** Adds/extends the `recalculated` ledger in an existing meta.json, leaving the rest verbatim. */
export function mergeRecalculatedLedger(metaRaw: string, items: RecalculatedItem[]): string {
	const doc = JSON.parse(metaRaw) as Record<string, unknown>;
	const existing = doc.recalculated as SessionMetaRecalculated | undefined;
	doc.recalculated = ledger([...new Set([...(existing?.items ?? []), ...items])]);
	return JSON.stringify(doc, null, 2);
}

export function metaAsUploadFile(content: string): File {
	return new File([content], SESSION_META_FILE_NAME, { type: 'application/json' });
}
