import JSZip from 'jszip';
import type {
	FixationDataEntry,
	GazeSampleDataEntry,
	RawGazeDataEntry,
	SessionScoreDataEntry
} from '$lib/database/db.types';
import {
	downloadTestSessionFile,
	getTestSessionDetail,
	type PostProcessor
} from '$lib/api/test-sessions';
import {
	parseFixationDataCsv,
	parseGazeSamplesCsv,
	parseRawGazeDataCsv,
	parseSessionScoresCsv
} from '$lib/utils/csvParser';
import {
	outputProcessorOf,
	parseOutputCsv,
	type ProcessorOutputs
} from '$lib/utils/postProcessing/outputs';
import type { AoiRect, LoadedSession, RecordedSessionMeta, RecordedSlideGeometry } from './types';

type TableKind =
	| 'gazeSamples'
	| 'fixationData'
	| 'sessionScores'
	| 'rawGazeData'
	| 'aoiGeometry'
	| 'sessionMeta';

type RowKind = Exclude<TableKind, 'aoiGeometry' | 'sessionMeta'>;

type TableRow = GazeSampleDataEntry | FixationDataEntry | SessionScoreDataEntry | RawGazeDataEntry;

interface SessionTables {
	gazeSamples: GazeSampleDataEntry[];
	fixationData: FixationDataEntry[];
	sessionScores: SessionScoreDataEntry[];
	rawGazeData: RawGazeDataEntry[];
	recordedGeometry: RecordedSlideGeometry[];
	processorOutputs: ProcessorOutputs[];
	sessionMeta: RecordedSessionMeta | null;
	sessionMetaRaw: string | null;
}

/** Minimal file shape shared by DOM File and test fixtures. */
export interface NamedTextFile {
	name: string;
	text(): Promise<string>;
}

/** Prefix the backend gives replaced files it keeps as backups; never load them as data. */
export const BACKUP_FILE_PREFIX = 'backup_';

export function isBackupFileName(fileName: string): boolean {
	return fileName.toLowerCase().startsWith(BACKUP_FILE_PREFIX);
}

/** Matched by prefix, so processor outputs such as I2MC_fixationData never pass as tables. */
export function classifyFileName(fileName: string): TableKind | null {
	const lower = fileName.toLowerCase();
	if (lower.startsWith(BACKUP_FILE_PREFIX)) return null;
	if (lower === 'meta.json') return 'sessionMeta';
	if (lower.startsWith('aoigeometry')) return 'aoiGeometry';
	if (lower.startsWith('rawgazedata')) return 'rawGazeData';
	if (lower.startsWith('gazesamples')) return 'gazeSamples';
	if (lower.startsWith('fixationdata')) return 'fixationData';
	if (lower.startsWith('sessionscores')) return 'sessionScores';
	return null;
}

type FileKind = TableKind | { processor: PostProcessor };

function classifyInput(fileName: string, processors: PostProcessor[]): FileKind | null {
	const processor = outputProcessorOf(fileName, processors);
	return processor ? { processor } : classifyFileName(fileName);
}

function emptyTables(): SessionTables {
	return {
		gazeSamples: [],
		fixationData: [],
		sessionScores: [],
		rawGazeData: [],
		recordedGeometry: [],
		processorOutputs: [],
		sessionMeta: null,
		sessionMetaRaw: null
	};
}

export function parseSessionMetaJson(jsonText: string): RecordedSessionMeta | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonText);
	} catch {
		return null;
	}
	if (typeof parsed !== 'object' || parsed === null) return null;
	const doc = parsed as Record<string, unknown>;

	const viewportDoc = (doc.viewport ?? {}) as Record<string, unknown>;
	const width = Number(viewportDoc.innerWidth);
	const height = Number(viewportDoc.innerHeight);
	const viewport = width > 0 && height > 0 ? { width, height } : null;

	const tracker = (doc.tracker ?? {}) as Record<string, unknown>;
	const signal = (tracker.signal ?? {}) as Record<string, unknown>;
	const measured = Number(signal.measuredFrequencyHz);
	const measuredFrequencyHz = Number.isFinite(measured) && measured > 0 ? measured : null;

	const session = (doc.session ?? {}) as Record<string, unknown>;
	const samplesPerSlide: Record<number, number> = {};
	if (typeof session.samplesPerSlide === 'object' && session.samplesPerSlide !== null) {
		for (const [slideKey, count] of Object.entries(session.samplesPerSlide)) {
			const slide = Number(slideKey);
			if (Number.isFinite(slide) && Number.isFinite(Number(count))) {
				samplesPerSlide[slide] = Number(count);
			}
		}
	}

	let recalculated: RecordedSessionMeta['recalculated'] = null;
	if (typeof doc.recalculated === 'object' && doc.recalculated !== null) {
		const ledger = doc.recalculated as Record<string, unknown>;
		recalculated = {
			at: typeof ledger.at === 'string' ? ledger.at : null,
			items: Array.isArray(ledger.items)
				? ledger.items.filter((item): item is string => typeof item === 'string')
				: []
		};
	}

	return { viewport, measuredFrequencyHz, samplesPerSlide, recalculated };
}

