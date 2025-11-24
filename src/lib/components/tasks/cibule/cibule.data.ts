import type { CibuleTaskLevelData } from '$lib/components/tasks/cibule/cibule.types';

export const cibuleTestData: CibuleTaskLevelData = [
	{
		levelID: "level1",
		label: 'Úroveň 1',
		practiceContent: [
			{
				syllables: [ 'g', 'g', 'g', 'g', 'g', 'a', 'g', 'g', 'g', 'a', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'a', 'g', 'g', 'g', 'a', 'g', 'g', 'a', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'g', 'a', 'g', 'g', 'g', 'g', 'a', 'g', 'g', 'g', 'g' ],
				correctSyllable: 'a',
				wordToRead: 'A'
			},
		],
		content: [
			{
				syllables: [ 'h', 'h', 'h', 'h', 'h', 't', 'h', 'h', 'h', 't', 'h', 'h', 'h', 'h', 'h', 'h', 'h', 'h', 't', 'h', 'h', 'h', 't', 'h', 'h', 't', 'h', 'h', 'h', 'h', 'h', 'h', 'h', 't', 'h', 'h', 'h', 'h', 't', 'h', 'h', 'h', 'h' ],
				correctSyllable: 't',
				wordToRead: 'T',
			},
			{
				syllables: [ 'b', 'b', 'b', 'b', 'b', 'p', 'b', 'b', 'b', 'b', 'p', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'p', 'b', 'b', 'b', 'b', 'p', 'b', 'b', 'p', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'p', 'b', 'b', 'b', 'b', 'p', 'b', 'b', 'b', 'b' ],
				correctSyllable: 'p',
				wordToRead: 'P',
			},
			{
				syllables: [ 'o', 'o', 'o', 'o', 'da', 'o', 'o', 'o', 'da', 'o', 'o', 'da', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'da', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'da', 'o', 'o', 'o' ],
				correctSyllable: 'da',
				wordToRead: 'DA'
			},
			{
				syllables: [ 'a', 'a', 'a', 'lo', 'a', 'a', 'a', 'a', 'a', 'a', 'lo', 'a', 'a', 'a', 'a', 'a', 'lo', 'a', 'a', 'lo', 'a', 'a', 'a', 'a', 'lo', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'lo', 'a', 'a', 'a', 'lo', 'a', 'a', 'a', 'a', 'a' ],
				correctSyllable: 'lo',
				wordToRead: 'LO'
			}
		]
	},
	{
		levelID: "level2",
		label: 'Úroveň 2',
		practiceContent: [],
		content: []
	}
];
