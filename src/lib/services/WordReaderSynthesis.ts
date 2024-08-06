import type { IWordReader } from '$lib/interfaces/IWordReader';

export class WordReaderSynthesis implements IWordReader {
	/**
	 * The SpeechSynthesisUtterance object that will be used to read the words.
	 * It is initialized in constructor to avoid creating a new object every time the read method is called.
	 */
	utterance: SpeechSynthesisUtterance;

	constructor() {
		this.utterance = new SpeechSynthesisUtterance();
		this.utterance.lang = 'cs-CZ';
		this.utterance.rate = 0.8;
	}

	read(words: { id: string; text: string }[]): Promise<void> {
		const utterance = new SpeechSynthesisUtterance();
		utterance.text = words.map((word) => word.text).join(' ');
		return new Promise((resolve, reject) => {
			utterance.onend = () => {
				resolve();
			};
			utterance.onerror = (e) => {
				reject(e);
			};
			speechSynthesis.speak(utterance);
		});
	}
}
