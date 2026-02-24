import type { RawDataEntry } from '$lib/types/data.types';

export interface FonologieAudioRawDataEntry extends RawDataEntry {
	topic: string;
	set: string;
	level: string;
	sound: string;
	sequence: string[];
	correct_indices: number[];
}

export interface FonologieManipulationRawDataEntry extends RawDataEntry {
	level: string;
	sound: string;
	model: string[];
	sequence: string[];
	correct_indices: number[];
}

export type FonologieTaskRawDataEntry = FonologieAudioRawDataEntry | FonologieManipulationRawDataEntry;