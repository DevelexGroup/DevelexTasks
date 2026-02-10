import { db } from '$lib/database/db';
import type {
	GazeSampleDataEntry,
	FixationDataEntry,
	SessionScoreDataEntry
} from '$lib/database/db.types';
import JSZip from 'jszip';

export type ExportMode = 'all' | 'child' | 'session';
export type TableName = 'gazeSamples' | 'fixationData' | 'sessionScores';
export type DataEntry = GazeSampleDataEntry | FixationDataEntry | SessionScoreDataEntry;

export interface ExportOptions {
	mode: ExportMode;
	childId?: string;
	sessionId?: string;
	slideIndex?: number;
}

export interface SessionInfo {
	sessionId: string;
	taskName: string;
}

export class DatabaseExporter {
	/**
	 * Format a Unix timestamp to various string formats
	 */
	static formatTimestamp(
		unixTimestamp: number,
		format: 'full' | 'simple' | 'filename' = 'full'
	): string {
		const date = new Date(Math.floor(unixTimestamp));
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		if (format === 'filename') {
			return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
		}

		if (format === 'simple') {
			return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
		}

		const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
		const microseconds = String(Math.floor((unixTimestamp % 1) * 1000)).padStart(3, '0');
		return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}${microseconds}`;
	}

	/**
	 * Get all unique child IDs from all tables
	 */
	static async getChildIds(): Promise<string[]> {
		const [gazeChildIds, fixationChildIds, sessionChildIds] = await Promise.all([
			db.gazeSamples.orderBy('child_id').uniqueKeys() as Promise<string[]>,
			db.fixationData.orderBy('child_id').uniqueKeys() as Promise<string[]>,
			db.sessionScores.orderBy('child_id').uniqueKeys() as Promise<string[]>
		]);

		const allChildIds = new Set([...gazeChildIds, ...fixationChildIds, ...sessionChildIds]);
		return Array.from(allChildIds).sort();
	}

	/**
	 * Get session IDs for a specific child
	 */
	static async getSessionIds(childId: string): Promise<SessionInfo[]> {
		if (!childId) return [];

		const filtered = await db.gazeSamples.where('child_id').equals(childId).toArray();

		const sessionMap = new Map<string, string>();
		for (const entry of filtered) {
			if (!sessionMap.has(entry.session_id)) {
				sessionMap.set(entry.session_id, entry.task_name);
			}
		}

		return Array.from(sessionMap.entries())
			.map(([sessionId, taskName]) => ({ sessionId, taskName }))
			.sort((a, b) => -a.sessionId.localeCompare(b.sessionId));
	}

	/**
	 * Get CSV headers for a specific table
	 */
	static getExportHeadersForTable(table: TableName): string[] {
		if (table === 'gazeSamples') {
			return [
				'ID',
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
		} else if (table === 'fixationData') {
			return [
				'ID',
				'Child ID',
				'Session ID',
				'Task',
				'Slide Index',
				'Stimulus ID',
				'Timestamp',
				'Eye X',
				'Eye Y',
				'Duration',
				'AOI',
				'Fixation Index'
			];
		} else {
			return [
				'ID',
				'Child ID',
				'Session ID',
				'Task',
				'Slide Index',
				'Stimulus ID',
				'Timestamp',
				'Fluency Score',
				'Error Rate',
				'Response Time',
				'Mean Fixation Duration',
				'Fixation Count',
				'AOI Target Fixations',
				'AOI Field Fixations',
				'Regression Count'
			];
		}
	}

	/**
	 * Format a column value for CSV export
	 */
	static formatExportedColumnValue(column: string, value: unknown): string {
		if (value === null || value === undefined) return '';
		if (column == 'Timestamp' || column == 'Session ID') {
			const timestampNum = typeof value === 'number' ? value : parseFloat(String(value));
			return this.formatTimestamp(timestampNum, column == 'Timestamp' ? 'full' : 'simple');
		}
		if (Array.isArray(value)) return value.length > 0 ? value.join('|') : '';
		return String(value);
	}

	/**
	 * Get a cell value from an entry based on table type and column index
	 */
	static getCellValueForTable(entry: DataEntry, index: number, table: TableName): unknown {
		if (table === 'gazeSamples') {
			const data = entry as GazeSampleDataEntry;
			const values = [
				data.id,
				data.child_id,
				data.session_id,
				data.task_name,
				data.slide_index,
				data.stimulus_id,
				data.timestamp,
				data.eyetracker_x,
				data.eyetracker_y,
				data.aoi,
				data.mouse_x,
				data.mouse_y,
				data.events,
				data.sound_name,
				data.mistake_type,
				data.task_result
			];
			return values[index];
		} else if (table === 'fixationData') {
			const data = entry as FixationDataEntry;
			const values = [
				data.id,
				data.child_id,
				data.session_id,
				data.task_name,
				data.slide_index,
				data.stimulus_id,
				data.timestamp,
				data.eyetracker_x,
				data.eyetracker_y,
				data.duration,
				data.aoi,
				data.fixation_index
			];
			return values[index];
		} else {
			const data = entry as SessionScoreDataEntry;
			const values = [
				data.id,
				data.child_id,
				data.session_id,
				data.task_name,
				data.slide_index,
				data.stimulus_id,
				data.timestamp,
				data.fluency_score,
				data.error_rate,
				data.response_time,
				data.mean_fix_dur,
				data.fix_count,
				data.aoi_target_fix,
				data.aoi_field_fix,
				data.regression_count
			];
			return values[index];
		}
	}

	/**
	 * Create CSV content from data entries
	 */
	static createCsvContent(entries: DataEntry[], tableName: TableName): string {
		const headers = this.getExportHeadersForTable(tableName);
		const csvRows = [headers.join(',')];

		const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
		sortedEntries.forEach((entry) => {
			const row = headers.map((column, index) => {
				const value = this.getCellValueForTable(entry, index, tableName);
				const formatted = this.formatExportedColumnValue(column, value);
				return formatted.includes(',') ? `"${formatted.replace(/"/g, '""')}"` : formatted;
			});
			csvRows.push(row.join(','));
		});

		return csvRows.join('\n');
	}

	/**
	 * Generate export filename based on export options
	 */
	static generateFilename(options: ExportOptions, sessionInfos?: SessionInfo[]): string {
		const timestamp = this.formatTimestamp(Date.now(), 'filename');
		const slideIndexSuffix = options.slideIndex !== undefined ? `_slide${options.slideIndex}` : '';

		if (options.mode === 'all') {
			return `database_export_${timestamp}${slideIndexSuffix}.zip`;
		} else if (options.mode === 'child') {
			return `export_${options.childId}_${timestamp}${slideIndexSuffix}.zip`;
		} else {
			const sessionInfo = sessionInfos?.find((s) => s.sessionId === options.sessionId);
			const taskName = sessionInfo?.taskName || 'unknown';
			const formattedSessionId = this.formatTimestamp(parseFloat(options.sessionId!), 'filename');
			return `export_${options.childId}_${taskName}_${formattedSessionId}${slideIndexSuffix}.zip`;
		}
	}

	/**
	 * Check if export can proceed based on options
	 */
	static canExport(options: ExportOptions): boolean {
		if (options.mode === 'all') return true;
		if (options.mode === 'child') return !!options.childId;
		if (options.mode === 'session') return !!options.childId && !!options.sessionId;
		return false;
	}

	/**
	 * Export data to a ZIP blob based on export options
	 */
	static async exportToZip(options: ExportOptions): Promise<Blob> {
		const zip = new JSZip();
		const tables: TableName[] = ['gazeSamples', 'fixationData', 'sessionScores'];

		const filterBySlideIndex = (data: DataEntry[]): DataEntry[] => {
			if (options.slideIndex === undefined) return data;
			return data.filter((entry) => entry.slide_index === options.slideIndex);
		};

		if (options.mode === 'all') {
			// Export all: root -> childIds -> sessions -> tables.csv
			for (const tableName of tables) {
				const allData = filterBySlideIndex(await db[tableName].toArray());

				// Group by child_id, then by session_id
				const byChild = new Map<string, Map<string, DataEntry[]>>();

				allData.forEach((entry) => {
					if (!byChild.has(entry.child_id)) {
						byChild.set(entry.child_id, new Map());
					}
					const childMap = byChild.get(entry.child_id)!;
					if (!childMap.has(entry.session_id)) {
						childMap.set(entry.session_id, []);
					}
					childMap.get(entry.session_id)!.push(entry);
				});

				for (const [childId, sessions] of byChild) {
					for (const [sessionId, entries] of sessions) {
						const taskName = entries[0]?.task_name || 'unknown';
						const formattedSessionId = this.formatTimestamp(parseFloat(sessionId), 'filename');
						const folderPath = `${childId}/${formattedSessionId}_${taskName}`;
						const csvContent = this.createCsvContent(entries, tableName);
						zip.file(`${folderPath}/${tableName}.csv`, csvContent);
					}
				}
			}
		} else if (options.mode === 'child') {
			// Export child: root -> sessions -> tables.csv
			for (const tableName of tables) {
				const allData = filterBySlideIndex(
					await db[tableName].where('child_id').equals(options.childId!).toArray()
				);

				// Group by session_id
				const bySession = new Map<string, DataEntry[]>();

				allData.forEach((entry) => {
					if (!bySession.has(entry.session_id)) {
						bySession.set(entry.session_id, []);
					}
					bySession.get(entry.session_id)!.push(entry);
				});

				for (const [sessionId, entries] of bySession) {
					const taskName = entries[0]?.task_name || 'unknown';
					const formattedSessionId = this.formatTimestamp(parseFloat(sessionId), 'filename');
					const folderPath = `${formattedSessionId}_${taskName}`;
					const csvContent = this.createCsvContent(entries, tableName);
					zip.file(`${folderPath}/${tableName}.csv`, csvContent);
				}
			}
		} else {
			// Export session: root -> tables.csv
			for (const tableName of tables) {
				const allData = filterBySlideIndex(
					await db[tableName]
						.where('[child_id+session_id]')
						.equals([options.childId!, options.sessionId!])
						.toArray()
				);

				if (allData.length > 0) {
					const csvContent = this.createCsvContent(allData, tableName);
					zip.file(`${tableName}.csv`, csvContent);
				}
			}
		}

		return await zip.generateAsync({ type: 'blob' });
	}

	/**
	 * Export data to a ZIP File object based on export options
	 */
	static async exportToZipFile(options: ExportOptions): Promise<File> {
		if (!this.canExport(options)) {
			throw new Error('Invalid export options');
		}

		const sessionInfos = options.sessionId ? await this.getSessionIds(options.childId!) : undefined;
		const blob = await this.exportToZip(options);
		const filename = this.generateFilename(options, sessionInfos);

		return new File([blob], filename, { type: 'application/zip' });
	}

	/**
	 * Export data to individual CSV File objects based on export options.
	 * Returns an array of File objects, one for each table with data.
	 */
	static async exportToFiles(options: ExportOptions): Promise<File[]> {
		if (!this.canExport(options)) {
			throw new Error('Invalid export options');
		}

		const tables: TableName[] = ['gazeSamples', 'fixationData', 'sessionScores'];
		const files: File[] = [];

		const filterBySlideIndex = (data: DataEntry[]): DataEntry[] => {
			if (options.slideIndex === undefined) return data;
			return data.filter((entry) => entry.slide_index === options.slideIndex);
		};

		for (const tableName of tables) {
			let data: DataEntry[];

			if (options.mode === 'all') {
				data = filterBySlideIndex(await db[tableName].toArray());
			} else if (options.mode === 'child') {
				data = filterBySlideIndex(
					await db[tableName].where('child_id').equals(options.childId!).toArray()
				);
			} else {
				data = filterBySlideIndex(
					await db[tableName]
						.where('[child_id+session_id]')
						.equals([options.childId!, options.sessionId!])
						.toArray()
				);
			}

			if (data.length > 0) {
				const csvContent = this.createCsvContent(data, tableName);
				const blob = new Blob([csvContent], { type: 'text/csv' });
				const slideIndexSuffix =
					options.slideIndex !== undefined ? `_slide${options.slideIndex}` : '';
				files.push(new File([blob], `${tableName}${slideIndexSuffix}.csv`, { type: 'text/csv' }));
			}
		}

		return files;
	}

	/**
	 * Export and download the data as a ZIP file
	 */
	static async exportAndDownload(options: ExportOptions): Promise<void> {
		const file = await this.exportToZipFile(options);

		const link = document.createElement('a');
		const url = URL.createObjectURL(file);
		link.setAttribute('href', url);
		link.setAttribute('download', file.name);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
}

