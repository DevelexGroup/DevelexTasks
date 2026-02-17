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
	Pismena0 = 'pismena0',
	Pismena1 = 'pismena1',
	Pismena2 = 'pismena2',
	Slabiky1 = 'slabiky1',
	Slabiky2 = 'slabiky2',
	Slova1Sl3 = 'slova1_3sl',
	Slova1Sl4 = 'slova1_4sl',
	Slova2Sl3 = 'slova2_3sl',
	Slova2Sl4 = 'slova2_4sl',
}
