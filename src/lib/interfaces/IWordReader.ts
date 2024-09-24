export interface IWordReader {
	read(words: { id: string; text: string }[]): Promise<void>;
	abort(): void;
	onWordChange?: (
		word: {
			text: string;
			id: string;
			start: number;
			end: number;
		} | null
	) => void;
}
