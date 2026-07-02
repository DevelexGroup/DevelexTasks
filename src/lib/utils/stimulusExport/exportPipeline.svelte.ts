import type { ExportableLevel, ExportStimulus } from './registry';
import { sanitizeFileName } from './registry';
import { captureToCanvas, type ExportFormat } from './capture';

declare global {
	interface Window {
		showDirectoryPicker?: (options?: {
			mode?: 'read' | 'readwrite';
		}) => Promise<FileSystemDirectoryHandle>;
	}
}

export function supportsDirectoryExport(): boolean {
	return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export interface ExportSettings {
	width: number;
	height: number;
	scale: number;
	format: ExportFormat;
	quality: number;
	answerOverlay: boolean;
}

export interface ExportJobItem {
	level: ExportableLevel;
	stimulus: ExportStimulus;
}

export interface RenderResult {
	node: HTMLElement;
	warnings: string[];
}

/** Mounts the stimulus in the on-page stage, waits until fully painted, returns the capture node. */
export type StimulusRenderer = (
	level: ExportableLevel,
	stimulus: ExportStimulus,
	highlightTargets: boolean
) => Promise<RenderResult>;

export interface ExportFileStatus {
	path: string;
	status: 'ok' | 'warning' | 'error';
	detail?: string;
}

const MAX_IN_FLIGHT = 2;
const RECENT_LIMIT = 200;
const ETA_WINDOW = 20;

export class StimulusExportPipeline {
	running = $state(false);
	cancelled = $state(false);
	total = $state(0);
	completed = $state(0);
	failed = $state(0);
	warned = $state(0);
	currentPath = $state<string | null>(null);
	etaMs = $state<number | null>(null);
	recent = $state<ExportFileStatus[]>([]);
	errors = $state<ExportFileStatus[]>([]);
	finished = $state(false);

	private worker: Worker | null = null;
	private aborted = false;
	private inFlight = 0;
	private waiters: (() => void)[] = [];
	/** Settle warnings for files still in the worker, keyed by relPath. */
	private pendingWarnings = new Map<string, string[]>();
	private completionTimestamps: number[] = [];
	private manifestResults: ExportFileStatus[] = [];

	cancel(): void {
		this.aborted = true;
		this.cancelled = true;
	}

	async run(
		items: ExportJobItem[],
		settings: ExportSettings,
		render: StimulusRenderer
	): Promise<void> {
		if (this.running) throw new Error('Export already running');
		if (!supportsDirectoryExport()) {
			throw new Error('File System Access API is not available in this browser');
		}

		const overlayCount = settings.answerOverlay
			? items.filter((item) => item.level.supportsAnswerOverlay).length
			: 0;

		// Reset display state before the picker so a reopened progress dialog
		// doesn't briefly show the previous run's results.
		this.running = true;
		this.finished = false;
		this.cancelled = false;
		this.aborted = false;
		this.total = items.length + overlayCount;
		this.completed = 0;
		this.failed = 0;
		this.warned = 0;
		this.currentPath = null;
		this.etaMs = null;
		this.recent = [];
		this.errors = [];
		this.completionTimestamps = [performance.now()];
		this.manifestResults = [];
		this.pendingWarnings.clear();

		// Prompt before any real work so a denied/cancelled picker aborts cleanly.
		let dirHandle: FileSystemDirectoryHandle;
		try {
			dirHandle = await window.showDirectoryPicker!({ mode: 'readwrite' });
		} catch (error) {
			this.running = false;
			throw error;
		}

		const ext = settings.format;
		this.worker = new Worker(new URL('./encoderWorker.ts', import.meta.url), { type: 'module' });
		this.worker.onmessage = (e: MessageEvent) => this.onWorkerMessage(e);
		this.worker.postMessage({
			type: 'init',
			dirHandle,
			format: settings.format,
			quality: settings.quality
		});

		try {
			for (const { level, stimulus } of items) {
				if (this.aborted) break;

				const baseName = sanitizeFileName(stimulus.id);
				const dir = `${sanitizeFileName(level.taskSlug)}/${sanitizeFileName(level.levelId)}`;

				await this.captureOne(
					() => render(level, stimulus, false),
					`${dir}/${baseName}.${ext}`,
					settings.scale
				);

				if (this.aborted) break;

				if (settings.answerOverlay && level.supportsAnswerOverlay) {
					await this.captureOne(
						() => render(level, stimulus, true),
						`${dir}/${baseName}_answers.${ext}`,
						settings.scale
					);
				}
			}

			await this.drain();

			if (!this.aborted) {
				this.currentPath = 'manifest.json';
				const manifest = {
					exportedAt: new Date().toISOString(),
					settings,
					fileCount: this.completed,
					failedCount: this.failed,
					results: this.manifestResults
				};
				this.inFlight++;
				this.worker.postMessage({
					type: 'writeText',
					relPath: 'manifest.json',
					text: JSON.stringify(manifest, null, '\t')
				});
				await this.drain();
			}
		} finally {
			this.worker.terminate();
			this.worker = null;
			this.running = false;
			this.finished = true;
			this.currentPath = null;
		}
	}

	private async captureOne(
		renderFn: () => Promise<RenderResult>,
		relPath: string,
		scale: number
	): Promise<void> {
		await this.waitForSlot();
		if (this.aborted) return;

		this.currentPath = relPath;
		try {
			const { node, warnings } = await renderFn();
			const canvas = await captureToCanvas(node, scale);
			const bitmap = await createImageBitmap(canvas);
			// Release the ~(W*scale × H*scale × 4B) backing store immediately instead of
			// waiting for GC — RSS otherwise grows by roughly a frame per capture.
			canvas.width = 0;
			canvas.height = 0;
			this.pendingWarnings.set(relPath, warnings);
			this.inFlight++;
			this.worker!.postMessage({ type: 'encode', bitmap, relPath }, [bitmap]);
		} catch (error) {
			// Render/capture failure: the frame never reached the worker.
			this.recordResult({
				path: relPath,
				status: 'error',
				detail: error instanceof Error ? error.message : String(error)
			});
		}
	}

	private onWorkerMessage(e: MessageEvent): void {
		const { type, relPath, ok, error } = e.data;
		if (type !== 'done') return;

		this.inFlight--;

		if (relPath !== 'manifest.json') {
			const warnings = this.pendingWarnings.get(relPath) ?? [];
			this.pendingWarnings.delete(relPath);
			if (!ok) {
				this.recordResult({ path: relPath, status: 'error', detail: error });
			} else if (warnings.length > 0) {
				this.recordResult({ path: relPath, status: 'warning', detail: warnings.join('; ') });
			} else {
				this.recordResult({ path: relPath, status: 'ok' });
			}
		}

		const waiter = this.waiters.shift();
		waiter?.();
	}

	private recordResult(result: ExportFileStatus): void {
		if (result.status === 'error') {
			this.failed++;
			this.errors = [...this.errors, result];
		} else {
			this.completed++;
			if (result.status === 'warning') this.warned++;
		}
		this.manifestResults.push(result);

		this.recent = [...this.recent.slice(-(RECENT_LIMIT - 1)), result];

		const now = performance.now();
		this.completionTimestamps.push(now);
		if (this.completionTimestamps.length > ETA_WINDOW) this.completionTimestamps.shift();
		if (this.completionTimestamps.length >= 2) {
			const spanMs = now - this.completionTimestamps[0];
			const avgMs = spanMs / (this.completionTimestamps.length - 1);
			const remaining = this.total - this.completed - this.failed;
			this.etaMs = Math.max(0, remaining * avgMs);
		}
	}

	private waitForSlot(): Promise<void> {
		if (this.inFlight < MAX_IN_FLIGHT) return Promise.resolve();
		return new Promise<void>((resolve) => this.waiters.push(resolve)).then(() =>
			this.waitForSlot()
		);
	}

	private drain(): Promise<void> {
		if (this.inFlight === 0) return Promise.resolve();
		return new Promise<void>((resolve) => this.waiters.push(resolve)).then(() => this.drain());
	}
}