export function parseAoiGeometryJson(jsonText: string): RecordedSlideGeometry | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonText);
	} catch {
		return null;
	}
	if (typeof parsed !== 'object' || parsed === null) return null;
	const doc = parsed as Record<string, unknown>;
	const slideIndex = Number(doc.slideIndex);
	if (!Number.isFinite(slideIndex) || slideIndex < 0) return null;

	const viewport = (doc.viewport ?? {}) as Record<string, unknown>;
	const aois: AoiRect[] = [];
	for (const raw of Array.isArray(doc.aois) ? doc.aois : []) {
		const aoi = raw as Record<string, unknown>;
		if (typeof aoi.id !== 'string') continue;
		const numbers = [aoi.left, aoi.top, aoi.right, aoi.bottom].map(Number);
		if (numbers.some((value) => !Number.isFinite(value))) continue;
		const rect: AoiRect = {
			id: aoi.id,
			left: numbers[0],
			top: numbers[1],
			right: numbers[2],
			bottom: numbers[3],
			bufferSize: Number.isFinite(Number(aoi.bufferSize)) ? Number(aoi.bufferSize) : 0
		};
		if (Number.isFinite(Number(aoi.fromTs))) rect.fromTs = Number(aoi.fromTs);
		if (Number.isFinite(Number(aoi.toTs))) rect.toTs = Number(aoi.toTs);
		aois.push(rect);
	}

	return {
		slideIndex,
		stimulusId: typeof doc.stimulusId === 'string' ? doc.stimulusId : null,
		viewport: {
			width: Number.isFinite(Number(viewport.width)) ? Number(viewport.width) : 0,
			height: Number.isFinite(Number(viewport.height)) ? Number(viewport.height) : 0
		},
		aois
	};
}

function parseRows(kind: RowKind, text: string): TableRow[] {
	if (kind === 'gazeSamples') return parseGazeSamplesCsv(text);
	if (kind === 'fixationData') return parseFixationDataCsv(text);
	if (kind === 'sessionScores') return parseSessionScoresCsv(text);
	return parseRawGazeDataCsv(text);
}

function pushRows(tables: SessionTables, kind: RowKind, rows: TableRow[]): void {
	(tables[kind] as TableRow[]).push(...rows);
}

function parseAuxiliary(tables: SessionTables, kind: 'aoiGeometry' | 'sessionMeta', text: string) {
	if (kind === 'aoiGeometry') {
		const geometry = parseAoiGeometryJson(text);
		if (geometry) tables.recordedGeometry.push(geometry);
		return;
	}
	const parsed = parseSessionMetaJson(text);
	if (parsed) {
		tables.sessionMeta = parsed;
		tables.sessionMetaRaw = text;
	}
}

function addProcessorOutput(
	tables: SessionTables,
	processor: PostProcessor,
	fileName: string,
	text: string
): void {
	let outputs = tables.processorOutputs.find((entry) => entry.processor.name === processor.name);
	if (!outputs) {
		outputs = { processor, files: [] };
		tables.processorOutputs.push(outputs);
	}
	// Overlapping exports repeat the same file
	if (outputs.files.some((file) => file.fileName === fileName)) return;
	outputs.files.push(parseOutputCsv(fileName, text));
}

interface SessionIdentity {
	childId?: string;
	sessionId?: string;
	taskName?: string;
	exportFolder?: string;
}

/** `yyyy-MM-dd_HH-mm-ss` in local time, the stamp the server puts in session folder names. */
export function sessionFolderStamp(date: Date): string {
	const pad = (value: number) => String(value).padStart(2, '0');
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	const time = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
	return `${day}_${time}`;
}

