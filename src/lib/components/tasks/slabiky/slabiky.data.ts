import type { TrackTaskData } from '$lib/types/task.types';

export const slabikyTestData: TrackTaskData = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				syllables: ['po', 'pe', 'ba', 'du', 'pa', 'do', 'be'],
				correctSyllables: ['do'],
				wordToRead: 'DO',
			}
		],
		content: [
			{
				syllables: ['sa', 'su', 'sa', 'as', 'so', 'za', 'sa', 'si', 'su', 'ca', 'sa', 'so', 'ze', 'se', 'sa'],
				correctSyllables: ['se'],
				wordToRead: 'SE',
			},
			{
				syllables: ['bo', 'op', 'po', 'pe', 'do', 'pa', 'po', 'bo', 'pu', 'po', 'do', 'po', 'po', 'pi', 'po'],
				correctSyllables: ['po'],
				wordToRead: 'PO',
			},
			{
				syllables: ['je', 'je', 'ja', 'ju', 'ja', 'ja', 'je', 'ja', 'jo', 'ja', 'ju', 'ja', 'ja', 'ja', 'ja'],
				correctSyllables: ['ja'],
				wordToRead: 'JA',
			},
			{
				syllables: [
					['ci', 'ic', 'ci', 'ce', 'ca', 'co', 'ci'],
					['ca', 'ci', 'ic', 'ci', 'ce', 'cu', 'ce'],
					['ci', 'co', 'ca', 'ci', 'ce', 'ci', 'ci'],
					['cu', 'ci', 'ic', 'ci', 'ca', 'ce', 'ci']
				],
				correctSyllables: ['ci'],
				wordToRead: 'CI',
			},
			{
				syllables: [
					['ku', 'uk', 'hu', 'ku', 'kn', 'ku', 'ku'],
					['ka', 'hu', 'ku', 'lu', 'tu', 'ku', 'uk'],
					['hu', 'ku', 'ku', 'ku', 'ka', 'ku', 'ku'],
					['ku', 'lu', 'ka', 'ku', 'hu', 'ku', 'ak']
				],
				correctSyllables: ['ku'],
				wordToRead: 'KU'
			}
		]
	}
];
