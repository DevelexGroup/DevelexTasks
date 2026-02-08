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
