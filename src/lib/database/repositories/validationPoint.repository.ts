import { db } from '../database';
import type { ValidationPoint } from '../models/ValidationPoint';

// Escape a value for CSV format - moved outside the repository object
const escapeCsvValue = (value: string | number | null | undefined): string => {
	if (value === null || value === undefined) {
		return '';
	}

	// Convert to string
	const strValue = String(value);

	// If the string contains commas, quotes, or newlines, wrap it in quotes and escape existing quotes
	if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
		// Double each quote character to escape it
		return `"${strValue.replace(/"/g, '""')}"`;
	}

	return strValue;
};

const validationPointRepository = {
	async getAll(): Promise<ValidationPoint[]> {
		try {
			const validationPoints = await db.validationPoints.toArray();
			return validationPoints;
		} catch (e) {
			console.error(e);
			return [];
		}
	},

	async getBySessionId(sessionId: string): Promise<ValidationPoint[]> {
		try {
			const validationPoints = await db.validationPoints
				.where('sessionId')
				.equals(sessionId)
				.toArray();
			return validationPoints;
		} catch (e) {
			console.error(e);
			return [];
		}
	},

	async create(data: ValidationPoint): Promise<number | null> {
		try {
			const id = await db.validationPoints.add({
				...data
			});
			return id;
		} catch (e) {
			console.error(e);
			return null;
		}
	},

	csvHeader(): string {
		return 'id,sessionId,timestamp,where,accuracy,precision,gazePointCount,gazePointIds';
	},

	toCsv(validationPoint: ValidationPoint): string {
		return [
			escapeCsvValue(validationPoint.id),
			escapeCsvValue(validationPoint.sessionId),
			escapeCsvValue(validationPoint.timestamp),
			escapeCsvValue(validationPoint.where),
			escapeCsvValue(validationPoint.accuracy),
			escapeCsvValue(validationPoint.precision),
			escapeCsvValue(validationPoint.gazePointCount),
			escapeCsvValue(validationPoint.gazePointIds)
		].join(',');
	}
};

export default validationPointRepository;