export function sessionExportFolder(
	username: string,
	sessionStartTime: Date | string | number,
	testType: string
): string {
	const start = new Date(sessionStartTime);
	const stamp = Number.isNaN(start.getTime())
		? String(sessionStartTime)
		: sessionFolderStamp(start);
	return `${username}/${stamp}_${testType}`;
}

/** Full-content dedupe; overlapping exports (original + corrected) repeat rows. */
function dedupeRows<T>(entries: T[]): { rows: T[]; removed: number } {
	if (entries.length < 2) return { rows: entries, removed: 0 };
	const seen = new Set<string>();
	const rows: T[] = [];
	for (const entry of entries) {
		const key = JSON.stringify(entry);
		if (seen.has(key)) continue;
		seen.add(key);
		rows.push(entry);
	}
	return { rows, removed: entries.length - rows.length };
}

/** Recordings since 2026-08 stamp raw rows directly with bridge time. */
function isBridgeStamped(rows: RawGazeDataEntry[]): boolean {
	let parseable = 0;
	let matching = 0;
	for (const row of rows) {
		const bridgeMs = Date.parse(row.bridgeTimeStamp);
		if (Number.isNaN(bridgeMs)) continue;
		parseable++;
		if (Math.abs(row.timestamp - bridgeMs) <= 1) matching++;
	}
	return parseable > 0 && matching / parseable >= 0.99;
}

function finalizeSession(
	tables: SessionTables,
	identity: SessionIdentity,
	extraWarnings: string[] = []
): LoadedSession {
	const warnings: string[] = [...extraWarnings];
	const byTimestamp = <T extends { timestamp: number }>(entries: T[]) =>
		entries.sort((a, b) => a.timestamp - b.timestamp);

	let removedDuplicates = 0;
	const dedupeTable = <T>(entries: T[]): T[] => {
		const { rows, removed } = dedupeRows(entries);
		removedDuplicates += removed;
		return rows;
	};
	tables.gazeSamples = dedupeTable(tables.gazeSamples);
	tables.fixationData = dedupeTable(tables.fixationData);
	tables.sessionScores = dedupeTable(tables.sessionScores);
	tables.rawGazeData = dedupeTable(tables.rawGazeData);
	if (removedDuplicates > 0) {
		warnings.push(
			`Odstraněno ${removedDuplicates} duplicitních řádků – vstup zřejmě obsahoval překrývající se soubory.`
		);
	}

	byTimestamp(tables.gazeSamples);
	byTimestamp(tables.fixationData);
	byTimestamp(tables.rawGazeData);

	const anyRow = tables.rawGazeData[0] ?? tables.gazeSamples[0] ?? tables.fixationData[0];
	if (tables.gazeSamples.length === 0)
		warnings.push('Chybí gazeSamples data – bez event markerů nelze určit časová okna slidů.');
	if (tables.rawGazeData.length === 0)
		warnings.push('Chybí rawGazeData – fixace není z čeho přepočítat.');

	if (tables.sessionMeta?.recalculated) {
		const items = tables.sessionMeta.recalculated.items;
		warnings.push(
			`Metadata sezení byla dodatečně rekonstruována${items.length > 0 ? ` (${items.join(', ')})` : ''} – nemusí odpovídat skutečnému prostředí záznamu.`
		);
	}

	// The meta file records how many raw samples each slide had live
	if (tables.sessionMeta) {
		const loadedPerSlide = new Map<number, number>();
		for (const row of tables.rawGazeData) {
			loadedPerSlide.set(row.slide_index, (loadedPerSlide.get(row.slide_index) ?? 0) + 1);
		}
		for (const [slideKey, recorded] of Object.entries(tables.sessionMeta.samplesPerSlide)) {
			const slide = Number(slideKey);
			const loaded = loadedPerSlide.get(slide) ?? 0;
			if (loaded < recorded) {
				warnings.push(
					`Slide ${slide}: načteno ${loaded} z ${recorded} raw vzorků zaznamenaných při nahrávání.`
				);
			}
		}
	}

	const childId = identity.childId ?? anyRow?.child_id ?? 'unknown';
	const sessionId = identity.sessionId ?? anyRow?.session_id ?? 'unknown';
	const taskName = identity.taskName ?? anyRow?.task_name ?? 'unknown';
	const sessionMs = parseFloat(sessionId);

	return {
		childId,
		sessionId,
		taskName,
		gazeSamples: tables.gazeSamples,
		fixationData: tables.fixationData,
		sessionScores: tables.sessionScores,
		rawGazeData: tables.rawGazeData,
		recordedGeometry: tables.recordedGeometry.sort((a, b) => a.slideIndex - b.slideIndex),
		processorOutputs: tables.processorOutputs
			.map((entry) => ({
				...entry,
				files: entry.files.sort((a, b) => a.fileName.localeCompare(b.fileName))
			}))
			.sort((a, b) => a.processor.name.localeCompare(b.processor.name)),
		meta: tables.sessionMeta,
		metaRaw: tables.sessionMetaRaw,
		bridgeStamped: isBridgeStamped(tables.rawGazeData),
		exportFolder:
			identity.exportFolder ??
			sessionExportFolder(childId, Number.isFinite(sessionMs) ? sessionMs : sessionId, taskName),
		warnings
	};
}

