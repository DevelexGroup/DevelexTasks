import type {
	GazeSampleDataEntry,
	FixationDataEntry,
	SessionScoreDataEntry
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
export function parseGazeSamplesCsv(csvText: string): GazeSampleDataEntry[] {
	const lines = csvText.split('\n').filter((l) => l.trim());
	if (lines.length < 2) return [];

	const entries: GazeSampleDataEntry[] = [];
	for (let i = 1; i < lines.length; i++) {
		const cols = parseCsvLine(lines[i]);
		if (cols.length < 17) continue;

		entries.push({
			child_id: cols[1],
			session_id: String(parseFormattedTimestamp(cols[2])),
			task_name: cols[3],
			slide_index: parseInt(cols[4]) || 0,
			stimulus_id: cols[5],
			timestamp: parseFormattedTimestamp(cols[6]),
			device_timestamp: cols[7],
			eyetracker_x: parseNullableNumber(cols[8]),
			eyetracker_y: parseNullableNumber(cols[9]),
			aoi: parsePipeArray(cols[10]),
			mouse_x: parseNumber(cols[11]),
			mouse_y: parseNumber(cols[12]),
			events: parsePipeArray(cols[13]),
			sound_name: parsePipeArray(cols[14]),
			mistake_type: parsePipeArray(cols[15]),
			task_result: (cols[16] || null) as TaskResult | null
		});
	}

	return entries;
}

/**
 * Parse a fixationData CSV file back into FixationDataEntry[].
 * Expected columns: ID, Child ID, Session ID, Task, Slide Index, Stimulus ID,
 * Timestamp, Eye X, Eye Y, Duration, AOI, Fixation Index
 */
export function parseFixationDataCsv(csvText: string): FixationDataEntry[] {
	const lines = csvText.split('\n').filter((l) => l.trim());
	if (lines.length < 2) return [];

	const entries: FixationDataEntry[] = [];
	for (let i = 1; i < lines.length; i++) {
		const cols = parseCsvLine(lines[i]);
		if (cols.length < 12) continue;

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
			fixation_index: parseInt(cols[11]) || 0
		});
	}

	return entries;
}

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

