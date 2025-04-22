import { db } from '$lib/database/database';
import type { Dwell } from '$lib/database/models/Dwell';

export const dwellRepository = {
	create: async (dwell: Omit<Dwell, 'id'>): Promise<Dwell> => {
		const id = await db.dwells.add(dwell);
		return { ...dwell, id };
	},

	getAll: async (): Promise<Dwell[]> => {
		return await db.dwells.toArray();
	},

	getBySessionId: async (sessionId: string): Promise<Dwell[]> => {
		return await db.dwells.where('sessionId').equals(sessionId).toArray();
	},

	deleteBySessionId: async (sessionId: string): Promise<void> => {
		await db.dwells.where('sessionId').equals(sessionId).delete();
	},

	csvHeader(): string {
		return 'sessionId, timestamp, type, aoi, duration, gazeData.x, gazeData.y, gazeData.xL, gazeData.yL, gazeData.xR, gazeData.yR';
	},

	toCsv(data: Dwell): string {
		return `${data.sessionId},${data.timestamp},${data.type},${data.aoi},${data.duration},${data.gazeData.x},${data.gazeData.y},${data.gazeData.xL},${data.gazeData.yL},${data.gazeData.xR},${data.gazeData.yR}`;
	}
};

export default dwellRepository;
