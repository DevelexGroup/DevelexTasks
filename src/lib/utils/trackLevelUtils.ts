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
	return resolveAny(`/sound/syllables/${word.toLowerCase()}.ogg`);
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
	excludeIds?: Set<string>
): TrackTaskDataEntry {
	// For each key in the presetEntry filter out the raw data entries that match the elements in the preset
	let filteredData = rawData;
	const generate = presetEntry.generate;

	if (generate) {
		for (const [key, value] of Object.entries(generate)) {
			const valuesArray = Array.isArray(value) ? value : [value];
			filteredData = filteredData.filter((entry) => valuesArray.includes((entry as never)[key]));
		}
	}

	// Exclude already used IDs
	if (excludeIds) {
		filteredData = filteredData.filter((entry) => !excludeIds.has(entry.id));
	}

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
	formatRawData: (rawData: TRawDataEntry) => TrackTaskDataEntry
): TrackTaskDataEntry[] {
	const content: TrackTaskDataEntry[] = [];
	const usedIds = new Set<string>();

	for (const item of preset) {
		if (item.generate !== null) {
			// Generator
			const generator = item as TrackTaskPresetEntryGenerator<TRawDataEntry>;
			const generatedEntry = generateDataEntry<TRawDataEntry>(generator, rawData, formatRawData, usedIds);
			usedIds.add(generatedEntry.id);
			content.push(generatedEntry);
		} else {
			// Definition
			const data = item as TrackTaskDataEntry;
			const sequenceFlat = Array.isArray(data.sequence[0])
				? (data.sequence as string[][]).flat()
				: (data.sequence as string[]);
			data.correctCount = sequenceFlat.filter((i) => data.correct?.includes(i)).length;
			content.push(data);
		}
	}
	return content;
}
