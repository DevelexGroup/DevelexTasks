import {
	type BaseDataEntry,
	type FixationDataEntry,
	type GazeSampleDataEntry,
	type RawGazeDataEntry,
	type SessionScoreMetrics
} from '$lib/database/db.types';
import { get } from 'svelte/store';
import { currentTask } from '$lib/stores/task';
import { formatTaskName } from '$lib/utils/taskMode';
import { type TaskMistake, TaskResult, type TrackTaskState } from '$lib/types/task.types';
import type {
	FixationDataPoint,
	GazeDataPoint,
	GazeInteractionObjectIntersectEvent,
	GazeManager
} from 'develex-js-sdk';
import { browser } from '$app/environment';
import Dexie from 'dexie';
import { db } from '$lib/database/db';
import { authUser } from '$lib/stores/auth';
import {
	type SlideTimeWindow,
	getEffectiveTimeWindow,
	getEffectiveTimeWindows,
	filterSamplesInWindow,
	filterFixationsInWindow,
	calculateErrorRate,
	calculateResponseTime,
	calculateMeanFixationDuration,
	calculateAOITargetFixations,
	calculateAOIFieldFixations,
	calculateRegressionCount
} from '$lib/utils/scoreMetrics';

/** All timing here comes from the tracker's own clock, never the bridge or main-thread stamps. */
export interface GazeSignalSummary {
	sampleCount: number;
	validSampleCount: number;
	/** Samples that carried a parseable device timestamp; the rate is measured over these. */
	timedSampleCount: number;
	measuredFrequencyHz: number | null;
	firstDeviceSampleAt: string | null;
	lastDeviceSampleAt: string | null;
}

interface Deferred {
	promise: Promise<void>;
	resolve: () => void;
}

function createDeferred(): Deferred {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => (resolve = r));
	return { promise, resolve };
}

export class AnalyticsManager {
	private POLLING_RATE_HZ = 120;
	private POLLING_INTERVAL_MS = 1000 / this.POLLING_RATE_HZ;

	private RAW_GAZE_FLUSH_INTERVAL_MS = 500;

	private CLICK_EVENT_PREFIX = 'mouse_';
	private KEYBOARD_EVENT_PREFIX = 'key_';

	private PAUSE_LOGGING_EVENT = 'pause_logging';
	private RESUME_LOGGING_EVENT = 'resume_logging';

	private timerWorker: Worker | null = null;
	private rawGazeFlushTimer: ReturnType<typeof setInterval> | null = null;
	private rawGazeBuffer: RawGazeDataEntry[] = [];

	// SharedArrayBuffer written by the main thread on every eyetracker inputData
	// event and read by the worker at the exact scheduled tick moment.
	// Layout (Int32Array): [x×100, y×100, parseValidity]
	private gazeSharedBuf: SharedArrayBuffer | null = null;
	private gazeSharedArray: Int32Array | null = null;

	private lastDeviceTimestamp: string = '';
	private lastSampleBridgeMs: number | null = null;
	private eyetrackerPosition: { x: number; y: number } = { x: 0, y: 0 };
	private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
	private playedSounds: Set<string> = new Set<string>();
	private activeAOI: Set<string> = new Set<string>();

	private activeFixations: FixationDataEntry[] = [];

	// Signal quality and device-clock timing observed over the session, for the meta file.
	private gazeSignal = {
		sampleCount: 0,
		validSampleCount: 0,
		timedSampleCount: 0,
		firstDeviceMs: null as number | null,
		lastDeviceMs: null as number | null,
		firstDeviceTimestamp: null as string | null,
		lastDeviceTimestamp: null as string | null
	};

	private eventBuffer = {
		events: new Set<string>(),
		mistake_type: new Set<string>()
	};

	private gazeManager: GazeManager;

	private loggingPaused = false;
	private pauseRequest = false;

	// private calculateScoreRequest = false;
	private calculateScoreSlideRequest: number[] = [];

	// Waiting tokens for slide processing completion
	private slideProcessingTokens: Map<number, Deferred> = new Map();

	private currentTaskState: TrackTaskState | null = null;
	private currentMetricEvaluation:
		| ((scoreMetrics: Partial<SessionScoreMetrics>, state: TrackTaskState) => number)
		| null = null;

