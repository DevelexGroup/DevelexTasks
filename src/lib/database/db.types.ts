export interface GazeSampleDataEntry {
	id?: number;
	child_id: string;
	session_id: string;
	task_name: string;
	timestamp: Date;
	eyetracker_x: number | null;
	eyetracker_y: number | null;
	aoi: string[];
	mouse_x: number;
	mouse_y: number;
	key_event: string[];
	sound_name: string | null;
	error_type: string[];
	task_result: 'natural' | 'escape' | 'error'
}

export interface FixationDataEntry {
	id?: number;
	child_id: string;
	session_id: string;
	task_name: string;
	timestamp: Date;
	eyetracker_x: number | null;
	eyetracker_y: number | null;
	duration: number;
	aoi: string[];
	fixation_index: number;
}