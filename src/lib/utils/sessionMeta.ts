import type { GazeInputConfig, GazeManager } from 'develex-js-sdk';
import type { AnalyticsManager, GazeSignalSummary } from '$lib/utils/analyticsManager';
import { GAZE_INPUT_CONFIGS, trackerConfig } from '$lib/stores/tracker';
import { currentTask } from '$lib/stores/task';
import { authUser } from '$lib/stores/auth';
import { formatTaskName } from '$lib/utils/taskMode';
import { db } from '$lib/database/db';
import { get } from 'svelte/store';

export const SESSION_META_FILE_NAME = 'meta.json';

interface ScreenMeta {
	width: number;
	height: number;
	availWidth: number;
	availHeight: number;
	colorDepth: number;
	devicePixelRatio: number;
	orientation: string | null;
}

interface ViewportMeta {
	innerWidth: number;
	innerHeight: number;
	outerWidth: number;
	outerHeight: number;
}

interface TrackerMeta {
	/** Key selected in settings, e.g. `gazepoint_idt`. */
	selected: string;
	/** Full input config — tracker type, fixation detection, bridge URI, dummy frequency. */
	config: GazeInputConfig | null;
	status: string | null;
	deviceCalibratedAt: string | null;
	signal: GazeSignalSummary;
}

interface BrowserMeta {
	userAgent: string;
	platform: string | null;
	brands: string[] | null;
	mobile: boolean | null;
	/** Most preferred first, so this covers `navigator.language` too. */
	languages: string[];
	timeZone: string | null;
	utcOffsetMinutes: number;
	hardwareConcurrency: number | null;
	crossOriginIsolated: boolean;
}

interface SessionMetaSection {
	remoteSessionId: string;
	localSessionId: string | null;
	userId: string | null;
	username: string | null;
	/** Canonical name used as the backend test type and as `task_name` in the CSVs. */
	task: string | null;
	/** Not recoverable from `task`, which omits the default mode. */
	taskMode: string | null;
	result: string | null;
	startedAt: string | null;
	endedAt: string;
	samplesPerSlide: Record<number, number>;
}

export type RecalculatedItem = 'meta' | 'aoiGeometry';

/**
 * Ledger of artifacts reconstructed after the fact by the admin recalculation
 * dialog. Consumers should treat the listed data as an approximation of the
 * recording environment, not a live capture.
 */
export interface SessionMetaRecalculated {
	at: string;
	appVersion: string;
	items: RecalculatedItem[];
}

export interface SessionMeta {
	metaVersion: number;
	app: { version: string; sdkVersion: string };
	session: SessionMetaSection;
	screen: ScreenMeta;
	viewport: ViewportMeta;
	/** SDK mapping from tracker screen coordinates to page coordinates. */
	viewportCalibration: unknown;
	tracker: TrackerMeta;
	browser: BrowserMeta;
	recalculated?: SessionMetaRecalculated;
}

interface BuildSessionMetaOptions {
	remoteSessionId: string;
	startedAt: Date | null;
	gazeManager: GazeManager;
	analyticsManager: AnalyticsManager;
}

/** Reads the per-slide raw sample counts recorded for the local session. */
async function collectSamplesPerSlide(
	childId: string | null,
	localSessionId: string | null
): Promise<Record<number, number>> {
	if (!childId || !localSessionId) return {};
	const counts: Record<number, number> = {};
	await db.rawGazeData
		.where('[child_id+session_id]')
		.equals([childId, localSessionId])
		.each((entry) => {
			counts[entry.slide_index] = (counts[entry.slide_index] ?? 0) + 1;
		});
	return counts;
}

function readScreen(): ScreenMeta {
	return {
		width: window.screen.width,
		height: window.screen.height,
		availWidth: window.screen.availWidth,
		availHeight: window.screen.availHeight,
		colorDepth: window.screen.colorDepth,
		devicePixelRatio: window.devicePixelRatio,
		orientation: window.screen.orientation?.type ?? null
	};
}

function readBrowser(): BrowserMeta {
	const uaData = (
		navigator as Navigator & {
			userAgentData?: {
				platform?: string;
				mobile?: boolean;
				brands?: { brand: string; version: string }[];
			};
		}
	).userAgentData;

	return {
		userAgent: navigator.userAgent,
		platform: uaData?.platform ?? null,
		brands: uaData?.brands?.map((b) => `${b.brand} ${b.version}`) ?? null,
		mobile: uaData?.mobile ?? null,
		languages: [...navigator.languages],
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
		utcOffsetMinutes: -new Date().getTimezoneOffset(),
		hardwareConcurrency: navigator.hardwareConcurrency ?? null,
		crossOriginIsolated: window.crossOriginIsolated
	};
}

function readTracker(gazeManager: GazeManager, signal: GazeSignalSummary): TrackerMeta {
	const selected = get(trackerConfig);
	const config = gazeManager.input?.config ?? GAZE_INPUT_CONFIGS[selected] ?? null;
	const lastStatus = gazeManager.lastStatus;

	return {
		selected,
		config,
		status: lastStatus?.tracker?.status ?? null,
		deviceCalibratedAt: lastStatus?.tracker?.calibration ?? null,
		signal
	};
}

/** Assembles the environment snapshot uploaded as `meta.json` in the session's meta part. */
export async function buildSessionMeta({
	remoteSessionId,
	startedAt,
	gazeManager,
	analyticsManager
}: BuildSessionMetaOptions): Promise<SessionMeta> {
	const task = get(currentTask);
	const user = get(authUser);
	const endedAt = new Date();
	const samplesPerSlide = await collectSamplesPerSlide(
		user?.username ?? null,
		task?.sessionId ?? null
	);

	return {
		metaVersion: 1,
		app: { version: __APP_VERSION__, sdkVersion: __SDK_VERSION__ },
		session: {
			remoteSessionId,
			localSessionId: task?.sessionId ?? null,
			userId: user?.userId ?? null,
			username: user?.username ?? null,
			task: task ? formatTaskName(task.slug, task.level, task.mode) : null,
			taskMode: task?.mode ?? null,
			result: task?.result ?? null,
			startedAt: startedAt?.toISOString() ?? null,
			endedAt: endedAt.toISOString(),
			samplesPerSlide
		},
		screen: readScreen(),
		viewport: {
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
			outerWidth: window.outerWidth,
			outerHeight: window.outerHeight
		},
		viewportCalibration: gazeManager.windowCalibration,
		tracker: readTracker(gazeManager, analyticsManager.getGazeSignal()),
		browser: readBrowser()
	};
}

export function sessionMetaAsFile(meta: SessionMeta): File {
	return new File([JSON.stringify(meta, null, 2)], SESSION_META_FILE_NAME, {
		type: 'application/json'
	});
}
