import type {
	TrackLevelDataEntry,
	TrackLevelDataGenerator
} from '$lib/types/task.types';
import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';

export function formatCibuleRawData(rawData: CibuleRawDataEntry): TrackLevelDataEntry {
	const correct = rawData.target_letter
		? rawData.target_letter.split('-').map((item) => item.trim())
		: undefined;
	const sequence = splitSequence(rawData.search_string, correct || []);
	const correctCount = sequence.filter((item) => correct?.includes(item)).length;
	return {
		id: rawData.id.toString(),
		sequence,
		correct,
		wordToRead: correct?.length === 1 ? correct?.[0].toUpperCase() : correct?.join('').toUpperCase(),
		correctCount
	};
}

export function splitSequence(sequence: string, targets: string[]): string[] {
	const regions = sequence.trim().match(/[^ ]+ *| +/g) || [];

	const pattern = new RegExp(`(${targets.join('|')})`, 'g');

	const result: string[] = [];

	for (const region of regions) {
		const parts = region.split(pattern).filter((part) => part !== '');
		result.push(...parts);
	}

	return result;
}

function getRandomEntryOfType(
	rawData: CibuleRawDataEntry[],
	type: string | string[],
	usedIds: Set<number>
): { entry: TrackLevelDataEntry; id: number } {
	const filteredEntries = rawData.filter(
		(entry) =>
			(Array.isArray(type) ? type.includes(entry.type) : entry.type === type) &&
			!usedIds.has(entry.id)
	);

	if (filteredEntries.length === 0) {
		throw new Error(`No entries found for type: ${type}`);
	}
	const randomIndex = Math.floor(Math.random() * filteredEntries.length);
	const selectedEntry = filteredEntries[randomIndex];

	return { entry: formatCibuleRawData(selectedEntry), id: selectedEntry.id };
}

export function getCibuleLevelData(
	preset: (TrackLevelDataEntry | TrackLevelDataGenerator)[],
	rawData: CibuleRawDataEntry[]
): TrackLevelDataEntry[] {
	const content: TrackLevelDataEntry[] = [];
	const usedIds = new Set<number>();

	for (const item of preset) {
		if ('getRandomOfType' in item) {
			const { entry, id } = getRandomEntryOfType(rawData, item.getRandomOfType, usedIds);
			usedIds.add(id);
			content.push(entry);
		} else {
			const data = item as TrackLevelDataEntry;
			const sequenceFlat = Array.isArray(data.sequence[0]) ? (data.sequence as string[][]).flat() : (data.sequence as string[]);
			data.correctCount = sequenceFlat.filter((i) => data.correct?.includes(i)).length;
			content.push(data);
		}
	}
	return content;
}