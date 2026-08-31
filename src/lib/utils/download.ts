/**
 * Navigates to a URL that responds with Content-Disposition: attachment,
 * so the browser handles the download natively (progress in the downloads UI).
 */
export function triggerUrlDownload(url: string): void {
	const a = document.createElement('a');
	a.href = url;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}