export interface RemoteSessionRef {
	id: string;
	username: string;
	testType: string;
	sessionStartTime: Date | string;
}

/**
 * Downloads and parses all table CSVs of a remote test session, including the
 * rawGazeData files the heatmap loader skips, plus the outputs of the given
 * post-processors.
 */
export async function loadRemoteSession(
	ref: RemoteSessionRef,
	processors: PostProcessor[] = []
): Promise<LoadedSession> {
	const detail = await getTestSessionDetail(ref.id);

	const remoteFiles = new Map<string, { fileId: string; fileName: string; kind: FileKind }>();
	const collect = (files: { id: string; fileName: string }[] | undefined) => {
		for (const file of files ?? []) {
			const kind = classifyInput(file.fileName, processors);
			if (kind && !remoteFiles.has(file.id)) {
				remoteFiles.set(file.id, { fileId: file.id, fileName: file.fileName, kind });
			}
		}
	};
	for (const part of detail.parts ?? []) collect(part.files);
	collect(detail.files);

	const tables = emptyTables();
	const downloads = await Promise.all(
		[...remoteFiles.values()].map(async ({ fileId, fileName, kind }) => {
			const blob = await downloadTestSessionFile(ref.id, fileId);
			return { kind, fileName, text: await blob.text() };
		})
	);
	for (const { kind, fileName, text } of downloads) {
		if (typeof kind === 'object') addProcessorOutput(tables, kind.processor, fileName, text);
		else if (kind === 'aoiGeometry' || kind === 'sessionMeta') parseAuxiliary(tables, kind, text);
		else pushRows(tables, kind, parseRows(kind, text));
	}

	const testType = detail.testType ?? ref.testType;
	return finalizeSession(tables, {
		childId: ref.username,
		sessionId: tables.rawGazeData[0]?.session_id ?? tables.gazeSamples[0]?.session_id,
		taskName: testType,
		exportFolder: sessionExportFolder(ref.username, ref.sessionStartTime, testType)
	});
}

// ── File input ──

interface InputEntry {
	path: string;
	kind: FileKind;
	text(): Promise<string>;
}

const PART_FOLDER = /^(meta|part_-?\d+)$/i;

function fileNameOf(path: string): string {
	return path.split('/').pop() ?? path;
}

/**
 * Directory a file's session occupies: its path minus the file name and a
 * trailing `meta`/`part_N` segment of the server layout. Flat input yields ''.
 */
export function sessionFolderOf(path: string): string {
	const segments = path.split('/').filter(Boolean);
	segments.pop();
	if (segments.length > 0 && PART_FOLDER.test(segments[segments.length - 1])) segments.pop();
	return segments.join('/');
}

/** `<username>/<sessionFolder>` from an input directory; the child id stands in for a missing username. */
function exportFolderFromInput(folder: string, childId: string): string | undefined {
	const segments = folder.split('/').filter(Boolean);
	if (segments.length >= 2) return segments.slice(-2).join('/');
	if (segments.length === 1) return `${childId}/${segments[0]}`;
	return undefined;
}

