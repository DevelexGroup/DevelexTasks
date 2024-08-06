export interface IWordReader {
	read(words: { id: string; text: string }[]): Promise<void>;
}
