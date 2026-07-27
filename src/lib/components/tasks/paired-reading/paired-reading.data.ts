import practiceData from '$lib/components/tasks/paired-reading/data/practice.json';
import level1ExampleData from '$lib/components/tasks/paired-reading/data/level1.example.json';
import level2PracticeData from '$lib/components/tasks/paired-reading/data/level2.practice.json';
import level2ExampleData from '$lib/components/tasks/paired-reading/data/level2.example.json';
import level3ExampleData from '$lib/components/tasks/paired-reading/data/level3.example.json';
import type {
	PairedReadingSentenceRawDataEntry,
	PairedReadingWordRawDataEntry
} from '$lib/components/tasks/paired-reading/paired-reading.types';

export const pairedReadingPracticeData: PairedReadingWordRawDataEntry[] = practiceData.map(
	(entry) => ({
		...entry,
		set: 'practice'
	})
);
export const pairedReadingLevel1ExampleData: PairedReadingWordRawDataEntry[] =
	level1ExampleData.map((entry) => ({
		...entry,
		set: 'level1'
	}));

export const pairedReadingLevel1Data: PairedReadingWordRawDataEntry[] = [
	...pairedReadingPracticeData,
	...pairedReadingLevel1ExampleData
];

export const pairedReadingLevel2PracticeData: PairedReadingSentenceRawDataEntry[] =
	level2PracticeData.map((entry) => ({
		...entry,
		set: 'level2-practice'
	}));
export const pairedReadingLevel2ExampleData: PairedReadingSentenceRawDataEntry[] =
	level2ExampleData.map((entry) => ({
		...entry,
		set: 'level2'
	}));

export const pairedReadingLevel2Data: PairedReadingSentenceRawDataEntry[] = [
	...pairedReadingLevel2PracticeData,
	...pairedReadingLevel2ExampleData
];

export const pairedReadingLevel3PracticeData: PairedReadingSentenceRawDataEntry[] =
	pairedReadingLevel2PracticeData.map((entry) => ({
		...entry,
		id: entry.id.replace('PR-L2-', 'PR-L3-'),
		set: 'level3-practice',
		words: [...entry.words]
	}));

export const pairedReadingLevel3ExampleData: PairedReadingSentenceRawDataEntry[] =
	level3ExampleData.map((entry) => ({
		...entry,
		set: 'level3' as const
	}));

export const pairedReadingLevel3Data: PairedReadingSentenceRawDataEntry[] = [
	...pairedReadingLevel3PracticeData,
	...pairedReadingLevel3ExampleData
];