async function expandInputs(
	files: NamedTextFile[],
	processors: PostProcessor[]
): Promise<InputEntry[]> {
	const entries: InputEntry[] = [];
	for (const file of files) {
		if (file.name.toLowerCase().endsWith('.zip') && 'arrayBuffer' in file) {
			const zip = await JSZip.loadAsync(await (file as unknown as Blob).arrayBuffer());
			for (const entry of Object.values(zip.files)) {
				if (entry.dir) continue;
				const kind = classifyInput(fileNameOf(entry.name), processors);
				if (kind) entries.push({ path: entry.name, kind, text: () => entry.async('string') });
			}
		} else {
			const kind = classifyInput(fileNameOf(file.name), processors);
			if (kind) entries.push({ path: file.name, kind, text: () => file.text() });
		}
	}
	return entries;
}

/**
 * Loads every session found in one input directory. Table rows are keyed by
 * their own child/session id, so a flat folder holding several sessions still
 * splits; geometry, meta and processor output files are only attributed when
 * the folder holds a single session.
 */
async function loadFolderGroup(folder: string, entries: InputEntry[]): Promise<LoadedSession[]> {
	const buckets = new Map<string, SessionTables>();
	const auxiliary = emptyTables();

	for (const entry of entries) {
		const text = await entry.text();
		const kind = entry.kind;
		if (typeof kind === 'object') {
			addProcessorOutput(auxiliary, kind.processor, fileNameOf(entry.path), text);
			continue;
		}
		if (kind === 'aoiGeometry' || kind === 'sessionMeta') {
			parseAuxiliary(auxiliary, kind, text);
			continue;
		}
		const byIdentity = new Map<string, TableRow[]>();
		for (const row of parseRows(kind, text)) {
			const key = `${row.child_id}|${row.session_id}`;
			const rows = byIdentity.get(key) ?? [];
			rows.push(row);
			byIdentity.set(key, rows);
		}
		for (const [key, rows] of byIdentity) {
			const tables = buckets.get(key) ?? emptyTables();
			pushRows(tables, kind, rows);
			buckets.set(key, tables);
		}
	}

	const hasAuxiliary =
		auxiliary.recordedGeometry.length > 0 ||
		auxiliary.sessionMeta !== null ||
		auxiliary.processorOutputs.length > 0;
	const sessions: LoadedSession[] = [];
	for (const tables of buckets.values()) {
		const warnings: string[] = [];
		if (buckets.size === 1) {
			tables.recordedGeometry = auxiliary.recordedGeometry;
			tables.sessionMeta = auxiliary.sessionMeta;
			tables.sessionMetaRaw = auxiliary.sessionMetaRaw;
			tables.processorOutputs = auxiliary.processorOutputs;
		} else if (hasAuxiliary) {
			warnings.push(
				'Soubory aoiGeometry/meta.json a výstupy zpracování nelze přiřadit – vstup obsahuje více sezení ve stejné složce.'
			);
		}
		const anyRow = tables.rawGazeData[0] ?? tables.gazeSamples[0] ?? tables.fixationData[0];
		sessions.push(
			finalizeSession(
				tables,
				{ exportFolder: exportFolderFromInput(folder, anyRow?.child_id ?? 'unknown') },
				warnings
			)
		);
	}
	return sessions;
}

/**
 * Loads all sessions from dropped files: server-layout ZIPs
 * (`<username>/<session>/part_N/…`), local exports, flat ZIPs and loose CSVs,
 * in any combination.
 */
export async function loadSessionsFromFiles(
	files: NamedTextFile[],
	processors: PostProcessor[] = []
): Promise<LoadedSession[]> {
	const groups = new Map<string, InputEntry[]>();
	for (const entry of await expandInputs(files, processors)) {
		const folder = sessionFolderOf(entry.path);
		const group = groups.get(folder) ?? [];
		group.push(entry);
		groups.set(folder, group);
	}

	const sessions: LoadedSession[] = [];
	for (const [folder, entries] of groups) {
		sessions.push(...(await loadFolderGroup(folder, entries)));
	}
	return sessions.sort((a, b) => a.exportFolder.localeCompare(b.exportFolder));
}

export async function loadSessionsFromZip(
	data: Blob | ArrayBuffer | Uint8Array,
	processors: PostProcessor[] = []
): Promise<LoadedSession[]> {
	const blob = data instanceof Blob ? data : new Blob([data as BlobPart]);
	const file = {
		name: 'input.zip',
		text: () => blob.text(),
		arrayBuffer: () => blob.arrayBuffer()
	};
	return loadSessionsFromFiles([file], processors);
}
