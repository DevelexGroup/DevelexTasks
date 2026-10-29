import JSZip from 'jszip';
import type { PostProcessor } from '$lib/api/test-sessions';
import { DatabaseExporter, type TableName } from '$lib/utils/databaseExport';
import {
	serializeOutputCsv,
	slideOfOutputFile,
	type ProcessorOutputFile
} from '$lib/utils/postProcessing/outputs';
import { sessionFolderStamp } from './loaders';
import type {
	AoiAttributionStrategy,
	DetectorParams,
	LoadedSession,
	ReplayResult,
	SpatialCorrection
} from './types';

export interface CorrectedExportMeta {
	session: LoadedSession;
	viewport: { width: number; height: number };
	sessionCorrection: SpatialCorrection;
	slideOverrides: Record<number, SpatialCorrection>;
	detectorParams: DetectorParams;
	aoiAttribution: AoiAttributionStrategy;
	dropUnfinishedFinalFixation: boolean;
	countFixationsOpenAtWindowEnd: boolean;
	gapResetMs: number;
	dropColdStartFixation: boolean;
	rebaseRawTimestamps: boolean;
	synthesizeDwellArrow: boolean;
	synthesizeDwellEye: boolean;
}

/** `name` is the path inside the ZIP. */
export interface CorrectedFile {
	name: string;
	content: string;
}

/** One processor's output as exported; files keep their original names. */
export interface ExportedProcessorOutput {
	processor: PostProcessor;
	files: ProcessorOutputFile[];
	source: 'stored' | 'rerun';
	/** Positions were moved to the export's correction. */
	shifted: boolean;
	/** The correction differs but the output declares no columns to move. */
	stale: boolean;
	/** Parameters of the re-run; null for stored output. */
	parameters: Record<string, unknown> | null;
}

export interface ExportedSession {
	result: ReplayResult;
	meta: CorrectedExportMeta;
	outputs?: ExportedProcessorOutput[];
}

export const CORRECTIONS_FILE_NAME = 'corrections.json';

type PartTable = Extract<
	TableName,
	'gazeSamples' | 'fixationData' | 'sessionScores' | 'rawGazeData'
>;

function splitBySlide<T extends { slide_index: number }>(rows: T[]): Map<number, T[]> {
	const bySlide = new Map<number, T[]>();
	for (const row of rows) {
		const slideRows = bySlide.get(row.slide_index) ?? [];
		slideRows.push(row);
		bySlide.set(row.slide_index, slideRows);
	}
	return bySlide;
}

/**
 * One session's corrected files laid out exactly like the server export
 * (`meta/…`, `part_N/<table>_slideN.csv`), relative to the session folder.
 * Names match the originals so any consumer reads the ZIP as-is; the applied
 * adjustments stay reproducible through meta/corrections.json.
 */
export function buildCorrectedFiles(
	result: ReplayResult,
	meta: CorrectedExportMeta,
	outputs: ExportedProcessorOutput[] = []
): CorrectedFile[] {
	const files: CorrectedFile[] = [];

	if (meta.session.metaRaw) files.push({ name: 'meta/meta.json', content: meta.session.metaRaw });
	// Carried over unchanged so the exported ZIP round-trips with real geometry
	for (const geometry of meta.session.recordedGeometry) {
		files.push({
			name: `part_${geometry.slideIndex}/aoiGeometry_slide${geometry.slideIndex}.json`,
			content: JSON.stringify(geometry, null, '\t')
		});
	}

	const tables: [PartTable, { slide_index: number }[]][] = [
		['gazeSamples', result.gazeSamples],
		['fixationData', result.fixations],
		['sessionScores', result.sessionScores],
		['rawGazeData', result.rawGazeData]
	];
	for (const [table, rows] of tables) {
		const bySlide = [...splitBySlide(rows)].sort(([a], [b]) => a - b);
		for (const [slide, slideRows] of bySlide) {
			files.push({
				name: `part_${slide}/${table}_slide${slide}.csv`,
				content: DatabaseExporter.createCsvContent(
					slideRows as Parameters<typeof DatabaseExporter.createCsvContent>[0],
					table
				)
			});
		}
	}

	for (const output of outputs) {
		for (const file of output.files) {
			const slide = slideOfOutputFile(file, output.processor.output);
			files.push({
				name: `${slide === null ? 'meta' : `part_${slide}`}/${file.fileName}`,
				content: serializeOutputCsv(file)
			});
		}
	}

	files.push({
		name: `meta/${CORRECTIONS_FILE_NAME}`,
		content: JSON.stringify(
			{
				source: {
					childId: meta.session.childId,
					sessionId: meta.session.sessionId,
					taskName: meta.session.taskName
				},
				viewport: meta.viewport,
				sessionCorrection: meta.sessionCorrection,
				slideOverrides: meta.slideOverrides,
				detectorParams: meta.detectorParams,
				aoiAttribution: meta.aoiAttribution,
				dropUnfinishedFinalFixation: meta.dropUnfinishedFinalFixation,
				countFixationsOpenAtWindowEnd: meta.countFixationsOpenAtWindowEnd,
				gapResetMs: meta.gapResetMs,
				dropColdStartFixation: meta.dropColdStartFixation,
				rebaseRawTimestamps: meta.rebaseRawTimestamps,
				synthesizeDwellArrow: meta.synthesizeDwellArrow,
				synthesizeDwellEye: meta.synthesizeDwellEye,
				postProcessing: Object.fromEntries(
					outputs.map((output) => [
						output.processor.name,
						{
							source: output.source,
							shifted: output.shifted,
							stale: output.stale,
							notCorrected: output.shifted ? (output.processor.output?.spatialMetrics ?? []) : [],
							parameters: output.parameters
						}
					])
				),
				warnings: result.warnings,
				exportedAt: new Date().toISOString()
			},
			null,
			'\t'
		)
	});

	return files;
}

/**
 * All sessions under `<username>/<session>/…`; a repeated session folder gets
 * a numeric suffix, as the server export does.
 */
export function buildUnifiedExportFiles(sessions: ExportedSession[]): CorrectedFile[] {
	const usedFolders = new Set<string>();
	const files: CorrectedFile[] = [];
	for (const { result, meta, outputs } of sessions) {
		const base = meta.session.exportFolder;
		let folder = base;
		for (let counter = 2; usedFolders.has(folder); counter++) folder = `${base}_${counter}`;
		usedFolders.add(folder);
		for (const file of buildCorrectedFiles(result, meta, outputs)) {
			files.push({ name: `${folder}/${file.name}`, content: file.content });
		}
	}
	return files;
}

export function correctedZipName(sessions: LoadedSession[]): string {
	if (sessions.length === 1) {
		const session = sessions[0];
		const sessionMs = parseFloat(session.sessionId);
		const stamp = Number.isFinite(sessionMs)
			? DatabaseExporter.formatTimestamp(sessionMs, 'filename')
			: session.sessionId;
		return `session-sim_${session.childId}_${session.taskName}_${stamp}_corrected.zip`;
	}
	return `session-sim_export_${sessionFolderStamp(new Date())}_corrected.zip`;
}

export async function buildCorrectedZip(sessions: ExportedSession[]): Promise<Blob> {
	const zip = new JSZip();
	for (const file of buildUnifiedExportFiles(sessions)) {
		zip.file(file.name, file.content);
	}
	return zip.generateAsync({ type: 'blob' });
}
