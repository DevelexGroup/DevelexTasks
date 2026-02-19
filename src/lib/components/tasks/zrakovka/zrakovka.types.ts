import type { RawDataEntry } from '$lib/types/data.types';

export interface ZrakovkaRawDataEntry extends RawDataEntry {
	sada: string;
	font: string;
	size: number;
	level: string;
	target: string;
	string: string | string[];
	position: number[] | number[][];
}
