import JSZip from 'jszip';
import { DatabaseExporter } from '$lib/utils/databaseExport';
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

export interface CorrectedFile {
	name: string;
	content: string;
}

/**
 * Corrected CSVs in the exact DatabaseExporter format, plus a provenance
 * corrections.json so the applied adjustments stay reproducible. File names
 * keep the table substrings so the file-drop loader can re-import them, and
 * carry a _corrected marker so they are never confused with originals.
 */
export function buildCorrectedFiles(
	result: ReplayResult,
	meta: CorrectedExportMeta
): CorrectedFile[] {
	// Carried over unchanged so the exported ZIP round-trips with real geometry and meta
	const passthroughFiles: CorrectedFile[] = meta.session.recordedGeometry.map((geometry) => ({
		name: `aoiGeometry_slide${geometry.slideIndex}.json`,
		content: JSON.stringify(geometry, null, '\t')
	}));
	if (meta.session.metaRaw) {
		passthroughFiles.push({ name: 'meta.json', content: meta.session.metaRaw });
	}
	return [
		...passthroughFiles,
		{
			name: 'gazeSamples_corrected.csv',
			content: DatabaseExporter.createCsvContent([...result.gazeSamples], 'gazeSamples')
		},
		{
			name: 'fixationData_corrected.csv',
			content: DatabaseExporter.createCsvContent([...result.fixations], 'fixationData')
		},
		{
			name: 'sessionScores_corrected.csv',
			content: DatabaseExporter.createCsvContent([...result.sessionScores], 'sessionScores')
		},
		{
			name: 'rawGazeData_corrected.csv',
			content: DatabaseExporter.createCsvContent([...result.rawGazeData], 'rawGazeData')
		},
		{
			name: 'corrections.json',
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
					warnings: result.warnings,
					exportedAt: new Date().toISOString()
				},
				null,
				'\t'
			)
		}
	];
}

export function correctedZipName(session: LoadedSession): string {
	const sessionMs = parseFloat(session.sessionId);
	const stamp = Number.isFinite(sessionMs)
		? DatabaseExporter.formatTimestamp(sessionMs, 'filename')
		: session.sessionId;
	return `session-sim_${session.childId}_${session.taskName}_${stamp}_corrected.zip`;
}

export async function buildCorrectedZip(
	result: ReplayResult,
	meta: CorrectedExportMeta
): Promise<Blob> {
	const zip = new JSZip();
	for (const file of buildCorrectedFiles(result, meta)) {
		zip.file(file.name, file.content);
	}
	return zip.generateAsync({ type: 'blob' });
}