	constructor(gazeManager: GazeManager) {
		this.gazeManager = gazeManager;
	}

	/* *************************** *
	 * Token management for slide processing
	 * *************************** */

	private createSlideProcessingToken(slideIndex: number): void {
		this.slideProcessingTokens.set(slideIndex, createDeferred());
	}

	private resolveSlideProcessingToken(slideIndex: number): void {
		const token = this.slideProcessingTokens.get(slideIndex);
		if (token) {
			token.resolve();
			this.slideProcessingTokens.delete(slideIndex);
		}
	}

	public waitForSlideProcessing(slideIndex: number): Promise<void> {
		const token = this.slideProcessingTokens.get(slideIndex);
		if (token) {
			return token.promise;
		}
		// If no token exists, the slide either hasn't started processing
		// or has already finished - return resolved promise
		return Promise.resolve();
	}

	public isSlideProcessing(slideIndex: number): boolean {
		return this.slideProcessingTokens.has(slideIndex);
	}

	public getProcessingSlides(): number[] {
		return Array.from(this.slideProcessingTokens.keys());
	}

	/* *************************** *
	 * 	Public API for logging events and state updates
	 * *************************** */

	private getBaseDataEntry(): BaseDataEntry {
		const user = get(authUser);
		const task = get(currentTask);

		return {
			child_id: user?.username ?? 'host',
			session_id: task ? task.sessionId : 'unknown',
			task_name: task ? formatTaskName(task.slug, task.level, task.mode) : 'unknown',
			slide_index: task?.currentSlideIndex ?? -1,
			stimulus_id: task?.stimulusId ?? 'null',
			timestamp: window.performance.timeOrigin + window.performance.now()
		};
	}

	public logEvent(key: string) {
		if (!this.isLoggingActive()) return;
		this.eventBuffer.events.add(key);
	}

	public logCompleteSlide(
		slideIndex: number,
		taskState?: TrackTaskState,
		metricEvaluation?: (scoreMetrics: Partial<SessionScoreMetrics>, state: TrackTaskState) => number
	) {
		if (!this.isLoggingActive()) return;
		this.eventBuffer.events.add(`complete-slide-${slideIndex}`);
		this.calculateScoreSlideRequest.push(slideIndex);

		// Force clear played sounds on slide change
		this.playedSounds.clear();

		// Create a waiting token for this slide
		this.createSlideProcessingToken(slideIndex);

		if (taskState) this.currentTaskState = taskState;
		if (metricEvaluation) this.currentMetricEvaluation = metricEvaluation;
	}

	public logMistakeType(mistakeType: TaskMistake | TaskMistake[]) {
		if (!this.isLoggingActive()) return;
		if (Array.isArray(mistakeType)) {
			mistakeType.forEach((mistake) => this.eventBuffer.mistake_type.add(mistake.id));
		} else {
			this.eventBuffer.mistake_type.add(mistakeType.id);
		}
	}

	public setSoundActive(soundName: string, isActive: boolean) {
		const strippedName = soundName.split('/').pop()?.split('.').shift() || soundName;
		if (isActive) {
			this.playedSounds.add(strippedName);
		} else {
			this.playedSounds.delete(strippedName);
		}
	}

	public updateEyetrackerPosition(x: number, y: number) {
		this.eyetrackerPosition = { x, y };
	}

	public updateMousePosition(x: number, y: number) {
		this.mousePosition = { x, y };
	}

	public updateActiveAOI(aoiList: string[]) {
		this.activeAOI = new Set(aoiList);
	}

