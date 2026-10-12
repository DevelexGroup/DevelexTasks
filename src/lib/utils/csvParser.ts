import type {
	GazeSampleDataEntry,
	FixationDataEntry,
	SessionScoreDataEntry,
	RawGazeDataEntry
} from '$lib/database/db.types';
import type { TaskResult } from '$lib/types/task.types';

/**
 * Parse a CSV line respecting quoted fields (handles commas inside quotes and escaped quotes)
 */
function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (inQuotes) {
			if (char === '"') {
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i++; // skip escaped quote
				} else {
					inQuotes = false;
				}
			} else {
				current += char;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
			} else if (char === ',') {
				result.push(current);
				current = '';
			} else {
				current += char;
			}
		}
	}
	result.push(current);
	return result;
}

/**
 * Parse formatted timestamp back to Unix timestamp (ms).
 * Handles UTC ISO formats "YYYY-MM-DDTHH:MM:SSZ" and "YYYY-MM-DDTHH:MM:SS.sssZ"
 * produced by DatabaseExporter.formatTimestamp().
 */
function parseFormattedTimestamp(formatted: string): number {
	if (!formatted) return 0;
	const ms = Date.parse(formatted);
	if (!Number.isNaN(ms)) return ms;
	return parseFloat(formatted) || 0;
}

function parseNumber(value: string): number {
	if (value === '' || value === null || value === undefined) return 0;
	return parseFloat(value) || 0;
}

function parseNullableNumber(value: string): number | null {
	if (value === '' || value === null || value === undefined) return null;
	const num = parseFloat(value);
	return isNaN(num) ? null : num;
}

function parsePipeArray(value: string): string[] {
	if (!value || value === '') return [];
	return value.split('|');
}

/**
 * Parse a gazeSamples CSV file back into GazeSampleDataEntry[].
 * Expected columns: ID, Child ID, Session ID, Task, Slide Index, Stimulus ID,
 * Timestamp, Eye X, Eye Y, AOI, Mouse X, Mouse Y, Event, Sound, Mistake Type, Result
 */
export const parseGazeSamplesCsv = (csvText: string, strict = false): GazeSampleDataEntry[] => {
	const lines = csvText.split('\n').filter((l) => l.trim());
	const headers = parseCsvLine(lines[0]?.trim() ?? '').map((header) => header.trim());
	const required = [
		'Child ID',
		'Session ID',
		'Task',
		'Slide Index',
		'Stimulus ID',
		'Timestamp',
		'Eye X',
		'Eye Y',
		'AOI',
		'Mouse X',
		'Mouse Y',
		'Event',
		'Sound',
		'Mistake Type',
		'Result'
	];

	if (required.some((header) => !headers.includes(header))) {
		if (strict) {
			throw new Error('Invalid gaze sample file header.');
		}

		return [];
	}

	const entries: GazeSampleDataEntry[] = [];
	const columns = new Map(headers.map((header, index) => [header, index]));

	for (let i = 1; i < lines.length; i++) {
		const cols = parseCsvLine(lines[i]);

		if (cols.length < headers.length) {
			if (strict) {
				throw new Error(`Incomplete gaze sample row ${i + 1}.`);
			}

			continue;
		}

		const value = (header: string): string => cols[columns.get(header) ?? -1] ?? '';

		entries.push({
			child_id: value('Child ID'),
			session_id: String(parseFormattedTimestamp(value('Session ID'))),
			task_name: value('Task'),
			slide_index: parseInt(value('Slide Index')) || 0,
			stimulus_id: value('Stimulus ID'),
			timestamp: parseFormattedTimestamp(value('Timestamp')),
			device_timestamp: value('Device Timestamp'),
			eyetracker_x: parseNullableNumber(value('Eye X')),
			eyetracker_y: parseNullableNumber(value('Eye Y')),
			aoi: parsePipeArray(value('AOI')),
			mouse_x: parseNumber(value('Mouse X')),
			mouse_y: parseNumber(value('Mouse Y')),
			events: parsePipeArray(value('Event')),
			sound_name: parsePipeArray(value('Sound')),
			mistake_type: parsePipeArray(value('Mistake Type')),
			task_result: (value('Result').trim() || null) as TaskResult | null
		});
	}

	return entries;
};

/**
 * Parse a fixationData CSV file back into FixationDataEntry[].
 * Expected columns: ID, Child ID, Session ID, Task, Slide Index, Stimulus ID,
 * Timestamp, Eye X, Eye Y, Duration, AOI, Fixation Index
 */
export interface I2mcFixationEntry extends FixationDataEntry {
	endTimestamp?: number;
	segment?: number;
}

