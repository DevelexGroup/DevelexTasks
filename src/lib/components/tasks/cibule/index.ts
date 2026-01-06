import type { TaskMetadata, TrackTaskPreset } from '$lib/types/task.types';
import { CibuleDataType } from '$lib/components/tasks/cibule/cibule.types';

export const addToList = true;
export const label = 'Cibule';
export const description = 'Example description';

export const cibuleLevelPreset: TrackTaskPreset = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				getRandomOfType: CibuleDataType.Pismena1
			}
		],
		content: [
			{
				getRandomOfType: [CibuleDataType.Pismena1, CibuleDataType.Pismena2]
			},
			{
				getRandomOfType: [CibuleDataType.Pismena1, CibuleDataType.Pismena2]
			},
			{
				getRandomOfType: [
					CibuleDataType.Slabiky21A,
					CibuleDataType.Slabiky21B,
					CibuleDataType.Slabiky21C
				]
			},
			{
				getRandomOfType: [CibuleDataType.Slabiky21D, CibuleDataType.Slabiky22]
			}
		]
	},
	{
		levelID: 'level2',
		label: 'Úroveň 2',
		practiceContent: [
			{
				getRandomOfType: CibuleDataType.Pismena1
			}
		],
		content: [
			{
				getRandomOfType: [CibuleDataType.Pismena1, CibuleDataType.Pismena2]
			},
			{
				getRandomOfType: [CibuleDataType.Pismena1, CibuleDataType.Pismena2]
			},
			{
				getRandomOfType: [
					CibuleDataType.Slabiky21A,
					CibuleDataType.Slabiky21B,
					CibuleDataType.Slabiky21C
				]
			},
			{
				getRandomOfType: [CibuleDataType.Slabiky21D, CibuleDataType.Slabiky22]
			}
		]
	},
	{
		levelID: 'level3a',
		label: 'Úroveň 3A',
		practiceContent: [
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			}
		],
		content: [
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova4Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova4Sl]
			}
		]
	},
	{
		levelID: 'level3b',
		label: 'Úroveň 3B',
		practiceContent: [
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			}
		],
		content: [
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova4Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova4Sl]
			}
		]
	}
];

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
