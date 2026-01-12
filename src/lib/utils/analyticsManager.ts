import { type BaseDataEntry, type GazeSampleDataEntry, TaskResult } from '$lib/database/db.types';
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
			stimulus_id: task?.stimulusId ?? 'null',
			timestamp: window.performance.timeOrigin + window.performance.now()
		};
	}

	public logEvent(key: string) {
		this.eventBuffer.events.add(key);
	}

	public logMistakeType(mistakeType: TaskMistake | TaskMistake[]) {
		console.log('Logging mistake type:', mistakeType);
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
		this.logEvent(`${this.KEYBOARD_EVENT_PREFIX}${event.key}`);
	};

	private handleInputData = (inputData: GazeDataPoint) => {
		if (inputData.parseValidity) {
			this.updateEyetrackerPosition(inputData.x, inputData.y);
		}
	};

	private handleFixation = (fixationData: FixationDataPoint) => {
		console.log('Fixation Data Received:', fixationData);
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
}