/**
 * Dedicated Web Worker for the stimulus-export pipeline: encodes rasterized frames
 * to PNG/JPG and streams them straight to disk via a File System Access directory
 * handle, so bulk exports never accumulate blobs in memory. Runs concurrently with
 * the main thread rendering the next stimulus.
 *
 * Protocol:
 *   Main → Worker:  { type: 'init', dirHandle: FileSystemDirectoryHandle, format: 'png'|'jpg', quality: number }
 *   Main → Worker:  { type: 'encode', bitmap: ImageBitmap, relPath: string }   (bitmap transferred)
 *   Main → Worker:  { type: 'writeText', relPath: string, text: string }
 *   Worker → Main:  { type: 'done', relPath: string, ok: boolean, error?: string }
 */

let rootDir: FileSystemDirectoryHandle | null = null;
let mimeType = 'image/png';
let isJpeg = false;
let quality = 0.9;

const dirCache = new Map<string, FileSystemDirectoryHandle>();

async function resolveDirectory(segments: string[]): Promise<FileSystemDirectoryHandle> {
	if (!rootDir) throw new Error('Worker not initialized with a directory handle');
	let dir = rootDir;
	let cacheKey = '';
	for (const segment of segments) {
		cacheKey = cacheKey ? `${cacheKey}/${segment}` : segment;
		const cached = dirCache.get(cacheKey);
		if (cached) {
			dir = cached;
		} else {
			dir = await dir.getDirectoryHandle(segment, { create: true });
			dirCache.set(cacheKey, dir);
		}
	}
	return dir;
}

async function writeFile(relPath: string, data: Blob | string): Promise<void> {
	const segments = relPath.split('/');
	const fileName = segments.pop();
	if (!fileName) throw new Error(`Invalid relative path: ${relPath}`);
	const dir = await resolveDirectory(segments);
	const fileHandle = await dir.getFileHandle(fileName, { create: true });
	const writable = await fileHandle.createWritable();
	try {
		await writable.write(data);
		await writable.close();
	} catch (error) {
		await writable.abort().catch(() => {});
		throw error;
	}
}

async function encodeAndWrite(bitmap: ImageBitmap, relPath: string): Promise<void> {
	const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		bitmap.close();
		throw new Error('Failed to get OffscreenCanvas 2d context');
	}
	if (isJpeg) {
		// Flatten onto white so any transparency doesn't turn black in JPEG.
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();

	const blob = await canvas.convertToBlob(
		isJpeg ? { type: mimeType, quality } : { type: mimeType }
	);
	// Release the canvas backing store immediately instead of waiting for GC.
	canvas.width = 0;
	canvas.height = 0;
	await writeFile(relPath, blob);
}

self.onmessage = async (e: MessageEvent) => {
	const { type } = e.data;

	if (type === 'init') {
		rootDir = e.data.dirHandle;
		isJpeg = e.data.format === 'jpg';
		mimeType = isJpeg ? 'image/jpeg' : 'image/png';
		quality = e.data.quality;
		dirCache.clear();
		return;
	}

	if (type === 'encode' || type === 'writeText') {
		const relPath: string = e.data.relPath;
		try {
			if (type === 'encode') {
				await encodeAndWrite(e.data.bitmap, relPath);
			} else {
				await writeFile(relPath, e.data.text);
			}
			postMessage({ type: 'done', relPath, ok: true });
		} catch (error) {
			postMessage({
				type: 'done',
				relPath,
				ok: false,
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}
};
