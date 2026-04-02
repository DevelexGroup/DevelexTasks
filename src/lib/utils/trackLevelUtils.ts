import type {
	TaskMistake,
	TrackTaskDataEntry,
	TrackTaskPresetEntryDefinition,
	TrackTaskPresetEntryGenerator,
	TrackTaskState
} from '$lib/types/task.types';
import { playSoundOrTTS } from '$lib/utils/sound';
import { resolveAny } from '$lib/utils/resolveAny';
import { AnalyticsManager } from '$lib/utils/analyticsManager';
import {
	MistakeMisclick,
	MistakeSkipped,
	MistakeUnfinished,
	MistakeWrongOrder
} from '$lib/types/mistakes.types';
import type { RawDataEntry } from '$lib/types/data.types';
import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';

export function tryReadWordFromState(state: TrackTaskState, analyticsManager?: AnalyticsManager) {
	const wordToRead = state.dataEntry?.sound;
	if (wordToRead) {
		const audioSource = getWordAudioSource(wordToRead);
		analyticsManager?.setSoundActive(audioSource, true);
		playSoundOrTTS(audioSource, wordToRead.toLowerCase(), 'cs-CZ', 0.5).finally(() => {
			analyticsManager?.setSoundActive(audioSource, false);
		});
	}
}

export function getWordAudioSource(word: string): string {
	const fileName = word.endsWith('.ogg') || word.endsWith('.wav') ? word : `${word}.ogg`;

	return resolveAny(`/sound/syllables/${fileName}`);
}

export function getFlattenedSymbols(state: TrackTaskState): string[] {
	if (!state.dataEntry.sequence) return [];
	return Array.isArray(state.dataEntry.sequence[0])
		? (state.dataEntry.sequence as string[][]).flat()
		: (state.dataEntry.sequence as string[]);
}

export function defaultValidateStage(state: TrackTaskState): TaskMistake[] | true {
	const lastSyllable = getFlattenedSymbols(state).findLastIndex(
		(syllable) => syllable === state.dataEntry.correct?.[0]
	);
	if (
		!state.selectedCorrectIndices ||
		state.selectedCorrectIndices.length === 0 ||
		state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1] !== lastSyllable
	) {
		return [MistakeUnfinished];
	}
	return true;
}

export function defaultValidateSymbol(
	clickedIndex: number,
	state: TrackTaskState
): TaskMistake[] | true {
	// Wrong order check
	if (state.selectedCorrectIndices.length > 0) {
		const lastSelectedIndex = state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1];
		if (clickedIndex <= lastSelectedIndex) {
			return [MistakeWrongOrder];
		}
	}

	// Correctness check
	const correctIndices = getFlattenedSymbols(state)
		.map((symbol, index) => (symbol === state.dataEntry.correct?.[0] ? index : -1))
		.filter((index) => index !== -1);

	const testIndices = [...state.selectedCorrectIndices, clickedIndex];

	if (testIndices.every((value, i) => value === correctIndices[i])) {
		return true;
	}

	// Skipped check
	if (correctIndices.includes(clickedIndex)) {
		return [MistakeSkipped];
	}

	// Otherwise we misclicked
	return [MistakeMisclick];
}

export function generateDataEntry<TRawDataEntry extends RawDataEntry>(
	presetEntry: TrackTaskPresetEntryGenerator<TRawDataEntry>,
	rawData: TRawDataEntry[],
	formatRawData: (rawData: TRawDataEntry) => TrackTaskDataEntry,
	excludeIds?: Set<string>,
	excludeTags?: string[]
): TrackTaskDataEntry {
	// For each key in the presetEntry filter out the raw data entries that match the elements in the preset
	let filteredData = rawData;
	const generate = presetEntry.generate;

	console.log("base", filteredData);
	if (generate) {
		for (const [key, value] of Object.entries(generate)) {
			const valuesArray = Array.isArray(value) ? value : [value];
			console.log(`filtering by ${key} with values ${valuesArray}`, filteredData);
			filteredData = filteredData.filter((entry) => valuesArray.includes((entry as never)[key]));
		}
	}

	console.log(`after preset filtering (${JSON.stringify(generate)})`, filteredData);
	// Exclude already used IDs
	if (excludeIds) {
		filteredData = filteredData.filter((entry) => !excludeIds.has(entry.id));
	}

	console.log("after ID exclusion", filteredData);
	// Exclude entries with certain tags
	if (excludeTags) {
		filteredData = filteredData.filter((entry) => {
			const entryTags = entry.tags || [];
			return !entryTags.some(tag => excludeTags.includes(tag));
		});
	}

	console.log("after tag exclusion", filteredData);

	// Randomly select one entry from the filtered data
	if (filteredData.length === 0) {
		throw new Error('No matching raw data entries found for the given preset generator.');
	}

	const randomIndex = Math.floor(Math.random() * filteredData.length);
	const selectedEntry = filteredData[randomIndex];
	return formatRawData(selectedEntry);
}

export function getLevelData<TRawDataEntry extends RawDataEntry>(
	preset: (TrackTaskPresetEntryDefinition | TrackTaskPresetEntryGenerator<TRawDataEntry>)[],
	rawData: TRawDataEntry[],
	formatRawData: (rawData: TRawDataEntry) => TrackTaskDataEntry,
	excludeTags: string[] = ['evaluation']
): TrackTaskDataEntry[] {
	const content: TrackTaskDataEntry[] = [];
	const usedIds = new Set<string>();

	console.log("Exclude tags:", excludeTags);

	for (const item of preset) {
		if (item.generate !== undefined) {
			// Generator
			const generator = item as TrackTaskPresetEntryGenerator<TRawDataEntry>;
			const generatedEntry = generateDataEntry<TRawDataEntry>(
				generator,
				rawData,
				formatRawData,
				usedIds,
				excludeTags
			);
			usedIds.add(generatedEntry.id);
			content.push(generatedEntry);
		} else {
			// Definition
			// @ts-expect-error item should have structure of TRawDataEntry, but TS can't verify it
			const data = formatRawData(item as TRawDataEntry);
			const sequenceFlat = Array.isArray(data.sequence[0])
				? (data.sequence as string[][]).flat()
				: (data.sequence as string[]);
			data.correctCount = sequenceFlat.filter((i) => data.correct?.includes(i)).length;
			content.push(data);
		}
	}
	return content;
}

export function splitSequence(sequence: string, targets: string[], trimSpaces = false): string[] {
	const regions = sequence.trim().match(trimSpaces ? /[^ ]+/g : /[^ ]+ *| +/g) || [];

	const pattern = new RegExp(`(${targets.join('|')})`, 'g');

	const result: string[] = [];

	for (const region of regions) {
		const parts = region.split(pattern).filter((part) => part !== '');
		result.push(...parts);
	}

	return result;
}
