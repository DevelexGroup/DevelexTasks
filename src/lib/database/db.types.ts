export interface BaseDataEntry {
	child_id: string;
	session_id: string;
	task_name: string;
	stimulus_id: string;
	timestamp: number;
	slide_index: number;
}

export enum TaskResult {
	Natural = 'natural',
	Escape = 'escape',
	Mistake = 'mistake',
	Terminate = 'terminate',
	Timeout = 'timeout'
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

export interface SessionScoreDataEntry extends BaseDataEntry {
	id?: number;
	error_rate: number;
	response_time: number;
	mean_fix_dur: number;
	fix_count: number;
	aoi_target_fix: number;
	aoi_field_fix: number;
	regression_count: number;
}