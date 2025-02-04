import { db } from '../database';
import type { Session } from '../models/Session';

const sessionRepository = {
	async getAll(): Promise<Session[]> {
		try {
			const sessions = await db.sessions.toArray();
			return sessions;
		} catch (e) {
			console.error(e);
			return [];
		}
	},
	async create(data: Session): Promise<number | null> {
		try {
			const id = await db.sessions.add({
				...data
			});
			return id;
		} catch (e) {
			console.error(e);
			return null;
		}
	}
};

export default sessionRepository;
