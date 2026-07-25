import type { RawDataEntry } from '$lib/types/data.types';

interface PairedReadingBaseRawDataEntry extends RawDataEntry {
	tags?: string[];
}

export interface PairedReadingWordRawDataEntry extends PairedReadingBaseRawDataEntry {
	set: 'practice' | 'level1';
	word: string;
}

export interface PairedReadingSentenceRawDataEntry extends PairedReadingBaseRawDataEntry {
	set: 'level2-practice' | 'level2' | 'level3-practice' | 'level3';
	words: string[];
}

export type PairedReadingRawDataEntry =
	| PairedReadingWordRawDataEntry
	| PairedReadingSentenceRawDataEntry;
