export interface BaseDataEntry {
	child_id: string;
	session_id: string;
	task_name: string;
	stimulus_id: string;
	timestamp: number;
}

export enum TaskResult {
	Natural = 'natural',
	Escape = 'escape',
	Mistake = 'mistake',
	Terminate = 'terminate'
}

export interface GazeSampleDataEntry extends BaseDataEntry {
	id?: number;
	eyetracker_x: number | null;
	eyetracker_y: number | null;
	aoi: string[];
	mouse_x: number;
	mouse_y: number;
	events: string[];
	sound_name: string[];
	mistake_type: string[];
	task_result: TaskResult | null;
}

export interface FixationDataEntry extends BaseDataEntry {
	id?: number;
	eyetracker_x: number | null;
	eyetracker_y: number | null;
	duration: number;
	aoi: string[];
	fixation_index: number;
}