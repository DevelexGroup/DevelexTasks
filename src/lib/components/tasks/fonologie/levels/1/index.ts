import { resolveAny } from '$lib/utils/resolveAny';
import type { TrackLevelDataEntry } from '$lib/types/task.types';

export const id = 'level1';

export const instructionVideo = null;

export function getShowcaseData(data: TrackLevelDataEntry[]): TrackLevelDataEntry[] {
	const allSymbols = data
		? data.flatMap((entry) =>
				Array.isArray(entry.sequence[0])
					? (entry.sequence as string[][]).flat()
					: (entry.sequence as string[])
			)
		: [];
	const uniqueSymbols = Array.from(new Set(allSymbols));
	return [
		{
			sequence: uniqueSymbols,
			correct: uniqueSymbols
		}
	];
}