import type { TrackTaskData } from '$lib/types/task.types';
import ZrakovkaZacvikData from '$lib/components/tasks/zrakovka/data/zacvik.json';
import ZrakovkaLevel1Data from '$lib/components/tasks/zrakovka/data/level1.json';

export const zrakovkaZacvikData = ZrakovkaZacvikData;

export const zrakovkaLevel1Data = ZrakovkaLevel1Data;

export const zrakovkaTestData: TrackTaskData = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				id: 'practice1',
				sequence: [
					'banana',
					'lemon',
					'apple',
					'melon',
					'cherry',
					'lemon',
					'apple',
					'melon',
					'banana'
				],
				correct: ['apple']
			}
		],
		content: [
			{
				id: 'content1',
				sequence: [
					'banana',
					'lemon',
					'apple',
					'melon',
					'cherry',
					'lemon',
					'apple',
					'melon',
					'banana'
				],
				correct: ['apple']
			}
		]
	}
];