	public startLogging() {
		if (this.timerWorker) return;

		this.resetGazeSignal();
		this.registerListeners();

		this.loggingPaused = false;

		// Allocate shared memory so the worker can read eyetracker state
		// atomically at the exact scheduled tick moment.
		// SharedArrayBuffer requires cross-origin isolation headers (COOP + COEP).
		// If unavailable, fall back to main-thread mirrored values.
		if (typeof SharedArrayBuffer !== 'undefined') {
			this.gazeSharedBuf = new SharedArrayBuffer(3 * Int32Array.BYTES_PER_ELEMENT);
			this.gazeSharedArray = new Int32Array(this.gazeSharedBuf);
		} else {
			console.warn(
				'SharedArrayBuffer is not available – falling back to main-thread gaze mirroring. Ensure Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers are set.'
			);
			this.gazeSharedBuf = null;
			this.gazeSharedArray = null;
		}

		this.timerWorker = new Worker(new URL('./analyticsWorker.ts', import.meta.url), {
			type: 'module'
		});
		this.timerWorker.onmessage = (e: MessageEvent) => {
			if (e.data.type === 'tick') {
				this.tickLogging(e.data.timestamp, e.data.x, e.data.y);
			}
		};
		this.timerWorker.postMessage({
			type: 'start',
			intervalMs: this.POLLING_INTERVAL_MS,
			gazeBuf: this.gazeSharedBuf
		});

		this.rawGazeFlushTimer = setInterval(
			this.flushRawGazeBuffer.bind(this),
			this.RAW_GAZE_FLUSH_INTERVAL_MS
		);
	}

	private tickLogging(workerTimestamp?: number, workerX?: number, workerY?: number) {
		if (this.loggingPaused) return;

		const baseData = this.getBaseDataEntry();
		// Use the worker's scheduled tick time so samples are spaced exactly
		// at the polling interval regardless of main-thread scheduling jitter.
		// The worker sends a full Unix timestamp (worker.timeOrigin + worker.now).
		if (workerTimestamp !== undefined) {
			baseData.timestamp = workerTimestamp;
		}
		const gazeSample: GazeSampleDataEntry = {
			...baseData,
			// Use the worker-captured position (read at the exact tick moment via
			// SharedArrayBuffer) when available; fall back to the mirrored value.
			eyetracker_x: workerX ?? this.eyetrackerPosition.x,
			eyetracker_y: workerY ?? this.eyetrackerPosition.y,
			device_timestamp: this.lastDeviceTimestamp,
			aoi: Array.from(this.activeAOI),
			mouse_x: this.mousePosition.x,
			mouse_y: this.mousePosition.y,
			events: Array.from(this.eventBuffer.events),
			sound_name: Array.from(this.playedSounds),
			mistake_type: Array.from(this.eventBuffer.mistake_type),
			task_result: null
		};

		// Capture ALL pending score calculation requests before clearing.
		// We must not use baseData.slide_index to filter, because the store's currentSlideIndex
		// may have already advanced past the completed slide by the time this tick fires.
		const pendingScoreSlides = [...this.calculateScoreSlideRequest];
		const hasPendingScores = pendingScoreSlides.length > 0;
		const childId = baseData.child_id;
		const sessionId = baseData.session_id;

		// Clear buffers immediately (data already captured in gazeSample)
		this.eventBuffer.events.clear();
		this.eventBuffer.mistake_type.clear();

		if (hasPendingScores) {
			this.calculateScoreSlideRequest = [];
		}

		// Fire-and-forget but properly chained
		db.transaction('rw', db.gazeSamples, db.fixationData, db.sessionScores, async () => {
			await db.gazeSamples.add(gazeSample);

			if (hasPendingScores) {
				if (!this.currentTaskState || !this.currentMetricEvaluation) {
					console.warn(
						`Cannot calculate score for slide indices ${pendingScoreSlides.join(', ')}: missing task state or metric evaluation function.`
					);
					return;
				}
				for (const slideIndex of pendingScoreSlides) {
					await this.calculateScoreMetrics(
						this.currentTaskState,
						this.currentMetricEvaluation,
						childId,
						sessionId,
						slideIndex
					);
				}
			}
		})
			.then(async () => {
				// Flush raw gaze buffer before resolving slide tokens
				// so data is in the DB when per-slide export runs
				if (hasPendingScores) {
					await this.flushRawGazeBuffer();
				}
				// Resolve the waiting tokens for all processed slides
				for (const slideIndex of pendingScoreSlides) {
					this.resolveSlideProcessingToken(slideIndex);
				}
			})
			.catch((error) => {
				console.error('Transaction failed:', error);
				// Still resolve tokens on error to prevent deadlocks
				for (const slideIndex of pendingScoreSlides) {
					this.resolveSlideProcessingToken(slideIndex);
				}
			});

		if (this.pauseRequest) {
			this.loggingPaused = true;
			this.pauseRequest = false;
		}
	}

