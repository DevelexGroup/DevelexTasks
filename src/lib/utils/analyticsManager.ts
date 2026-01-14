import {
	type BaseDataEntry,
	type FixationDataEntry,
	type GazeSampleDataEntry,
	TaskResult
} from '$lib/database/db.types';
import { userStore } from '$lib/stores/user';
import { get } from 'svelte/store';
import { currentTask } from '$lib/stores/task';
import type { TaskMistake } from '$lib/types/task.types';
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
		if (isActive) {
			this.playedSounds.add(soundName);
		} else {
			this.playedSounds.delete(soundName);
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

		this.pollingTimer = setInterval(() => {
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
		this.logEvent(`${this.CLICK_EVENT_PREFIX}click`);
	};

	private handleKeyDown = (event: KeyboardEvent) => {
		if (event.repeat) return;
		this.logEvent(`${this.KEYBOARD_EVENT_PREFIX}${event.code}`);
	};

	private handleInputData = (inputData: GazeDataPoint) => {
		if (inputData.parseValidity) {
			this.updateEyetrackerPosition(inputData.x, inputData.y);
		}
	};

	private handleFixation = (fixationData: FixationDataPoint) => {
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
				// Filter gaze samples and fixation data to only include those within effective time windows
				gazeSamples = gazeSamples.filter((sample) =>
					timeWindows.some(
						(window) => sample.timestamp >= window.startTime && sample.timestamp <= window.endTime
					)
				);
				fixationData = fixationData.filter((fix) =>
					timeWindows.some(
						(window) => fix.timestamp >= window.startTime && fix.timestamp <= window.endTime
					)
				);

				// Calculate metrics
				const errorRate = this.calculateErrorRate(gazeSamples);
				const responseTime = this.calculateResponseTime(gazeSamples);
				const meanFixDur = this.calculateMeanFixationDuration(fixationData);
				const fixCount = fixationData.length;
				const aoiTargetFix = this.calculateAOITargetFixations(fixationData);
				const aoiFieldFix = this.calculateAOIFieldFixations(fixationData);
				const regressionCount = this.calculateRegressionCount(fixationData);

				const baseData = this.getBaseDataEntry();
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
			})
			.catch((error) => {
				console.error('Error calculating score metrics:', error);
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
		// Placeholder implementation
		return 0;
	}

	private calculateMeanFixationDuration(fixationData: FixationDataEntry[]): number {
		if (fixationData.length === 0) return 0;
		const totalDuration = fixationData.reduce((sum, fix) => sum + fix.duration, 0);
		return totalDuration / fixationData.length;
	}

	private calculateAOITargetFixations(fixationData: FixationDataEntry[]): number {
		// Placeholder implementation
		return 0;
	}

	private calculateAOIFieldFixations(fixationData: FixationDataEntry[]): number {
		// Placeholder implementation
		return 0;
	}

	private calculateRegressionCount(fixationData: FixationDataEntry[]): number {
		// Placeholder implementation
		return 0;
	}
}