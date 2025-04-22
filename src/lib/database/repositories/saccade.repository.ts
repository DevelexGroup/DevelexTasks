import { db } from '../database';
import type { Saccade } from '../models/Saccade';

const saccadeRepository = {
	async getAll(): Promise<Saccade[]> {
		try {
			const saccades = await db.saccades.toArray();

			return saccades;
		} catch (e) {
			console.error(e);

			return [];
		}
	},
	async create(data: Saccade): Promise<number | null> {
		try {
			const id = await db.saccades.add({
				...data
			});

			return id;
		} catch (e) {
			console.error(e);

			return null;
		}
	},
	csvHeader(): string {
		return 'sessionId, timestamp, type, duration, aoi, angleToScreen, angleToPrevious, angleToPreviousInvalidityTime, originFixation.x, originFixation.y, originFixation.deviceId, originFixation.fixationId, originFixation.deviceTimestamp, originFixation.duration, originFixation.timestamp, targetFixation.x, targetFixation.y, targetFixation.deviceId, targetFixation.fixationId, targetFixation.deviceTimestamp, targetFixation.duration, targetFixation.timestamp';
	},
	toCsv(data: Saccade): string {
		return `${data.sessionId},${data.timestamp},${data.type},${data.duration},${data.aoi},${data.angleToScreen},${data.angleToPrevious},${data.angleToPreviousInvalidityTime},${data.originFixation.x},${data.originFixation.y},${data.originFixation.deviceId},${data.originFixation.fixationId},${data.originFixation.deviceTimestamp},${data.originFixation.duration},${data.originFixation.timestamp},${data.targetFixation.x},${data.targetFixation.y},${data.targetFixation.deviceId},${data.targetFixation.fixationId},${data.targetFixation.deviceTimestamp},${data.targetFixation.duration},${data.targetFixation.timestamp}`;
	}
};

export default saccadeRepository;
