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
