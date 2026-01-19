import {
	type BaseDataEntry,
	type FixationDataEntry,
	type GazeSampleDataEntry
} from '$lib/database/db.types';
import { userStore } from '$lib/stores/user';
import { get } from 'svelte/store';
import { currentTask } from '$lib/stores/task';
import { type TaskMistake, TaskResult } from '$lib/types/task.types';
import type {
	FixationDataPoint,
	GazeDataPoint,
	GazeInteractionObjectIntersectEvent,
	GazeManager
} from 'develex-js-sdk';
import { browser } from '$app/environment';
import { db } from '$lib/database/db';

export class AnalyticsManager {
	private POLLING_RATE_HZ = 120;
	private POLLING_INTERVAL_MS = 1000 / this.POLLING_RATE_HZ;

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

		this.pollingTimer = setInterval(() => {
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

			db.gazeSamples.add(gazeSample).catch((error) => {
				console.error('Error logging Gaze Sample:', error);
			});

			this.eventBuffer.events.clear();
			this.eventBuffer.mistake_type.clear();

			// Pause after this sample if requested
			if (this.pauseRequest) {
				this.loggingPaused = true;
				this.pauseRequest = false;
			}
		}, this.POLLING_INTERVAL_MS);
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

		db.gazeSamples
			.add(finalGazeSample)
			.then((id) => {
				console.log('Logged Final Gaze Sample with ID:', id, finalGazeSample);
			})
			.catch((error) => {
				console.error('Error logging Final Gaze Sample:', error);
			});

		this.calculateScoreMetrics(baseData.child_id, baseData.session_id);

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
	private calculateScoreMetrics(childId: string, sessionId: string) {
		// Get all gaze samples and fixation data for the session
		const gazeSamplesPromise = db.gazeSamples
			.where('[child_id+session_id]')
			.equals([childId, sessionId])
			.toArray();

		const fixationDataPromise = db.fixationData
			.where('[child_id+session_id]')
			.equals([childId, sessionId])
			.toArray();

		Promise.all([gazeSamplesPromise, fixationDataPromise])
			.then(([gazeSamples, fixationData]) => {
				const timeWindows = this.getEffectiveTimeWindows(gazeSamples);

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
					const errorRate = this.calculateErrorRate(windowedGazeSamples);
					const responseTime = this.calculateResponseTime(windowedGazeSamples);
					const meanFixDur = this.calculateMeanFixationDuration(windowedFixationData);
					const fixCount = windowedFixationData.length;
					const aoiTargetFix = this.calculateAOITargetFixations(windowedFixationData);
					const aoiFieldFix = this.calculateAOIFieldFixations(windowedFixationData);
					const regressionCount = this.calculateRegressionCount(windowedFixationData);

					const baseData = this.getBaseDataEntry();
					baseData.timestamp = window.endTime;
					baseData.slide_index = i + 1;
					baseData.stimulus_id =
						windowedGazeSamples.length > 0 ? windowedGazeSamples[0].stimulus_id : 'null';

					// Store session score metrics
					db.sessionScores
						.add({
							...baseData,
							error_rate: errorRate,
							response_time: responseTime,
							mean_fix_dur: meanFixDur,
							fix_count: fixCount,
							aoi_target_fix: aoiTargetFix,
							aoi_field_fix: aoiFieldFix,
							regression_count: regressionCount
						})
						.then((id) => {
							console.log('Stored session score metrics with ID:', id);
						})
						.catch((error) => {
							console.error('Error storing session score metrics:', error);
						});
				}
			})
			.catch((error) => {
				console.error('Error retrieving data for score metrics calculation:', error);
			});
	}

	private getEffectiveTimeWindows(
		gazeSamples: GazeSampleDataEntry[]
	): { startTime: number; endTime: number }[] {
		const timeWindows: { startTime: number; endTime: number }[] = [];
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
					timeWindows.push({ startTime: pendingStartTime, endTime: sample.timestamp });
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
		// Placeholder implementation
		return 0;
	}
}