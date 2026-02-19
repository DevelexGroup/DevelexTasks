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
		font: rawData.font
	};
};

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
