import Dexie, { type EntityTable } from 'dexie';
import type { FixationDataEntry, GazeSampleDataEntry } from '$lib/database/db.types';

const db = new Dexie("DevelexDatabase") as Dexie & {
	gazeSamples: EntityTable<GazeSampleDataEntry, "id">
	fixationData: EntityTable<FixationDataEntry, "id">
};

db.version(1).stores({
	gazeSamples: '++id, child_id, session_id, task_name, timestamp, eyetracker_x, eyetracker_y, aoi, mouse_x, mouse_y, key_event, sound_name, error_type, task_result',
	fixationData: '++id, child_id, session_id, task_name, timestamp, eyetracker_x, eyetracker_y, duration, aoi, fixation_index'
});

export { db };