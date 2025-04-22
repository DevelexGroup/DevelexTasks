import { db } from '../database';
import type { GazeDataPoint } from '@473783/develex-core';

const gazeInputRepository = {
	async getAll(): Promise<(GazeDataPoint & { clientTimestamp: string })[]> {
		try {
			const inputs = await db.gazeInputs.toArray();
			return inputs;
		} catch (e) {
			console.error(e);
			return [];
		}
	},
	async create(data: GazeDataPoint & { clientTimestamp: string }): Promise<number | null> {
		try {
			const id = await db.gazeInputs.add({
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
	): Promise<(GazeDataPoint & { clientTimestamp: string })[]> {
		try {
			return await db.gazeInputs.where('sessionId').equals(sessionId).toArray();
		} catch (e) {
			console.error(e);
			return [];
		}
	},
	csvHeader(): string {
		return 'sessionId, timestamp, deviceTimestamp, clientTimestamp, deviceId, x, y, xL, yL, xR, yR';
	},
	toCsv(data: GazeDataPoint & { clientTimestamp: string }): string {
		return `${data.sessionId},${data.timestamp},${data.deviceTimestamp},${data.clientTimestamp},${data.deviceId},${data.x},${data.y},${data.xL},${data.yL},${data.xR},${data.yR}`;
	}
};

export default gazeInputRepository;
