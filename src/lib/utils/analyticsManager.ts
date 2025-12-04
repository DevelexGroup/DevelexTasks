import type { BaseDataEntry, GazeSampleDataEntry } from '$lib/database/db.types';
import { userStore } from '$lib/stores/user';
import { get } from 'svelte/store';
import { currentTask } from '$lib/stores/task';
import type { TaskMistake } from '$lib/types/task.types';

export class AnalyticsManager {
	private POLLING_RATE_HZ = 10;
	private POLLING_INTERVAL_MS = 1000 / this.POLLING_RATE_HZ;

	private pollingTimer: ReturnType<typeof setInterval> | null = null;

	private eyetrackerPosition: { x: number; y: number } = { x: 0, y: 0 };
	private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
	private playedSound: string | null = null;
	private activeAOI: Set<string> = new Set<string>();

	private eventBuffer = {
		key_event: new Set<string>(),
		mistake_type: new Set<string>(),
	};

	private getBaseDataEntry(): BaseDataEntry {
		const childId = get(userStore);
		const task = get(currentTask)

		return {
			child_id: childId.id,
			session_id: task ? task.session : 'unknown',
			task_name: task ? `${task.slug}-${task.level}` : 'unknown',
			timestamp: new Date(),
		};
	}

	public logKeyEvent(key: string) {
		this.eventBuffer.key_event.add(key);
	}

	public logErrorType(mistakeType: TaskMistake) {
		this.eventBuffer.mistake_type.add(mistakeType.id);
	}

	public logSoundPlayed(soundName: string | null) {
		this.playedSound = soundName;
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
		if (this.pollingTimer)
			return;

		this.pollingTimer = setInterval(() => {
			const baseData = this.getBaseDataEntry();
			const gazeSample: GazeSampleDataEntry = {
				...baseData,
				eyetracker_x: this.eyetrackerPosition.x,
				eyetracker_y: this.eyetrackerPosition.y,
				aoi: Array.from(this.activeAOI),
				mouse_x: this.mousePosition.x,
				mouse_y: this.mousePosition.y,
				key_event: Array.from(this.eventBuffer.key_event),
				sound_name: this.playedSound,
				mistake_type: Array.from(this.eventBuffer.mistake_type),
				task_result: null,
			};

			console.log('Logged Gaze Sample:', gazeSample);

			this.eventBuffer.key_event.clear();
			this.eventBuffer.mistake_type.clear();
		}, this.POLLING_INTERVAL_MS);
	}

	public stopLogging(exitType: 'natural' | 'escape' | 'error') {
		if (this.pollingTimer) {
			clearInterval(this.pollingTimer);
			this.pollingTimer = null;
		}

		const baseData = this.getBaseDataEntry();
		const finalGazeSample: GazeSampleDataEntry = {
			...baseData,
			eyetracker_x: this.eyetrackerPosition.x,
			eyetracker_y: this.eyetrackerPosition.y,
			aoi: Array.from(this.activeAOI),
			mouse_x: this.mousePosition.x,
			mouse_y: this.mousePosition.y,
			key_event: Array.from(this.eventBuffer.key_event),
			sound_name: this.playedSound,
			mistake_type: Array.from(this.eventBuffer.mistake_type),
			task_result: exitType,
		};

		console.log('Logged Final Gaze Sample:', finalGazeSample);

		this.eventBuffer.key_event.clear();
		this.eventBuffer.mistake_type.clear();
	}
}