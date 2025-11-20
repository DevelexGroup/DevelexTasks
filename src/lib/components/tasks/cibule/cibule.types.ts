import type { TaskLevelData, TaskLevelProps } from '$lib/types/task.types';

export interface CibuleTaskProps extends TaskLevelProps {
	data: CibuleLevelDataEntry[];
	repetitions?: number;
}

export enum CibuleLevelState {
	InitialDwell,
	Task,
	EndDwell
}

export type CibuleLevelDataEntry = {
	syllables: string[];
	correctSyllable?: string;
	incorrectSyllable?: string;
	wordToRead?: string;
	binding?: Record<number, number>;
}

export type CibuleTaskLevelData = TaskLevelData<CibuleLevelDataEntry>;

export const cibuleTestData: CibuleTaskLevelData = [
	{
		levelID: "level1",
		label: 'Úroveň 1',
		practiceContent: [
			{
				syllables: [ 'ggggg', 'a', 'ggg', 'a', 'gggggggg', 'a', 'ggg', 'a', 'gg', 'a', 'gggggggg', 'a', 'gggg', 'a', 'gggg' ],
				correctSyllable: 'a',
				wordToRead: 'A'
			},
		],
		content: [
			{
				syllables: [ 'hhhhh', 't', 'hhh', 't', 'hhhhhhhh', 't', 'hhh', 't', 'hh', 't', 'hhhhhhh', 't', 'hhhh', 't', 'hhhh' ],
				correctSyllable: 't',
				wordToRead: 'T',
			},
			{
				syllables: [ 'bbbbb', 'p', 'bbbb', 'p', 'bbbbbbbb', 'p', 'bbbb', 'p', 'bb', 'p', 'bbbbbbbb', 'p', 'bbbb', 'p', 'bbbb' ],
				correctSyllable: 'p',
				wordToRead: 'P',
			},
			{
				syllables: [ 'ooooo', 'c', 'ooo', 'c', 'ooooooo', 'c', 'ooo', 'c', 'oo', 'c', 'ooooooo', 'c', 'oooo', 'c', 'oooo' ],
				correctSyllable: 'c',
				wordToRead: 'C',
			}
		]
	},
];