export const parseFixationDataCsv = (csvText: string, strict = false): I2mcFixationEntry[] => {
	const lines = csvText.split('\n').filter((l) => l.trim());
	const headers = parseCsvLine(lines[0]?.trim() ?? '');

	if (
		strict &&
		(headers[4] !== 'Slide Index' ||
			headers[6] !== 'Timestamp' ||
			headers[9] !== 'Duration' ||
			headers[11] !== 'Fixation Index')
	) {
		throw new Error('Invalid I2MC fixation file header.');
	}

	if (lines.length < 2) {
		return [];
	}

	const entries: I2mcFixationEntry[] = [];
	const endColumn = headers.indexOf('End Timestamp');
	const segmentColumn = headers.indexOf('Segment');

	for (let i = 1; i < lines.length; i++) {
		const cols = parseCsvLine(lines[i]);

		if (
			strict &&
			(cols.length < 12 ||
				!Number.isInteger(Number(cols[4])) ||
				Number(cols[4]) < 0 ||
				!Number.isFinite(Number(cols[9])) ||
				Number(cols[9]) <= 0 ||
				parseFormattedTimestamp(cols[6]) <= 0)
		) {
			throw new Error(`Invalid I2MC fixation row ${i + 1}.`);
		}

		if (cols.length < 12) {
			continue;
		}

		entries.push({
			child_id: cols[1],
			session_id: String(parseFormattedTimestamp(cols[2])),
			task_name: cols[3],
			slide_index: parseInt(cols[4]) || 0,
			stimulus_id: cols[5],
			timestamp: parseFormattedTimestamp(cols[6]),
			eyetracker_x: parseNullableNumber(cols[7]),
			eyetracker_y: parseNullableNumber(cols[8]),
			duration: parseNumber(cols[9]),
			aoi: parsePipeArray(cols[10]),
			fixation_index: parseInt(cols[11]) || 0,
			...(endColumn >= 0 && cols[endColumn]?.trim()
				? { endTimestamp: parseFormattedTimestamp(cols[endColumn]) }
				: {}),
			...(segmentColumn >= 0 &&
			cols[segmentColumn]?.trim() &&
			Number.isFinite(Number(cols[segmentColumn]))
				? { segment: Number(cols[segmentColumn]) }
				: {})
		});
	}

	return entries;
};

/**
 * Parse a sessionScores CSV file back into SessionScoreDataEntry[].
 * Expected columns: ID, Child ID, Session ID, Task, Slide Index, Stimulus ID,
 * Timestamp, Fluency Score, Error Rate, Response Time, Mean Fixation Duration,
 * Fixation Count, AOI Target Fixations, AOI Field Fixations, Regression Count
 */
export function parseSessionScoresCsv(csvText: string): SessionScoreDataEntry[] {
	const lines = csvText.split('\n').filter((l) => l.trim());
	if (lines.length < 2) return [];

	const entries: SessionScoreDataEntry[] = [];
	for (let i = 1; i < lines.length; i++) {
		const cols = parseCsvLine(lines[i]);
		if (cols.length < 15) continue;

		entries.push({
			child_id: cols[1],
			session_id: String(parseFormattedTimestamp(cols[2])),
			task_name: cols[3],
			slide_index: parseInt(cols[4]) || 0,
			stimulus_id: cols[5],
			timestamp: parseFormattedTimestamp(cols[6]),
			fluency_score: parseNumber(cols[7]),
			error_rate: parseNumber(cols[8]),
			response_time: parseNumber(cols[9]),
			mean_fix_dur: parseNumber(cols[10]),
			fix_count: parseNumber(cols[11]),
			aoi_target_fix: parseNumber(cols[12]),
			aoi_field_fix: parseNumber(cols[13]),
			regression_count: parseNumber(cols[14])
		});
	}

	return entries;
}

/**
 * Parse a rawGazeData CSV file back into RawGazeDataEntry[].
 * Expected columns: ID, Child ID, Session ID, Task, Slide Index, Timestamp,
 * Bridge Timestamp, Device Timestamp, X, Y, Left X, Left Y, Left Validity,
 * Left Pupil Diameter, Right X, Right Y, Right Validity, Right Pupil Diameter
 */
export const parseRawGazeDataCsv = (
	csvText: string,
	preserveMissing = false
): RawGazeDataEntry[] => {
	const lines = csvText.split('\n').filter((l) => l.trim());
	const coordinate = preserveMissing ? (value: string) => parseFloat(value) : parseNumber;

	if (lines.length < 2) {
		return [];
	}

	const entries: RawGazeDataEntry[] = [];

	for (let i = 1; i < lines.length; i++) {
		const cols = parseCsvLine(lines[i]);

		if (cols.length < 18) {
			continue;
		}

		entries.push({
			child_id: cols[1],
			session_id: String(parseFormattedTimestamp(cols[2])),
			task_name: cols[3],
			slide_index: parseInt(cols[4]) || 0,
			timestamp: parseFormattedTimestamp(cols[5]),
			bridgeTimeStamp: cols[6],
			deviceTimeStamp: cols[7],
			x: coordinate(cols[8]),
			y: coordinate(cols[9]),
			xL: coordinate(cols[10]),
			yL: coordinate(cols[11]),
			validityL: cols[12] === 'true',
			pupilDiameterL: parseNumber(cols[13]),
			xR: coordinate(cols[14]),
			yR: coordinate(cols[15]),
			validityR: cols[16] === 'true',
			pupilDiameterR: parseNumber(cols[17])
		});
	}

	return entries;
};
