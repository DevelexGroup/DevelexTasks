import type { TrackTaskData } from '$lib/types/task.types';

export const fonologieTestData: TrackTaskData = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				sequence: ['delfín', 'kočka', 'dům', 'duch'],
				correct: ['delfín', 'dům', 'duch'],
				wordToRead: 'D'
			}
		],
		content: [
			{
				sequence: [],
				correct: ['apple']
			}
		]
	}
];
