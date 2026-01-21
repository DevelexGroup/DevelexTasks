import type { TrackTaskData } from '$lib/types/task.types';

export const zrakovkaTestData: TrackTaskData = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				id: 'practice1',
				sequence: [ 'banana', 'lemon', 'apple', 'melon', 'cherry', 'lemon', 'apple', 'melon', 'banana' ],
				correct: ['apple']
			}
		],
		content: [
			{
				id: 'content1',
				sequence: [ 'banana', 'lemon', 'apple', 'melon', 'cherry', 'lemon', 'apple', 'melon', 'banana' ],
				correct: ['apple']
			}
		]
	}
];