	public stopLogging(exitType: TaskResult) {
		if (!this.timerWorker) return;

		this.timerWorker.postMessage({ type: 'stop' });
		this.timerWorker.terminate();
		this.timerWorker = null;

		if (this.rawGazeFlushTimer) {
			clearInterval(this.rawGazeFlushTimer);
			this.rawGazeFlushTimer = null;
		}

		// Flush any remaining raw gaze data
		this.flushRawGazeBuffer();

		const baseData = this.getBaseDataEntry();
		const finalGazeSample: GazeSampleDataEntry = {
			...baseData,
			eyetracker_x: this.eyetrackerPosition.x,
			eyetracker_y: this.eyetrackerPosition.y,
			device_timestamp: this.lastDeviceTimestamp,
			aoi: Array.from(this.activeAOI),
			mouse_x: this.mousePosition.x,
			mouse_y: this.mousePosition.y,
			events: Array.from(this.eventBuffer.events),
			sound_name: Array.from(this.playedSounds),
			mistake_type: Array.from(this.eventBuffer.mistake_type),
			task_result: exitType
		};

		db.gazeSamples.add(finalGazeSample).catch((error) => {
			console.error('Error logging Final Gaze Sample:', error);
		});

		this.unregisterListeners();

		this.eventBuffer.events.clear();
		this.eventBuffer.mistake_type.clear();
	}

	public pauseLogging() {
		this.pauseRequest = true;
		this.logEvent(this.PAUSE_LOGGING_EVENT);
	}

	public resumeLogging() {
		this.loggingPaused = false;
		this.logEvent(this.RESUME_LOGGING_EVENT);
	}

	private resetGazeSignal() {
		this.gazeSignal = {
			sampleCount: 0,
			validSampleCount: 0,
			timedSampleCount: 0,
			firstDeviceMs: null,
			lastDeviceMs: null,
			firstDeviceTimestamp: null,
			lastDeviceTimestamp: null
		};
	}

	/**
	 * The sampling rate actually observed over the session. No tracker reports its
	 * nominal rate through the bridge, so the rate is measured from the spread of
	 * device timestamps — the tracker's own clock, which ticks with the hardware.
	 * Bridge and main-thread stamps carry transport and scheduling jitter and
	 * would skew the rate.
	 */
	public getGazeSignal(): GazeSignalSummary {
		const {
			sampleCount,
			validSampleCount,
			timedSampleCount,
			firstDeviceMs,
			lastDeviceMs,
			firstDeviceTimestamp,
			lastDeviceTimestamp
		} = this.gazeSignal;

		const spanMs =
			firstDeviceMs !== null && lastDeviceMs !== null ? lastDeviceMs - firstDeviceMs : 0;
		const measuredFrequencyHz =
			spanMs > 0 && timedSampleCount > 1
				? Math.round(((timedSampleCount - 1) / spanMs) * 1000 * 10) / 10
				: null;

		return {
			sampleCount,
			validSampleCount,
			timedSampleCount,
			measuredFrequencyHz,
			firstDeviceSampleAt: firstDeviceTimestamp,
			lastDeviceSampleAt: lastDeviceTimestamp
		};
	}

	public isLoggingPaused() {
		return this.loggingPaused;
	}

	public isLoggingActive() {
		return this.timerWorker !== null && !this.loggingPaused;
	}

	/* *************************** *
	 * 	Event listeners and handlers
	 * *************************** */
	private registerListeners() {
		if (!browser) return;

		window.addEventListener('mousemove', this.handleMouseMove);
		window.addEventListener('mouseup', this.handleMouseUp);
		window.addEventListener('keydown', this.handleKeyDown);

		this.gazeManager.on('inputData', this.handleInputData);
		this.gazeManager.on('inputFixationStart', this.handleFixationStart);
		this.gazeManager.on('inputFixationEnd', this.handleFixationEnd);
		this.gazeManager.on('intersect', this.handleIntersection);
	}

