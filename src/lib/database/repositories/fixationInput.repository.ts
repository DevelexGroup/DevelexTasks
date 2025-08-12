import { db } from '../database';
import type { FixationDataPoint } from 'develex-js-sdk';

const fixationInputRepository = {
	async getAll(): Promise<(FixationDataPoint & { clientTimestamp: string })[]> {
		try {
			const fixations = await db.fixationInputs.toArray();
			return fixations;
		} catch (e) {
			console.error(e);
			return [];
		}
	},
	async create(data: FixationDataPoint & { clientTimestamp: string }): Promise<number | null> {
		try {
			const id = await db.fixationInputs.add({
				...data
			});
			return id;
		} catch (e) {
			console.error(e);
			return null;
		}
	},
	async getBySessionId(
		sessionId: string
	): Promise<(FixationDataPoint & { clientTimestamp: string })[]> {
		try {
			return await db.fixationInputs.where('sessionId').equals(sessionId).toArray();
		} catch (e) {
			console.error(e);
			return [];
		}
	},
	csvHeader(): string {
		return 'sessionId, timestamp, deviceTimestamp, clientTimestamp, x, y, xScreenRelative, yScreenRelative, duration, fixationId, deviceId';
	},
	toCsv(data: FixationDataPoint & { clientTimestamp: string }): string {
		return `${data.sessionId},${data.timestamp},${data.deviceTimestamp},${data.clientTimestamp},${data.x},${data.y},${data.xScreenRelative},${data.yScreenRelative},${data.duration},${data.fixationId},${data.deviceId}`;
	}
};

export default fixationInputRepository;
