import type { TrackTaskData } from '$lib/types/task.types';

export const zrakovkaTestData: TrackTaskData = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				sequence: [ 'banana', 'lemon', 'apple', 'melon', 'cherry', 'lemon', 'apple', 'melon', 'banana' ],
				correct: ['apple']
			}
		],
		content: [
			{
				sequence: [ 'banana', 'lemon', 'apple', 'melon', 'cherry', 'lemon', 'apple', 'melon', 'banana' ],
				correct: ['apple']
			}
		]
	}
];
