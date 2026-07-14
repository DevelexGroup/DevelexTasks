import { domToCanvas } from 'modern-screenshot';

/** Custom @font-face families from app.css used by task stimuli (zrakovka). */
const TASK_FONT_FAMILIES = [
	'Aptos',
	'BPG Nino Mtavruli',
	'Dotum',
	'Heavenezer',
	'Meine Regular',
	'Screws Regular',
	'Various Materials'
];

const SETTLE_TIMEOUT_MS = 4000;

let fontsLoaded: Promise<void> | null = null;

/**
 * Loads every custom task font once per session so the first capture doesn't race
 * lazy @font-face loading (fonts are otherwise only fetched when first painted).
 */
export function ensureTaskFontsLoaded(): Promise<void> {
	if (!fontsLoaded) {
		fontsLoaded = (async () => {
			await Promise.allSettled(
				TASK_FONT_FAMILIES.map((family) => document.fonts.load(`16px "${family}"`))
			);
			await document.fonts.ready;
		})();
	}
	return fontsLoaded;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | 'timeout'> {
	return Promise.race([
		promise,
		new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), ms))
	]);
}

function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export interface SettleResult {
	ok: boolean;
	/** Human-readable warnings (e.g. images that never decoded). */
	warnings: string[];
}

/**
 * Waits until the freshly mounted stimulus is fully painted: fonts ready, all <img>
 * elements decoded, running animations finished, plus two rAF ticks to flush layout.
 * Hard-capped so a stimulus with a permanently missing asset (ImageSymbolElement
 * retries with cache-busting URLs) degrades to a warning instead of hanging the run.
 */
export async function settleStimulus(node: HTMLElement): Promise<SettleResult> {
	const warnings: string[] = [];

	await ensureTaskFontsLoaded();

	const images = Array.from(node.querySelectorAll('img'));
	const decodeAll = Promise.allSettled(
		images.map((img) =>
			img.decode().catch(() => {
				warnings.push(`Image failed to decode: ${img.src.split('/').pop() ?? img.src}`);
			})
		)
	);
	if ((await withTimeout(decodeAll, SETTLE_TIMEOUT_MS)) === 'timeout') {
		warnings.push('Timed out waiting for images to decode');
	}

	const animations = node.getAnimations({ subtree: true });
	if (animations.length > 0) {
		const animationsDone = Promise.allSettled(animations.map((a) => a.finished));
		if ((await withTimeout(animationsDone, SETTLE_TIMEOUT_MS)) === 'timeout') {
			warnings.push('Timed out waiting for animations to finish');
		}
	}

	await nextFrame();
	await nextFrame();

	return { ok: warnings.length === 0, warnings };
}

/**
 * Rasterizes the stimulus container. Single point of coupling to modern-screenshot —
 * html-to-image's `toCanvas` is API-equivalent if a swap is ever needed.
 * Output dimensions = node CSS size × scale, independent of the display's DPR.
 */
export function captureToCanvas(node: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
	return domToCanvas(node, {
		scale,
		width: node.offsetWidth,
		height: node.offsetHeight,
		// Skip the preview chrome; capture exactly the simulated viewport contents.
		filter: (el) => !(el instanceof HTMLElement && el.dataset.screenshotExclude !== undefined)
	});
}

export type ExportFormat = 'png' | 'jpg';

export function formatMimeType(format: ExportFormat): string {
	return format === 'jpg' ? 'image/jpeg' : 'image/png';
}

/** Main-thread encode for single-stimulus downloads (bulk export encodes in a worker). */
export function canvasToBlob(
	canvas: HTMLCanvasElement,
	format: ExportFormat,
	quality: number
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		if (format === 'jpg') {
			// Flatten onto white so any transparency doesn't turn black in JPEG.
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.globalCompositeOperation = 'destination-over';
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
		}
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
			formatMimeType(format),
			format === 'jpg' ? quality : undefined
		);
	});
}

export function downloadBlob(blob: Blob, fileName: string): void {
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.setAttribute('href', url);
	link.setAttribute('download', fileName);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
