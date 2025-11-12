export function untilAbort<T>(p: Promise<T>, signal?: AbortSignal): Promise<T> {
	if (!signal) return p;
	if (signal.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));

	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
		signal.addEventListener('abort', onAbort, { once: true });

		p.then(
			v => {
				signal.removeEventListener('abort', onAbort);
				resolve(v);
			},
			e => {
				signal.removeEventListener('abort', onAbort);
				reject(e);
			}
		);
	});
}