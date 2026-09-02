import JSZip from 'jszip';
import type {
	FixationDataEntry,
	GazeSampleDataEntry,
	RawGazeDataEntry,
	SessionScoreDataEntry
} from '$lib/database/db.types';
import { downloadTestSessionFile, getTestSessionDetail } from '$lib/api/test-sessions';
import {
	parseFixationDataCsv,
	parseGazeSamplesCsv,
	parseRawGazeDataCsv,
	parseSessionScoresCsv
} from '$lib/utils/csvParser';
import type { AoiRect, LoadedSession, RecordedSessionMeta, RecordedSlideGeometry } from './types';

type TableKind =
	| 'gazeSamples'
	| 'fixationData'
	| 'i2mcFixationData'
	| 'sessionScores'
	| 'rawGazeData'
	| 'aoiGeometry'
	| 'sessionMeta';

interface SessionTables {
	gazeSamples: GazeSampleDataEntry[];
	fixationData: FixationDataEntry[];
	i2mcFixationData: FixationDataEntry[];
	sessionScores: SessionScoreDataEntry[];
	rawGazeData: RawGazeDataEntry[];
	recordedGeometry: RecordedSlideGeometry[];
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

export function classifyFileName(fileName: string): TableKind | null {
	const lower = fileName.toLowerCase();
	if (lower.startsWith(BACKUP_FILE_PREFIX)) return null;
	if (lower === 'meta.json') return 'sessionMeta';
	if (lower.includes('aoigeometry')) return 'aoiGeometry';
	if (lower.includes('rawgazedata')) return 'rawGazeData';
	if (lower.includes('gazesamples')) return 'gazeSamples';
	// I2MC files contain "fixationdata" too, so this branch must come first
	if (lower.includes('i2mc')) return lower.includes('fixationdata') ? 'i2mcFixationData' : null;
	if (lower.includes('fixationdata')) return 'fixationData';
	if (lower.includes('sessionscores')) return 'sessionScores';
	return null;
}

function emptyTables(): SessionTables {
	return {
		gazeSamples: [],
		fixationData: [],
		i2mcFixationData: [],
		sessionScores: [],
		rawGazeData: [],
		recordedGeometry: [],
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

function parseInto(tables: SessionTables, kind: TableKind, text: string): void {
	if (kind === 'gazeSamples') tables.gazeSamples.push(...parseGazeSamplesCsv(text));
	else if (kind === 'fixationData') tables.fixationData.push(...parseFixationDataCsv(text));
	else if (kind === 'i2mcFixationData') tables.i2mcFixationData.push(...parseFixationDataCsv(text));
	else if (kind === 'sessionScores') tables.sessionScores.push(...parseSessionScoresCsv(text));
	else if (kind === 'aoiGeometry') {
		const geometry = parseAoiGeometryJson(text);
		if (geometry) tables.recordedGeometry.push(geometry);
	} else if (kind === 'sessionMeta') {
		const parsed = parseSessionMetaJson(text);
		if (parsed) {
			tables.sessionMeta = parsed;
			tables.sessionMetaRaw = text;
		}
	} else tables.rawGazeData.push(...parseRawGazeDataCsv(text));
}

interface SessionIdentity {
	childId?: string;
	sessionId?: string;
	taskName?: string;
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

function finalizeSession(tables: SessionTables, identity: SessionIdentity): LoadedSession {
	const warnings: string[] = [];
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
	tables.i2mcFixationData = dedupeTable(tables.i2mcFixationData);
	tables.sessionScores = dedupeTable(tables.sessionScores);
	tables.rawGazeData = dedupeTable(tables.rawGazeData);
	if (removedDuplicates > 0) {
		warnings.push(
			`Odstraněno ${removedDuplicates} duplicitních řádků – vstup zřejmě obsahoval překrývající se soubory.`
		);
	}

	byTimestamp(tables.gazeSamples);
	byTimestamp(tables.fixationData);
	byTimestamp(tables.i2mcFixationData);
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

	return {
		childId: identity.childId ?? anyRow?.child_id ?? 'unknown',
		sessionId: identity.sessionId ?? anyRow?.session_id ?? 'unknown',
		taskName: identity.taskName ?? anyRow?.task_name ?? 'unknown',
		gazeSamples: tables.gazeSamples,
		fixationData: tables.fixationData,
		i2mcFixationData: tables.i2mcFixationData,
		sessionScores: tables.sessionScores,
		rawGazeData: tables.rawGazeData,
		recordedGeometry: tables.recordedGeometry.sort((a, b) => a.slideIndex - b.slideIndex),
		meta: tables.sessionMeta,
		metaRaw: tables.sessionMetaRaw,
		bridgeStamped: isBridgeStamped(tables.rawGazeData),
		warnings
	};
}

/**
 * Downloads and parses all table CSVs of a remote test session, including the
 * rawGazeData files the heatmap loader skips.
 */
export async function loadRemoteSession(
	remoteSessionId: string,
	childId?: string
): Promise<LoadedSession> {
	const detail = await getTestSessionDetail(remoteSessionId);

	const csvFiles = new Map<string, { fileId: string; kind: TableKind }>();
	const collect = (files: { id: string; fileName: string }[] | undefined) => {
		for (const file of files ?? []) {
			const kind = classifyFileName(file.fileName);
			if (kind && !csvFiles.has(file.id)) csvFiles.set(file.id, { fileId: file.id, kind });
		}
	};
	for (const part of detail.parts ?? []) collect(part.files);
	collect(detail.files);

	const tables = emptyTables();
	const downloads = await Promise.all(
		[...csvFiles.values()].map(async ({ fileId, kind }) => {
			const blob = await downloadTestSessionFile(remoteSessionId, fileId);
			return { kind, text: await blob.text() };
		})
	);
	for (const { kind, text } of downloads) parseInto(tables, kind, text);

	return finalizeSession(tables, {
		childId,
		sessionId: tables.rawGazeData[0]?.session_id ?? tables.gazeSamples[0]?.session_id,
		taskName: detail.testType ?? undefined
	});
}

/** Loads a session from an exported/downloaded ZIP (nested folders tolerated). */
export async function loadFromZip(data: Blob | ArrayBuffer | Uint8Array): Promise<LoadedSession> {
	const zip = await JSZip.loadAsync(data);
	const tables = emptyTables();

	for (const entry of Object.values(zip.files)) {
		if (entry.dir) continue;
		const baseName = entry.name.split('/').pop() ?? entry.name;
		const kind = classifyFileName(baseName);
		if (!kind) continue;
		parseInto(tables, kind, await entry.async('string'));
	}

	return finalizeSession(tables, {});
}

/** Loads a session from loose CSV files (and/or a single dropped ZIP). */
export async function loadFromFiles(files: NamedTextFile[]): Promise<LoadedSession> {
	const zipFile = files.find((file) => file.name.toLowerCase().endsWith('.zip'));
	if (zipFile && 'arrayBuffer' in zipFile) {
		return loadFromZip(await (zipFile as unknown as Blob).arrayBuffer());
	}

	const tables = emptyTables();
	for (const file of files) {
		const kind = classifyFileName(file.name);
		if (!kind) continue;
		parseInto(tables, kind, await file.text());
	}

	return finalizeSession(tables, {});
}
