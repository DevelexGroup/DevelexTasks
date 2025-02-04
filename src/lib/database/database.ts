import Dexie, { type Table } from 'dexie';
import type { Fixation } from './models/Fixation';
import type { Saccade } from './models/Saccade';
import type { Intersect } from './models/Intersect';
import type { RecordedEvent } from './models/RecordedEvent';

export class DevelexIDB extends Dexie {
	userEvents!: Table<RecordedEvent>;
	stateEvents!: Table<RecordedEvent>;
	fixations!: Table<Fixation>;
	saccades!: Table<Saccade>;
	intersects!: Table<Intersect>;

	constructor() {
		super('develex-task-idb');

		this.version(3).stores({
			fixations: '++id, sessionId, timestamp, type, duration, aoi',
			saccades: '++id, sessionId, timestamp, type, duration, aoi',
			intersects: '++id, sessionId, timestamp, aoi',
			userEvents: '++id, sessionId, timestamp, type',
			stateEvents: '++id, sessionId, timestamp, type'
		});
	}
}

export const db = new DevelexIDB();