	private unregisterListeners() {
		if (!browser) return;

		window.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mouseup', this.handleMouseUp);
		window.removeEventListener('keydown', this.handleKeyDown);

		this.gazeManager.off('inputData', this.handleInputData);
		this.gazeManager.off('inputFixationStart', this.handleFixationStart);
		this.gazeManager.off('inputFixationEnd', this.handleFixationEnd);
		this.gazeManager.off('intersect', this.handleIntersection);
	}

	private handleMouseMove = (event: MouseEvent) => {
		this.updateMousePosition(event.clientX, event.clientY);
	};

	private handleMouseUp = () => {
		if (!this.isLoggingActive()) return;
		this.logEvent(`${this.CLICK_EVENT_PREFIX}click`);
	};

	private handleKeyDown = (event: KeyboardEvent) => {
		if (!this.isLoggingActive()) return;
		if (event.repeat) return;
		this.logEvent(`${this.KEYBOARD_EVENT_PREFIX}${event.code}`);
	};

	private handleInputData = (inputData: GazeDataPoint) => {
		if (inputData.parseValidity) {
			this.updateEyetrackerPosition(inputData.x, inputData.y);
		}

		this.lastDeviceTimestamp = inputData.deviceTimestamp;
		const bridgeMs = Date.parse(inputData.timestamp);
		if (!Number.isNaN(bridgeMs)) this.lastSampleBridgeMs = bridgeMs;

		this.gazeSignal.sampleCount++;
		if (inputData.parseValidity) this.gazeSignal.validSampleCount++;

		// The device clock ticks with the tracker, so the sampling rate is measured
		// there rather than on the bridge stamps, which carry transport jitter.
		const deviceMs = Date.parse(inputData.deviceTimestamp);
		if (!Number.isNaN(deviceMs)) {
			this.gazeSignal.timedSampleCount++;
			this.gazeSignal.firstDeviceMs ??= deviceMs;
			this.gazeSignal.lastDeviceMs = deviceMs;
			this.gazeSignal.firstDeviceTimestamp ??= inputData.deviceTimestamp;
			this.gazeSignal.lastDeviceTimestamp = inputData.deviceTimestamp;
		}

		// Write to SharedArrayBuffer so the worker can read position atomically
		// at the exact scheduled tick moment (no message-passing delay).
		// Only update x/y when valid — same policy as updateEyetrackerPosition —
		// so the buffer always holds the last known good position.
		if (this.gazeSharedArray !== null) {
			Atomics.store(this.gazeSharedArray, 0, Math.round(inputData.x * 100));
			Atomics.store(this.gazeSharedArray, 1, Math.round(inputData.y * 100));
			Atomics.store(this.gazeSharedArray, 2, inputData.parseValidity ? 1 : 0);
		}

		if (!this.isLoggingActive()) return;

		const user = get(authUser);
		const task = get(currentTask);

		this.rawGazeBuffer.push({
			child_id: user?.username ?? 'host',
			session_id: task ? task.sessionId : 'unknown',
			task_name: task ? formatTaskName(task.slug, task.level, task.mode) : 'unknown',
			slide_index: task?.currentSlideIndex ?? -1,
			// Bridge time ticks with the tracker; the main-thread clock stamps late
			// and in bursts whenever the tab is busy.
			timestamp: Number.isNaN(bridgeMs)
				? window.performance.timeOrigin + window.performance.now()
				: bridgeMs,
			bridgeTimeStamp: inputData.timestamp,
			deviceTimeStamp: inputData.deviceTimestamp,
			x: inputData.x,
			y: inputData.y,
			xL: inputData.xL,
			yL: inputData.yL,
			validityL: inputData.validityL,
			pupilDiameterL: inputData.pupilDiameterL,
			xR: inputData.xR,
			yR: inputData.yR,
			validityR: inputData.validityR,
			pupilDiameterR: inputData.pupilDiameterR
		});
	};

	private handleFixationStart = (fixationData: FixationDataPoint) => {
		if (!this.isLoggingActive()) return;
		const dataEntry = this.getBaseDataEntry();
		// The start event fires one minimum-duration after the fixation began and
		// can queue behind a stalled main thread; the last sample's bridge time
		// minus the reported duration is the actual onset.
		if (this.lastSampleBridgeMs !== null) {
			dataEntry.timestamp = this.lastSampleBridgeMs - fixationData.duration;
		}
		const fixationEntry: FixationDataEntry = {
			...dataEntry,
			eyetracker_x: fixationData.x,
			eyetracker_y: fixationData.y,
			duration: fixationData.duration,
			aoi: Array.from(this.activeAOI),
			fixation_index: fixationData.fixationId
		};
		this.activeFixations.push(fixationEntry);
	};

