import Dexie, { type EntityTable } from 'dexie';
import type { FixationDataEntry, GazeSampleDataEntry, SessionScoreDataEntry } from '$lib/database/db.types';

const db = new Dexie("DevelexDatabase") as Dexie & {
	gazeSamples: EntityTable<GazeSampleDataEntry, "id">
	fixationData: EntityTable<FixationDataEntry, "id">
	sessionScores: EntityTable<SessionScoreDataEntry, "id">
};

db.version(1).stores({
	gazeSamples:
		'++id, child_id, session_id, [child_id+session_id], task_name, stimulus_id, timestamp, eyetracker_x, eyetracker_y, aoi, mouse_x, mouse_y, events, sound_name, mistake_type, task_result',
	fixationData:
		'++id, child_id, session_id, [child_id+session_id], task_name, stimulus_id, timestamp, eyetracker_x, eyetracker_y, duration, aoi, fixation_index',
	sessionScores:
		'++id, child_id, session_id, [child_id+session_id], task_name, stimulus_id, timestamp, error_rate, response_time, mean_fix_dur, fix_count, aoi_target_fix, aoi_field_fix, regression_count'
});

export { db };