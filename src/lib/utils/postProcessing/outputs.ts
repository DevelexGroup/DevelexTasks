import type { PostProcessor, PostProcessorOutput } from '$lib/api/test-sessions';
import { parseCsvLine, parseFormattedTimestamp } from '$lib/utils/csvParser';
import { hitTest } from '$lib/utils/sessionSim/aoi/hitTest';
import type { AoiRect } from '$lib/utils/sessionSim/types';

/** One CSV a processor produced, kept cell for cell so it re-exports unchanged. */
export interface ProcessorOutputFile {
	fileName: string;
	headers: string[];
	rows: string[][];
}

/** Every output file of one processor in one session. */
export interface ProcessorOutputs {
	processor: PostProcessor;
	files: ProcessorOutputFile[];
}

export interface OutputPoint {
	x: number;
	y: number;
}

/** One output row read through the processor's declared columns. */
export interface OutputRow {
	slide: number;
	/** Epoch ms. */
	time: number;
	duration: number | null;
	/** One entry per declared point pair; null when the cells are empty. */
	points: (OutputPoint | null)[];
	aoi: string[];
}

export type PointMapper = (x: number, y: number) => OutputPoint;

export interface ShiftContext {
	/** Maps a point of the given slide to its displayed position; null leaves the slide untouched. */
	mapperFor(slide: number): PointMapper | null;
	/** AOIs to re-attribute shifted rows against; null keeps the stored AOI cell. */
	aoisFor(slide: number): AoiRect[] | null;
}

const BACKUP_FILE_PREFIX = 'backup_';
const AOI_SEPARATOR = '|';

/** The processor whose output prefix the file name starts with; backups never match. */
export function outputProcessorOf(
	fileName: string,
	processors: PostProcessor[]
): PostProcessor | null {
	if (fileName.toLowerCase().startsWith(BACKUP_FILE_PREFIX)) return null;
	return processors.find((processor) => fileName.startsWith(processor.outputFilePrefix)) ?? null;
}

export function parseOutputCsv(fileName: string, text: string): ProcessorOutputFile {
	const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
	const lines = body.split(/\r?\n/).filter((line) => line.trim() !== '');
	return {
		fileName,
		headers: lines.length > 0 ? parseCsvLine(lines[0]) : [],
		rows: lines.slice(1).map(parseCsvLine)
	};
}

function csvCell(value: string): string {
	return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function serializeOutputCsv(file: ProcessorOutputFile): string {
	return [file.headers, ...file.rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}

function numberOrNull(value: string | undefined): number | null {
	if (value === undefined || value.trim() === '') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

interface ColumnIndex {
	slide: number;
	time: number;
	duration: number;
	points: { x: number; y: number }[];
	aoi: number;
}

function columnIndex(headers: string[], schema: PostProcessorOutput): ColumnIndex {
	const at = (column: string | null) => (column === null ? -1 : headers.indexOf(column));
	return {
		slide: at(schema.slideColumn),
		time: at(schema.timeColumn),
		duration: at(schema.durationColumn),
		points: schema.points.map((point) => ({ x: at(point.x), y: at(point.y) })),
		aoi: at(schema.aoiColumn)
	};
}

function readPoint(cells: string[], columns: { x: number; y: number }): OutputPoint | null {
	if (columns.x < 0 || columns.y < 0) return null;
	const x = numberOrNull(cells[columns.x]);
	const y = numberOrNull(cells[columns.y]);
	return x === null || y === null ? null : { x, y };
}

/** Rows with a readable slide index; older files missing a declared column yield nulls for it. */
export function readOutputRows(
	file: ProcessorOutputFile,
	schema: PostProcessorOutput
): OutputRow[] {
	const columns = columnIndex(file.headers, schema);
	if (columns.slide < 0) return [];
	const rows: OutputRow[] = [];
	for (const cells of file.rows) {
		const slide = numberOrNull(cells[columns.slide]);
		if (slide === null) continue;
		const aoiCell = columns.aoi >= 0 ? (cells[columns.aoi] ?? '') : '';
		rows.push({
			slide,
			time: columns.time >= 0 ? parseFormattedTimestamp(cells[columns.time] ?? '') : 0,
			duration: columns.duration >= 0 ? numberOrNull(cells[columns.duration]) : null,
			points: columns.points.map((point) => readPoint(cells, point)),
			aoi: aoiCell === '' ? [] : aoiCell.split(AOI_SEPARATOR)
		});
	}
	return rows;
}

/** Slide of the file's rows, else the `slideN` in its name; null when neither tells. */
export function slideOfOutputFile(
	file: ProcessorOutputFile,
	schema: PostProcessorOutput | null
): number | null {
	if (schema) {
		const first = readOutputRows(file, schema)[0];
		if (first) return first.slide;
	}
	const match = /slide(\d+)/i.exec(file.fileName);
	return match ? Number(match[1]) : null;
}

function formatCoordinate(value: number): string {
	return String(Math.round(value * 1000) / 1000);
}

/** Same rule as the server: centroid inside the buffered rect, validity overlapping the row's interval. */
function attributeAois(point: OutputPoint, start: number, end: number, aois: AoiRect[]): string[] {
	const ids: string[] = [];
	for (const rect of aois) {
		if (rect.fromTs !== undefined && rect.fromTs > end) continue;
		if (rect.toTs !== undefined && rect.toTs < start) continue;
		if (hitTest(point.x, point.y, rect) && !ids.includes(rect.id)) ids.push(rect.id);
	}
	return ids;
}

/**
 * Moves every declared point of the file through the slide's mapper and
 * re-attributes the AOI cell from the first point. Other cells, including
 * spatial metrics, stay as computed.
 */
export function shiftOutputFile(
	file: ProcessorOutputFile,
	schema: PostProcessorOutput,
	context: ShiftContext
): ProcessorOutputFile {
	const columns = columnIndex(file.headers, schema);
	if (columns.slide < 0) return file;
	let changed = false;
	const rows = file.rows.map((cells) => {
		const slide = numberOrNull(cells[columns.slide]);
		const mapper = slide === null ? null : context.mapperFor(slide);
		if (slide === null || !mapper) return cells;

		const next = [...cells];
		let centroid: OutputPoint | null = null;
		for (const point of columns.points) {
			const position = readPoint(cells, point);
			if (!position) continue;
			const mapped = mapper(position.x, position.y);
			next[point.x] = formatCoordinate(mapped.x);
			next[point.y] = formatCoordinate(mapped.y);
			centroid ??= mapped;
		}

		const aois = context.aoisFor(slide);
		if (columns.aoi >= 0 && centroid && aois) {
			const start = columns.time >= 0 ? parseFormattedTimestamp(cells[columns.time] ?? '') : 0;
			const duration = columns.duration >= 0 ? (numberOrNull(cells[columns.duration]) ?? 0) : 0;
			next[columns.aoi] = attributeAois(centroid, start, start + duration, aois).join(
				AOI_SEPARATOR
			);
		}
		changed = true;
		return next;
	});
	return changed ? { ...file, rows } : file;
}
