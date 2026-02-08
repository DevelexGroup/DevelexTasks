export interface DyslexDataset<T> {
	practice: T;
	content: T;
}

export type SyllablesData = DyslexDataset<string[][]>;

export interface MeantextItem {
	width: number;
	data: string[];
}

export type MeantextData = DyslexDataset<MeantextItem[]>;

export interface PseudotextItem {
	width: number;
	data: string[];
}

export type PseudotextData = DyslexDataset<PseudotextItem[]>;

export interface VisDiffItem {
	cols: number;
	start: number;
	end: number;
}

export type VisDiffData = DyslexDataset<VisDiffItem[]>;
