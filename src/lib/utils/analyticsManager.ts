import {
	type BaseDataEntry,
	type FixationDataEntry,
	type GazeSampleDataEntry, type SessionScoreMetrics
} from '$lib/database/db.types';
import { userStore } from '$lib/stores/user';
import { get } from 'svelte/store';
import { currentTask } from '$lib/stores/task';
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

interface SlideTimeWindow {
	slideIndex: number;
	startTime: number;
	endTime: number;
}

export class AnalyticsManager {
	private POLLING_RATE_HZ = 120;
	private POLLING_INTERVAL_MS = 1000 / this.POLLING_RATE_HZ;

	private REGRESSION_MIN_DIST = 50; // pixels
	private REGRESSION_MIN_DEGREE = 40; // degrees

	private CLICK_EVENT_PREFIX = 'mouse_';
	private KEYBOARD_EVENT_PREFIX = 'key_';

	private PAUSE_LOGGING_EVENT = 'pause_logging';
	private RESUME_LOGGING_EVENT = 'resume_logging';

	private pollingTimer: ReturnType<typeof setInterval> | null = null;

	private eyetrackerPosition: { x: number; y: number } = { x: 0, y: 0 };
	private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
	private playedSounds: Set<string> = new Set<string>();
	private activeAOI: Set<string> = new Set<string>();

	private eventBuffer = {
		events: new Set<string>(),
		mistake_type: new Set<string>()
	};

	private gazeManager: GazeManager;

	private loggingPaused = false;
	private pauseRequest = false;

	// private calculateScoreRequest = false;
	private calculateScoreSlideRequest: number[] = [];

	private currentTaskState: TrackTaskState | null = null;
	private currentMetricEvaluation: ((scoreMetrics: Partial<SessionScoreMetrics>, state: TrackTaskState) => number) | null = null;

	constructor(gazeManager: GazeManager) {
		this.gazeManager = gazeManager;
	}

	private getBaseDataEntry(): BaseDataEntry {
		const childId = get(userStore);
		const task = get(currentTask);

		return {
			child_id: childId.id,
			session_id: task ? task.session : 'unknown',
			task_name: task ? `${task.slug}-${task.level}` : 'unknown',
			slide_index: task?.currentRepetition ?? -1,
			stimulus_id: task?.stimulusId ?? 'null',
			timestamp: window.performance.timeOrigin + window.performance.now()
		};
	}

	public logEvent(key: string) {
		this.eventBuffer.events.add(key);
	}

	public logCompleteSlide(
		slideIndex: number,
		taskState?: TrackTaskState,
		metricEvaluation?: (scoreMetrics: Partial<SessionScoreMetrics>, state: TrackTaskState) => number
	) {
		this.eventBuffer.events.add(`complete-slide-${slideIndex}`);
		this.calculateScoreSlideRequest.push(slideIndex);

		if (taskState) this.currentTaskState = taskState;
		if (metricEvaluation) this.currentMetricEvaluation = metricEvaluation;
	}

	public logMistakeType(mistakeType: TaskMistake | TaskMistake[]) {
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
		if (this.pollingTimer) return;

		this.registerListeners();

		this.loggingPaused = false;

		this.pollingTimer = setInterval(this.tickLogging.bind(this), this.POLLING_INTERVAL_MS);
	}

	private tickLogging() {
		if (this.loggingPaused) return;

		const baseData = this.getBaseDataEntry();
		const gazeSample: GazeSampleDataEntry = {
			...baseData,
			eyetracker_x: this.eyetrackerPosition.x,
			eyetracker_y: this.eyetrackerPosition.y,
			aoi: Array.from(this.activeAOI),
			mouse_x: this.mousePosition.x,
			mouse_y: this.mousePosition.y,
			events: Array.from(this.eventBuffer.events),
			sound_name: Array.from(this.playedSounds),
			mistake_type: Array.from(this.eventBuffer.mistake_type),
			task_result: null
		};

		// Capture current state before clearing
		const shouldCalculateScore = this.calculateScoreSlideRequest.includes(baseData.slide_index);
		const childId = baseData.child_id;
		const sessionId = baseData.session_id;
		const slideIndex = baseData.slide_index;

		// Clear buffers immediately (data already captured in gazeSample)
		this.eventBuffer.events.clear();
		this.eventBuffer.mistake_type.clear();
		if (shouldCalculateScore) {
		}
		this.calculateScoreSlideRequest = this.calculateScoreSlideRequest.filter(
			(index) => index !== baseData.slide_index
		);

		// Fire-and-forget but properly chained
		db.transaction('rw', db.gazeSamples, db.fixationData, db.sessionScores, async () => {
			await db.gazeSamples.add(gazeSample);

			if (shouldCalculateScore) {
				if (!this.currentTaskState || !this.currentMetricEvaluation) {
					console.warn(
						`Cannot calculate score for slide index ${slideIndex}: missing task state or metric evaluation function.`
					);
					return;
				}
				await this.calculateScoreMetrics(this.currentTaskState, this.currentMetricEvaluation, childId, sessionId, slideIndex);
			}
		}).catch((error) => {
			console.error('Transaction failed:', error);
		});

		if (this.pauseRequest) {
			this.loggingPaused = true;
			this.pauseRequest = false;
		}
	}

