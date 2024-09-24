// WordReaderSynthesis.ts
import type { IWordReader } from '$lib/interfaces/IWordReader';

export class WordReaderSynthesis implements IWordReader {
	utterance: SpeechSynthesisUtterance | null = null;
	wordPositions: Array<{ text: string; id: string; start: number; end: number }> = [];
	currentWord: {
		text: string;
		id: string;
		start: number;
		end: number;
	} | null = null;
	speed: 'very-slow' | 'slow' | 'normal' = 'slow';
	get utteranceRate() {
		switch (this.speed) {
			case 'very-slow':
				return 0.4;
			case 'slow':
				return 0.6;
			case 'normal':
				return 0.8;
		}
	}

	/**
	 * Callback function to notify when the current word changes.
	 */
	onWordChange?: (
		word: {
			text: string;
			id: string;
			start: number;
			end: number;
		} | null
	) => void;

	constructor() {
		// Do not initialize the utterance here to avoid SSR issues
	}

	private initializeUtterance() {
		if (typeof window !== 'undefined' && 'SpeechSynthesisUtterance' in window) {
			this.utterance = new SpeechSynthesisUtterance();
			this.utterance.lang = 'cs-CZ';
			this.utterance.rate = this.utteranceRate;
		} else {
			console.error('SpeechSynthesisUtterance is not supported in this environment.');
			throw new Error('SpeechSynthesisUtterance is not available');
		}
	}

	private getCurrentWord(charIndex: number): {
		text: string;
		id: string;
		start: number;
		end: number;
	} | null {
		for (const wordPosition of this.wordPositions) {
			if (charIndex >= wordPosition.start && charIndex < wordPosition.end) {
				return wordPosition;
			}
		}
		return null;
	}

	read(words: { text: string; id: string }[]): Promise<void> {
		if (!this.utterance) {
			this.initializeUtterance();
		}

		let text = '';
		let position = 0;
		this.wordPositions = [];

		// Build the utterance text and record word positions
		words.forEach((wordObj, index) => {
			const wordText = wordObj.text;
			if (index > 0) {
				text += ' ';
				position += 1; // Account for space
			}
			const start = position;
			text += wordText;
			position += wordText.length;
			const end = position;
			this.wordPositions.push({ text: wordText, id: wordObj.id, start, end });
		});

		this.utterance!.text = text;

		return new Promise((resolve, reject) => {
			this.utterance!.onend = () => {
				this.currentWord = null;
				if (this.onWordChange) {
					this.onWordChange(this.currentWord);
				}
				resolve();
			};
			this.utterance!.onerror = (e) => {
				reject(e);
			};

			// Handle boundary events to track the current word
			this.utterance!.onboundary = (event) => {
				if (event.name === 'word') {
					const charIndex = event.charIndex;
					const currentWord = this.getCurrentWord(charIndex);
					this.currentWord = currentWord;
					if (this.onWordChange) {
						this.onWordChange(this.currentWord);
					}
				}
			};

			speechSynthesis.speak(this.utterance!);
		});
	}

	abort(): void {
		try {
			speechSynthesis.cancel();
		} catch (error) {
			console.error(error);
		}
	}
}
