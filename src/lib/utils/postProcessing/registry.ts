import { getPostProcessors, type PostProcessor } from '$lib/api/test-sessions';

let cached: Promise<PostProcessor[]> | null = null;

/** Backends older than the output/prefill fields omit them. */
function normalize(processor: PostProcessor): PostProcessor {
	return {
		...processor,
		auxiliaryInputFilePrefixes: processor.auxiliaryInputFilePrefixes ?? [],
		output: processor.output ?? null,
		parameters: processor.parameters.map((parameter) => ({
			...parameter,
			prefill: parameter.prefill ?? null
		}))
	};
}

/** Enabled post-processors, fetched once; empty (and retried next time) when the list is unavailable. */
export function loadPostProcessors(): Promise<PostProcessor[]> {
	cached ??= getPostProcessors().then(
		(processors) => processors.map(normalize),
		() => {
			cached = null;
			return [];
		}
	);
	return cached;
}

export interface LayerColor {
	/** Space-separated RGB channels for rgb(… / alpha). */
	rgb: string;
	text: string;
}

const LAYER_COLORS: LayerColor[] = [
	{ rgb: '217 119 6', text: 'rgb(180 83 9)' },
	{ rgb: '13 148 136', text: 'rgb(15 118 110)' },
	{ rgb: '219 39 119', text: 'rgb(190 24 93)' },
	{ rgb: '2 132 199', text: 'rgb(3 105 161)' }
];

/** Stable colour for a processor, by its position in the name-sorted list. */
export function layerColor(index: number): LayerColor {
	return LAYER_COLORS[index % LAYER_COLORS.length];
}

const COLOR_NAMES = ['oranžově', 'tyrkysově', 'růžově', 'modře'];

export function layerColorName(index: number): string {
	return COLOR_NAMES[index % COLOR_NAMES.length];
}
