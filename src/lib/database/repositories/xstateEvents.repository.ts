import { db } from '../database';
import type { XStateEvent } from '../models/XStateEvent';

const xstateEventsRepository = {
	async getAll(): Promise<XStateEvent[]> {
		try {
			const xstateEvents = await db.xstateEvents.toArray();
			return xstateEvents;
		} catch (e) {
			console.error(e);
			return [];
		}
	},

	async create(data: XStateEvent): Promise<number | null> {
		try {
			const id = await db.xstateEvents.add({
				...data
			});
			return id;
		} catch (e) {
			console.error(e);
			return null;
		}
	},

	// Helper method to create an XStateEvent from the XState inspection event
	createFromInspectionEvent(
		sessionId: string,
		event: string,
		status: string,
		context: object,
		timestamp: string,
		task: string
	): XStateEvent {
		return {
			sessionId,
			event,
			status,
			context: JSON.stringify(context),
			timestamp,
			task
		};
	},

	csvHeader(): string {
		return 'sessionId,timestamp,event,status,context,task';
	},

	toCsv(data: XStateEvent): string {
		return `${data.sessionId},${data.task},${data.timestamp},${data.event},${data.status},${data.context}`;
	}
};

export default xstateEventsRepository;
