import type { RawDataEntry } from '$lib/types/data.types';

export interface CibuleRawDataEntry extends RawDataEntry {
	target_letter: string;
	background_letters: string[];
	n_targets: number;
	string_length: number;
	similarity_level?: number;
	font: string;
	include_spaces: boolean;
	max_word_length?: number;
	n_background: number;
	search_string: string;
	target_positions: number[];
}

export enum CibuleDataType {
	Pismena1 = 'pismena1',
	Pismena2 = 'pismena2',
	Slabiky21A = 'slabiky2_1a',
	Slabiky21B = 'slabiky2_1b',
	Slabiky21C = 'slabiky2_1c',
	Slabiky21D = 'slabiky2_1d',
	Slabiky22 = 'slabiky2_2',
	Slova3Sl = 'slova_3sl',
	Slova4Sl = 'slova_4sl'
}
