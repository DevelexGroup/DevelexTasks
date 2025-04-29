import Dexie, { type Table } from 'dexie';
import type { Fixation } from './models/Fixation';
import type { Saccade } from './models/Saccade';
import type { Intersect } from './models/Intersect';
import type { RecordedEvent } from './models/RecordedEvent';
import type { Session } from './models/Session';
import type { Dwell } from './models/Dwell';
import type { XStateEvent } from './models/XStateEvent';
import type { ValidationPoint } from './models/ValidationPoint';
import type { GazeDataPoint, FixationDataPoint } from '@473783/develex-core';

export class DevelexIDB extends Dexie {
	userEvents!: Table<RecordedEvent>;
	stateEvents!: Table<RecordedEvent>;
	fixations!: Table<Fixation>;
	saccades!: Table<Saccade>;
	intersects!: Table<Intersect>;
	sessions!: Table<Session>;
	dwells!: Table<Dwell>;
	xstateEvents!: Table<XStateEvent>;
	gazeInputs!: Table<GazeDataPoint & { sessionId: string; clientTimestamp: string }>;
	fixationInputs!: Table<FixationDataPoint & { sessionId: string; clientTimestamp: string }>;
	validationPoints!: Table<ValidationPoint>;

	constructor() {
		super('develex-task-idb');

		this.version(6).stores({
			fixations: '++id, sessionId, timestamp, type, duration, aoi',
			saccades: '++id, sessionId, timestamp, type, duration, aoi',
			intersects: '++id, sessionId, timestamp, aoi',
			userEvents: '++id, sessionId, timestamp, type',
			stateEvents: '++id, sessionId, timestamp, type',
			sessions: 'id, name, userName',
			dwells: '++id, sessionId, timestamp',
			xstateEvents: '++id, sessionId, timestamp, event, status',
			gazeInputs: '++id, sessionId, timestamp',
			fixationInputs: '++id, sessionId, timestamp',
			validationPoints: '++id, sessionId, timestamp, where'
		});
	}
}

export const db = new DevelexIDB();
