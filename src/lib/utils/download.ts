type SaveFilePickerFn = (options?: {
	suggestedName?: string;
	types?: { description?: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable(): Promise<WritableStream<Uint8Array>> }>;

export function triggerBlobDownload(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Streams a ZIP response straight to disk via the save dialog when the browser
 * supports it, otherwise buffers it as a blob download.
 * Returns false when the user cancels the save dialog.
 */
export async function saveZipStream(
	getResponse: () => Promise<Response>,
	suggestedName: string
): Promise<boolean> {
	const picker = (window as unknown as { showSaveFilePicker?: SaveFilePickerFn })
		.showSaveFilePicker;

	if (picker) {
		let writable: WritableStream<Uint8Array>;
		try {
			const handle = await picker({
				suggestedName,
				types: [{ description: 'ZIP archiv', accept: { 'application/zip': ['.zip'] } }]
			});
			writable = await handle.createWritable();
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return false;
			throw err;
		}

		try {
			const response = await getResponse();
			if (!response.body) throw new Error('Empty response body');
			await response.body.pipeTo(writable);
		} catch (err) {
			await writable.abort().catch(() => {});
			throw err;
		}
		return true;
	}

	const response = await getResponse();
	triggerBlobDownload(await response.blob(), suggestedName);
	return true;
}
