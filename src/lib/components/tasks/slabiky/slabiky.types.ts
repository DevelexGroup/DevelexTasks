import type { RawDataEntry } from '$lib/types/data.types';

export interface SlabikyRawDataEntry extends RawDataEntry {
	type: string;
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