import type { ISpeechRecognitionResult } from '$lib/interfaces/ISpeechRecognition';
import type { ISpeechEvaluator, ISpeechEvaluatorResult } from '../interfaces/ISpeechEvaluator';

export class SpeechEvaluatorSimple implements ISpeechEvaluator {
	private _targetWord: string;
	get targetWord(): string {
		return this._targetWord;
	}
	set targetWord(value: string) {
		this._targetWord = this.normalizeWord(value);
	}
	constructor(targetWord: string = '') {
		this._targetWord = this.normalizeWord(targetWord);
	}

	evaluateSpeech(input: ISpeechRecognitionResult): ISpeechEvaluatorResult {
		let isAtLeastOneCorrect = false;
		let normalizedTranscript = '';
		let confidence = 0;

		for (const value of input.values) {
			const { transcript } = value;

			// Normalize the spoken word
			let localNormalizedTranscript = this.normalizeWord(transcript);

			// If has more letters than target word, only compare the last letters
			const targetWordLength = this.targetWord.length;
			const spokenWordLength = localNormalizedTranscript.length;

			if (spokenWordLength > targetWordLength) {
				localNormalizedTranscript = localNormalizedTranscript.substring(
					spokenWordLength - targetWordLength
				);
			}

			const isCorrect = localNormalizedTranscript === this.targetWord;

			if (value.confidence > confidence) {
				confidence = value.confidence;
				normalizedTranscript = localNormalizedTranscript;
			}

			if (isCorrect) {
				isAtLeastOneCorrect = true;
				confidence = value.confidence;
				normalizedTranscript = localNormalizedTranscript;
				break;
			}
		}

		return {
			isCorrect: isAtLeastOneCorrect,
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
