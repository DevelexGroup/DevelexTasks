import type { TaskMetadata, TrackTaskDataEntry, TrackTaskPreset } from '$lib/types/task.types';
import type { ZrakovkaRawDataEntry } from './zrakovka.types';

export const addToList = true;
export const label = 'Zraková diferenciace';
export const description = 'Example description';

export const zrakovkaLevelPreset: TrackTaskPreset<ZrakovkaRawDataEntry> = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				generate: {
					sada: ['zacvik1']
				}
			}
		],
		content: [
			{
				generate: {
					sada: ['sada1.1']
				}
			},
			{
				generate: {
					sada: ['sada1.2']
				}
			},
			{
				generate: {
					sada: ['sada1.3']
				}
			},
			{
				generate: {
					sada: ['sada1.4']
				}
			},
			{
				generate: {
					sada: ['sada1.5']
				}
			},
			{
				generate: {
					sada: ['sada1.6']
				}
			},
			{
				generate: {
					sada: ['sada1.7']
				}
			},
			{
				generate: {
					sada: ['sada1.8']
				}
			},
			{
				generate: {
					sada: ['sada1.9']
				}
			},
			{
				generate: {
					sada: ['sada1.10']
				}
			},
			{
				generate: {
					sada: ['sada1.11']
				}
			},
			{
				generate: {
					sada: ['sada1.12']
				}
			}
		]
	},
	{
		levelID: 'level2',
		label: 'Úroveň 2',
		practiceContent: [
			{
				generate: {
					sada: ['zacvik2']
				}
			}
		],
		content: [
			{
				generate: {
					sada: ['sada2.1']
				}
			},
			{
				generate: {
					sada: ['sada2.2']
				}
			},
			{
				generate: {
					sada: ['sada2.3']
				}
			},
			{
				generate: {
					sada: ['sada2.4']
				}
			},
			{
				generate: {
					sada: ['sada2.5']
				}
			},
			{
				generate: {
					sada: ['sada2.6']
				}
			},
			{
				generate: {
					sada: ['sada2.7']
				}
			},
			{
				generate: {
					sada: ['sada2.8']
				}
			},
			{
				generate: {
					sada: ['sada2.9']
				}
			},
			{
				generate: {
					sada: ['sada2.10']
				}
			},
			{
				generate: {
					sada: ['sada2.11']
				}
			},
			{
				generate: {
					sada: ['sada2.12']
				}
			}
		]
	},
	{
		levelID: 'level3',
		label: 'Úroveň 3',
		practiceContent: [
			{
				generate: {
					sada: ['zacvik3']
				}
			}
		],
		content: [
			{
				generate: {
					sada: ['sada3.1']
				}
			},
			{
				generate: {
					sada: ['sada3.2']
				}
			},
			{
				generate: {
					sada: ['sada3.3']
				}
			},
			{
				generate: {
					sada: ['sada3.4']
				}
			},
			{
				generate: {
					sada: ['sada3.5']
				}
			},
			{
				generate: {
					sada: ['sada3.6']
				}
			},
			{
				generate: {
					sada: ['sada3.7']
				}
			},
			{
				generate: {
					sada: ['sada3.8']
				}
			},
			{
				generate: {
					sada: ['sada3.9']
				}
			},
			{
				generate: {
					sada: ['sada3.10']
				}
			},
			{
				generate: {
					sada: ['sada3.11']
				}
			},
			{
				generate: {
					sada: ['sada3.12']
				}
			}
		]
	},
	{
		levelID: 'level4',
		label: 'Úroveň 4',
		practiceContent: [
			{
				generate: {
					sada: ['zacvik4']
				}
			}
		],
		content: [
			{
				generate: {
					sada: ['sada4.1']
				}
			},
			{
				generate: {
					sada: ['sada4.2']
				}
			},
			{
				generate: {
					sada: ['sada4.3']
				}
			},
			{
				generate: {
					sada: ['sada4.4']
				}
			},
			{
				generate: {
					sada: ['sada4.5']
				}
			},
			{
				generate: {
					sada: ['sada4.6']
				}
			},
			{
				generate: {
					sada: ['sada4.7']
				}
			},
			{
				generate: {
					sada: ['sada4.8']
				}
			},
			{
				generate: {
					sada: ['sada4.9']
				}
			},
			{
				generate: {
					sada: ['sada4.10']
				}
			},
			{
				generate: {
					sada: ['sada4.11']
				}
			},
			{
				generate: {
					sada: ['sada4.12']
				}
			}
		]
	},
	{
		levelID: 'level5',
		label: 'Úroveň 5',
		practiceContent: [
			{
				generate: {
					sada: ['zacvik5']
				}
			}
		],
		content: [
			{
				generate: {
					sada: ['sada5.1']
				}
			},
			{
				generate: {
					sada: ['sada5.2']
				}
			},
			{
				generate: {
					sada: ['sada5.3']
				}
			},
			{
				generate: {
					sada: ['sada5.4']
				}
			},
			{
				generate: {
					sada: ['sada5.5']
				}
			},
			{
				generate: {
					sada: ['sada5.6']
				}
			},
			{
				generate: {
					sada: ['sada5.7']
				}
			},
			{
				generate: {
					sada: ['sada5.8']
				}
			},
			{
				generate: {
					sada: ['sada5.9']
				}
			},
			{
				generate: {
					sada: ['sada5.10']
				}
			},
			{
				generate: {
					sada: ['sada5.11']
				}
			},
			{
				generate: {
					sada: ['sada5.12']
				}
			}
		]
	},
	{
		levelID: 'level6',
		label: 'Úroveň 6',
		practiceContent: [
			{
				generate: {
					sada: ['zacvik6']
				}
			}
		],
		content: [
			{
				generate: {
					sada: ['sada6.1']
				}
			},
			{
				generate: {
					sada: ['sada6.2']
				}
			},
			{
				generate: {
					sada: ['sada6.3']
				}
			},
			{
				generate: {
					sada: ['sada6.4']
				}
			},
			{
				generate: {
					sada: ['sada6.5']
				}
			},
			{
				generate: {
					sada: ['sada6.6']
				}
			},
			{
				generate: {
					sada: ['sada6.7']
				}
			},
			{
				generate: {
					sada: ['sada6.8']
				}
			},
			{
				generate: {
					sada: ['sada6.9']
				}
			},
			{
				generate: {
					sada: ['sada6.10']
				}
			},
			{
				generate: {
					sada: ['sada6.11']
				}
			},
			{
				generate: {
					sada: ['sada6.12']
				}
			}
		]
	}
];

export const formatZrakovkaRawData = (rawData: ZrakovkaRawDataEntry): TrackTaskDataEntry => {
	return {
		id: rawData.id,
		sequence: Array.isArray(rawData.string)
			? rawData.string
			: rawData.string.split(',').map((item) => item.trim()),
		correct: rawData.target ? rawData.target.split(',').map((item) => item.trim()) : undefined,
		font: rawData.font,
		size: rawData.size
	};
};

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
