import type { TrackTaskData } from '$lib/types/task.types';

export const fonologieTestData: TrackTaskData = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				id: 'practice1',
				sequence: ['delfín', 'kočka', 'dům', 'duch'],
				correct: ['delfín', 'dům', 'duch'],
				wordToRead: 'D'
			}
		],
		content: [
			{
				id: 'content1',
				sequence: [],
				correct: ['apple']
			}
		]
	}
];