	public stopLogging(exitType: TaskResult) {
		if (!this.pollingTimer) return;

		clearInterval(this.pollingTimer);
		this.pollingTimer = null;

		const baseData = this.getBaseDataEntry();
		const finalGazeSample: GazeSampleDataEntry = {
			...baseData,
			eyetracker_x: this.eyetrackerPosition.x,
			eyetracker_y: this.eyetrackerPosition.y,
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

	public isLoggingPaused() {
		return this.loggingPaused;
	}

	public isLoggingActive() {
		return this.pollingTimer !== null && !this.loggingPaused;
	}

	// Event handlers
	private registerListeners() {
		if (!browser) return;

		window.addEventListener('mousemove', this.handleMouseMove);
		window.addEventListener('mouseup', this.handleMouseUp);
		window.addEventListener('keydown', this.handleKeyDown);

		this.gazeManager.on('inputData', this.handleInputData);
		this.gazeManager.on('inputFixationEnd', this.handleFixation);
		this.gazeManager.on('intersect', this.handleIntersection);
	}

	private unregisterListeners() {
		if (!browser) return;

		window.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mouseup', this.handleMouseUp);
		window.removeEventListener('keydown', this.handleKeyDown);

		this.gazeManager.off('inputData', this.handleInputData);
		this.gazeManager.off('inputFixationEnd', this.handleFixation);
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
	};

	private handleFixation = (fixationData: FixationDataPoint) => {
		if (!this.isLoggingActive()) return;
		const dataEntry = this.getBaseDataEntry();
		const fixationEntry = {
			...dataEntry,
			eyetracker_x: fixationData.x,
			eyetracker_y: fixationData.y,
			duration: fixationData.duration,
			aoi: Array.from(this.activeAOI),
			fixation_index: fixationData.fixationId
		};
		db.fixationData.add(fixationEntry).catch((error) => {
			console.error('Error logging Fixation Data:', error);
		});
	};

	private handleIntersection = (intersectionData: GazeInteractionObjectIntersectEvent) => {
		this.updateActiveAOI(intersectionData.target.map((target) => target.id));
	};

	/* Metric calculations */
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
				? this.getEffectiveTimeWindows(gazeSamples)
				: [this.getEffectiveTimeWindow(gazeSamples, slideIndex)].filter(
						(window): window is SlideTimeWindow => window !== null
					);

		for (let i = 0; i < timeWindows.length; i++) {
			const window = timeWindows[i];
			const windowedGazeSamples = gazeSamples.filter(
				(sample) => sample.timestamp >= window.startTime && sample.timestamp <= window.endTime
			);
			// Account for the fact that fixation timestamps are based on their end time
			const windowedFixationData = fixationData.filter(
				(fix) =>
					fix.timestamp - fix.duration >= window.startTime &&
					fix.timestamp - fix.duration <= window.endTime
			);

			// Calculate metrics
			const metrics: SessionScoreMetrics = {
				error_rate: this.calculateErrorRate(windowedGazeSamples),
				response_time: this.calculateResponseTime(windowedGazeSamples),
				mean_fix_dur: this.calculateMeanFixationDuration(windowedFixationData),
				fix_count: windowedFixationData.length,
				aoi_target_fix: this.calculateAOITargetFixations(windowedFixationData),
				aoi_field_fix: this.calculateAOIFieldFixations(windowedFixationData),
				regression_count: this.calculateRegressionCount(windowedFixationData)
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

	private getEffectiveTimeWindow(
		gazeSamples: GazeSampleDataEntry[],
		slideIndex: number
	): SlideTimeWindow | null {
		let startTime: number | null = null;
		let endTime: number | null = null;

		for (const sample of gazeSamples) {
			if (!sample.events) continue;

			for (const event of sample.events) {
				// Check for slide start event (dwell-finish_slide-{index}_initial)
				if (startTime === null && event === `dwell-finish_slide-${slideIndex}_initial`) {
					startTime = sample.timestamp;
					continue;
				}

				// Check for slide complete event (complete-slide-{index})
				if (startTime !== null && event === `complete-slide-${slideIndex}`) {
					endTime = sample.timestamp;
					return { slideIndex, startTime, endTime };
				}
			}
		}

		console.error(
			`No complete event found for slide index ${slideIndex} (startTime: ${startTime}, endTime: ${endTime})`
		);
		return null;
	}

	private getEffectiveTimeWindows(gazeSamples: GazeSampleDataEntry[]): SlideTimeWindow[] {
		const timeWindows: SlideTimeWindow[] = [];
		let pendingStartTime: number | null = null;

		for (const sample of gazeSamples) {
			if (!sample.events) continue;

			for (const event of sample.events) {
				// Check for slide start event (dwell-finish_slide-{index}_initial)
				if (
					pendingStartTime === null &&
					event.startsWith('dwell-finish_slide-') &&
					event.endsWith('_initial')
				) {
					pendingStartTime = sample.timestamp;
					continue;
				}

				// Check for slide complete event (complete-slide-{index})
				if (pendingStartTime !== null && event.startsWith('complete-slide-')) {
					timeWindows.push({
						slideIndex: timeWindows.length,
						startTime: pendingStartTime,
						endTime: sample.timestamp
					});
					pendingStartTime = null;
				}
			}
		}

		return timeWindows;
	}

	private calculateErrorRate(gazeSamples: GazeSampleDataEntry[]): number {
		// sum of all mistakes of type "misclick", "skipped" and "wrong-order"
		return gazeSamples.reduce((count, sample) => {
			const mistakes = sample.mistake_type || [];
			mistakes.forEach((mistake) => {
				if (mistake === 'misclick' || mistake === 'skipped' || mistake === 'wrong-order') {
					count++;
				}
			});
			return count;
		}, 0);
	}

	private calculateResponseTime(gazeSamples: GazeSampleDataEntry[]): number {
		if (gazeSamples.length === 0) return 0;
		const startTime = gazeSamples[0].timestamp;
		const endTime = gazeSamples[gazeSamples.length - 1].timestamp;
		return endTime - startTime;
	}

	private calculateMeanFixationDuration(fixationData: FixationDataEntry[]): number {
		if (fixationData.length === 0) return 0;
		const totalDuration = fixationData.reduce((sum, fix) => sum + fix.duration, 0);
		return totalDuration / fixationData.length;
	}

	private calculateAOITargetFixations(fixationData: FixationDataEntry[]): number {
		return fixationData.filter((fix) => fix.aoi.includes('hint')).length;
	}

	private calculateAOIFieldFixations(fixationData: FixationDataEntry[]): number {
		return fixationData.filter((fix) => fix.aoi.includes('track')).length;
	}

	private calculateRegressionCount(fixationData: FixationDataEntry[]): number {
		// Count two consecutive fixations as a regression if:
		// 1) The distance between them is greater than REGRESSION_MIN_DIST
		// 2) The angle between them is greater than +- REGRESSION_MIN_DEGREE (0 degrees is rightwards)
		let regressionCount = 0;
		for (let i = 1; i < fixationData.length; i++) {
			const prevFix = fixationData[i - 1];
			const currFix = fixationData[i];

			const deltaX = currFix.eyetracker_x! - prevFix.eyetracker_x!;
			const deltaY = currFix.eyetracker_y! - prevFix.eyetracker_y!;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			if (distance < this.REGRESSION_MIN_DIST) continue;

			const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

			if (angle > this.REGRESSION_MIN_DEGREE || angle < -this.REGRESSION_MIN_DEGREE) {
				regressionCount++;
			}
		}
		return regressionCount;
	}
}