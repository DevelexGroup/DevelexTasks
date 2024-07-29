import type { ISpeechRecognitionResult } from '$lib/interfaces/ISpeechRecognition';
import type { ISpeechEvaluator, ISpeechEvaluatorResult } from '../interfaces/ISpeechEvaluator';

export class SpeechEvaluatorSimple implements ISpeechEvaluator {
	public targetWord: string;

	constructor(targetWord: string = '') {
		this.targetWord = this.normalizeWord(targetWord);
	}

	evaluateSpeech(input: ISpeechRecognitionResult): ISpeechEvaluatorResult {
		// Extract the first transcript and confidence from the recognition result
		const { transcript, confidence } = input.values[0];

		// Normalize the spoken word
		let normalizedTranscript = this.normalizeWord(transcript);

		// If has more letters than target word, only compare the last letters
		const targetWordLength = this.targetWord.length;
		const spokenWordLength = normalizedTranscript.length;

		if (spokenWordLength > targetWordLength) {
			normalizedTranscript = normalizedTranscript.substring(spokenWordLength - targetWordLength);
		}

		// Simple comparison
		const isCorrect = normalizedTranscript === this.targetWord;

		return {
			isCorrect,
			spokenWord: normalizedTranscript,
			targetWord: this.targetWord,
			recognitionConfidence: confidence,
			timestamp: input.timestamp,
			evaluationConfidence: 1 // Always 1 for simple comparison
		};
	}

	private normalizeWord(word: string): string {
		return word.trim().toLowerCase().replace(/[,.]/g, '');
	}
}
