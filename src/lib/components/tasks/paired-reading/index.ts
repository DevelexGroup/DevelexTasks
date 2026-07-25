import type {
	TaskMetadata,
	TrackTaskDataEntry,
	TrackTaskPreset,
	TrackTaskPresetEntryGenerator
} from '$lib/types/task.types';
import type { PairedReadingRawDataEntry } from '$lib/components/tasks/paired-reading/paired-reading.types';

export const addToList = true;
export const label = 'Dublované čtení';
export const description = 'Čtení slov a vět s následným zvukovým vzorem.';

export const PRACTICE_WORD_COUNT = 3;
export const LEVEL_1_WORD_COUNT = 8;
export const LEVEL_2_PRACTICE_SENTENCE_COUNT = 4;
export const LEVEL_2_SENTENCE_COUNT = 6;
export const LEVEL_3_SENTENCES_PER_LIST = 3;
export const LEVEL_3_PRACTICE_SENTENCE_COUNT = LEVEL_3_SENTENCES_PER_LIST;
export const LEVEL_3_SENTENCE_COUNT = LEVEL_3_SENTENCES_PER_LIST * 4;

const createSelection = (
	count: number,
	set: PairedReadingRawDataEntry['set']
): TrackTaskPresetEntryGenerator<PairedReadingRawDataEntry>[] => {
	const generate = { set } as TrackTaskPresetEntryGenerator<PairedReadingRawDataEntry>['generate'];

	return Array.from({ length: count }, () => ({ generate }));
};

export const pairedReadingLevelPreset: TrackTaskPreset<PairedReadingRawDataEntry> = [
	{
		levelID: '1',
		label: 'Úroveň 1',
		practiceContent: createSelection(PRACTICE_WORD_COUNT, 'practice'),
		content: createSelection(LEVEL_1_WORD_COUNT, 'level1')
	},
	{
		levelID: '2',
		label: 'Úroveň 2',
		practiceContent: createSelection(LEVEL_2_PRACTICE_SENTENCE_COUNT, 'level2-practice'),
		content: createSelection(LEVEL_2_SENTENCE_COUNT, 'level2')
	},
	{
		levelID: '3',
		label: 'Úroveň 3',
		practiceContent: createSelection(LEVEL_3_PRACTICE_SENTENCE_COUNT, 'level3-practice'),
		content: createSelection(LEVEL_3_SENTENCE_COUNT, 'level3')
	}
];

export const formatPairedReadingRawData = (
	rawData: PairedReadingRawDataEntry
): TrackTaskDataEntry => {
	if (!('word' in rawData)) {
		throw new Error(`Expected a word entry, received '${rawData.id}'.`);
	}

	return {
		id: rawData.id,
		sequence: [rawData.word],
		sound: rawData.word
	};
};

export const formatPairedReadingSentenceRawData = (
	rawData: PairedReadingRawDataEntry
): TrackTaskDataEntry => {
	if (!('words' in rawData)) {
		throw new Error(`Expected a sentence entry, received '${rawData.id}'.`);
	}

	return {
		id: rawData.id,
		sequence: rawData.words,
		sound: rawData.words.join(' ')
	};
};

export const canActivateSentenceWord = (
	wordIndex: number,
	activeWordIndex: number,
	wordCount: number
): boolean => {
	if (wordIndex < 0 || wordIndex >= wordCount) {
		return false;
	}

	if (activeWordIndex === -1) {
		return wordIndex === 0;
	}

	return Math.abs(wordIndex - activeWordIndex) === 1;
};

export const groupSentences = <T>(
	sentences: T[],
	groupSize = LEVEL_3_SENTENCES_PER_LIST
): T[][] => {
	if (groupSize < 1) {
		throw new Error('Sentence group size must be at least one.');
	}

	const groups: T[][] = [];

	for (let index = 0; index < sentences.length; index += groupSize) {
		groups.push(sentences.slice(index, index + groupSize));
	}

	return groups;
};

export const defaultPreset = pairedReadingLevelPreset;

export default {
	label,
	description,
	addToList,
	defaultPreset
} satisfies TaskMetadata;
