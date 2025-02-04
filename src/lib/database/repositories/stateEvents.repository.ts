import { db } from '../database';
import type { RecordedEvent } from '../models/RecordedEvent';

const stateEventsRepository = {
	async getAll(): Promise<RecordedEvent[]> {
		try {
			const stateEvents = await db.stateEvents.toArray();

			return stateEvents;
		} catch (e) {
			console.error(e);

			return [];
		}
	},
	async create(data: RecordedEvent): Promise<number | null> {
		try {
			const id = await db.stateEvents.add({
				...data
			});

			return id;
		} catch (e) {
			console.error(e);

			return null;
		}
	},
	csvHeader(): string {
		return 'sessionId, timestamp, type, data';
	},
	toCsv(data: RecordedEvent): string {
		return `${data.sessionId},${data.timestamp},${data.type},${data.data}`;
	}
};

export default stateEventsRepository;
