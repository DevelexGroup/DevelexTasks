import type {
	TrackTaskDataEntry, TrackTaskPresetEntryDefinition,
	TrackTaskPresetEntryGenerator
} from '$lib/types/task.types';
import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';

export function formatCibuleRawData(rawData: CibuleRawDataEntry): TrackTaskDataEntry {
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

function generateCibuleDataEntry(
	presetEntry: TrackTaskPresetEntryGenerator<CibuleRawDataEntry>,
	rawData: CibuleRawDataEntry[],
	excludeIds?: Set<number>
): TrackTaskDataEntry {
	// For each key in the presetEntry filter out the raw data entries that match the elements in the preset
	let filteredData = rawData;
	const generate = presetEntry.generate;

	if (generate) {
		for (const [key, value] of Object.entries(generate)) {
			const valuesArray = Array.isArray(value) ? value : [value];
			filteredData = filteredData.filter((entry) => valuesArray.includes((entry as never)[key]));
		}
	}

	// Exclude already used IDs
	if (excludeIds) {
		filteredData = filteredData.filter((entry) => !excludeIds.has(entry.id));
	}

	// Randomly select one entry from the filtered data
	if (filteredData.length === 0) {
		throw new Error('No matching raw data entries found for the given preset generator.');
	}

	const randomIndex = Math.floor(Math.random() * filteredData.length);
	const selectedEntry = filteredData[randomIndex];
	return formatCibuleRawData(selectedEntry);
}

export function getCibuleLevelData(
	preset: (TrackTaskPresetEntryDefinition | TrackTaskPresetEntryGenerator<CibuleRawDataEntry>)[],
	rawData: CibuleRawDataEntry[]
): TrackTaskDataEntry[] {
	const content: TrackTaskDataEntry[] = [];
	const usedIds = new Set<number>();

	for (const item of preset) {
		if (item.generate !== null) { // Generator
			const generator = item as TrackTaskPresetEntryGenerator<CibuleRawDataEntry>;
			const generatedEntry = generateCibuleDataEntry(generator, rawData, usedIds);
			usedIds.add(parseInt(generatedEntry.id));
			content.push(generatedEntry);
		} else { // Definition
			const data = item as TrackTaskDataEntry;
			const sequenceFlat = Array.isArray(data.sequence[0])
				? (data.sequence as string[][]).flat()
				: (data.sequence as string[]);
			data.correctCount = sequenceFlat.filter((i) => data.correct?.includes(i)).length;
			content.push(data);
		}
	}
	return content;
}