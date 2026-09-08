/* eslint-disable svelte/no-navigation-without-resolve -- URLs derive from page.url, which already carries the base path. */
import { goto } from '$app/navigation';
import { page } from '$app/state';

type UrlParams = Record<string, string | null>;

function withParams(params: UrlParams): URL {
	const url = new URL(page.url);
	for (const [key, value] of Object.entries(params)) {
		if (value) url.searchParams.set(key, value);
		else url.searchParams.delete(key);
	}
	return url;
}

/** Enters a nested view; the current entry stays behind it as the parent. */
export function pushParams(params: UrlParams) {
	return goto(withParams(params), { state: { parentInHistory: true } });
}

/** Moves between sibling views. */
export function switchParams(params: UrlParams) {
	return goto(withParams(params));
}

/** Leaves a nested view the way it was entered, or forward on a deep link. */
export function backToParams(params: UrlParams) {
	if (page.state.parentInHistory) history.back();
	else goto(withParams(params));
}

/** Removes params that no longer point at anything, without leaving a dead entry. */
export function dropParams(params: UrlParams) {
	if (page.state.parentInHistory) history.back();
	else goto(withParams(params), { replaceState: true });
}