	private handleFixationEnd = (fixationData: FixationDataPoint) => {
		const fixationIndex = this.activeFixations.findIndex(
			(fix) => fix.fixation_index === fixationData.fixationId
		);
		if (fixationIndex === -1) {
			console.warn(`Received fixation end for unknown fixation index ${fixationData.fixationId}`);
			return;
		}
		const fixationEntry = this.activeFixations[fixationIndex];
		this.activeFixations.splice(fixationIndex, 1);

		// Update duration
		fixationEntry.duration = fixationData.duration;

		// Store fixation data
		db.fixationData.add(fixationEntry).catch((error) => {
			console.error('Error logging Fixation Data:', error);
		});
	};

	private handleIntersection = (intersectionData: GazeInteractionObjectIntersectEvent) => {
		this.updateActiveAOI(intersectionData.target.map((target) => target.id));
	};

	/* *************************** *
	 * 	Raw gaze data buffering
	 * *************************** */

	private flushRawGazeBuffer(): Promise<void> {
		if (this.rawGazeBuffer.length === 0) return Promise.resolve();
		const batch = this.rawGazeBuffer;
		this.rawGazeBuffer = [];
		return db.rawGazeData
			.bulkAdd(batch)
			.then(() => {})
			.catch((error) => {
				console.error('Error flushing raw gaze buffer:', error);
			});
	}

	/* *************************** *
	 * 	Score calculation based on gaze and fixation data
	 * *************************** */

	private async calculateScoreMetrics(
		taskState: TrackTaskState,
		metricEvaluation: (scoreMetrics: Partial<SessionScoreMetrics>, state: TrackTaskState) => number,
		childId: string,
		sessionId: string,
		slideIndex: number = -1
	) {
		// Get all gaze samples and fixation data for the session
		const gazeSamples = await Dexie.waitFor(
			db.gazeSamples.where('[child_id+session_id]').equals([childId, sessionId]).toArray()
		);

		const fixationData = await Dexie.waitFor(
			db.fixationData.where('[child_id+session_id]').equals([childId, sessionId]).toArray()
		);

		const timeWindows =
			slideIndex === -1
				? getEffectiveTimeWindows(gazeSamples)
				: [getEffectiveTimeWindow(gazeSamples, slideIndex)].filter(
						(window): window is SlideTimeWindow => window !== null
					);

		for (let i = 0; i < timeWindows.length; i++) {
			const window = timeWindows[i];
			const windowedGazeSamples = filterSamplesInWindow(gazeSamples, window);
			const windowedFixationData = filterFixationsInWindow(fixationData, window);

			// Calculate metrics
			const metrics: SessionScoreMetrics = {
				error_rate: calculateErrorRate(windowedGazeSamples),
				response_time: calculateResponseTime(windowedGazeSamples),
				mean_fix_dur: calculateMeanFixationDuration(windowedFixationData),
				fix_count: windowedFixationData.length,
				aoi_target_fix: calculateAOITargetFixations(windowedFixationData),
				aoi_field_fix: calculateAOIFieldFixations(windowedFixationData),
				regression_count: calculateRegressionCount(windowedFixationData)
			};

			let fluencyScore = 0;
			if (metricEvaluation) {
				fluencyScore = metricEvaluation(metrics, taskState);
			}

			const baseData = this.getBaseDataEntry();
			baseData.timestamp = window.endTime;
			baseData.slide_index = slideIndex === -1 ? i + 1 : slideIndex;
			baseData.stimulus_id =
				windowedGazeSamples.length > 0 ? windowedGazeSamples[0].stimulus_id : 'null';

			// Store session score metrics
			try {
				const id = await Dexie.waitFor(
					db.sessionScores.add({
						...baseData,
						...metrics,
						fluency_score: fluencyScore
					})
				);
			} catch (error) {
				console.error('Error storing session score metrics:', error);
			}
		}
	}
}
