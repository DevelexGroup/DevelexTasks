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
import type { LoadedSession } from './types';

type TableKind =
	| 'gazeSamples'
	| 'fixationData'
	| 'i2mcFixationData'
	| 'sessionScores'
	| 'rawGazeData';

interface SessionTables {
	gazeSamples: GazeSampleDataEntry[];
	fixationData: FixationDataEntry[];
	i2mcFixationData: FixationDataEntry[];
	sessionScores: SessionScoreDataEntry[];
	rawGazeData: RawGazeDataEntry[];
}

/** Minimal file shape shared by DOM File and test fixtures. */
export interface NamedTextFile {
	name: string;
	text(): Promise<string>;
}

export function classifyFileName(fileName: string): TableKind | null {
	const lower = fileName.toLowerCase();
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
		rawGazeData: []
	};
}

function parseInto(tables: SessionTables, kind: TableKind, csvText: string): void {
	if (kind === 'gazeSamples') tables.gazeSamples.push(...parseGazeSamplesCsv(csvText));
	else if (kind === 'fixationData') tables.fixationData.push(...parseFixationDataCsv(csvText));
	else if (kind === 'i2mcFixationData')
		tables.i2mcFixationData.push(...parseFixationDataCsv(csvText));
	else if (kind === 'sessionScores') tables.sessionScores.push(...parseSessionScoresCsv(csvText));
	else tables.rawGazeData.push(...parseRawGazeDataCsv(csvText));
}

interface SessionIdentity {
	childId?: string;
	sessionId?: string;
	taskName?: string;
}

function finalizeSession(tables: SessionTables, identity: SessionIdentity): LoadedSession {
	const warnings: string[] = [];
	const byTimestamp = <T extends { timestamp: number }>(entries: T[]) =>
		entries.sort((a, b) => a.timestamp - b.timestamp);

	byTimestamp(tables.gazeSamples);
	byTimestamp(tables.fixationData);
	byTimestamp(tables.i2mcFixationData);
	byTimestamp(tables.rawGazeData);

	const anyRow = tables.rawGazeData[0] ?? tables.gazeSamples[0] ?? tables.fixationData[0];
	if (tables.gazeSamples.length === 0)
		warnings.push('Chybí gazeSamples data – bez event markerů nelze určit časová okna slidů.');
	if (tables.rawGazeData.length === 0)
		warnings.push('Chybí rawGazeData – fixace není z čeho přepočítat.');

	const maxSlides =
		tables.gazeSamples.length > 0
			? Math.max(...tables.gazeSamples.map((row) => row.slide_index))
			: (anyRow?.slide_index ?? 0);

	return {
		childId: identity.childId ?? anyRow?.child_id ?? 'unknown',
		sessionId: identity.sessionId ?? anyRow?.session_id ?? 'unknown',
		taskName: identity.taskName ?? anyRow?.task_name ?? 'unknown',
		gazeSamples: tables.gazeSamples,
		fixationData: tables.fixationData,
		i2mcFixationData: tables.i2mcFixationData,
		sessionScores: tables.sessionScores,
		rawGazeData: tables.rawGazeData,
		maxSlides,
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
	for (const { fileId, kind } of csvFiles.values()) {
		const blob = await downloadTestSessionFile(remoteSessionId, fileId);
		parseInto(tables, kind, await blob.text());
	}

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
