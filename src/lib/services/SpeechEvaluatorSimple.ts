import type { ISpeechRecognitionResult } from '$lib/interfaces/ISpeechRecognition';
import type { ISpeechEvaluator, ISpeechEvaluatorResult } from '../interfaces/ISpeechEvaluator';

export class SimpleSpeechEvaluator implements ISpeechEvaluator {
	public targetWord: string;

	constructor(targetWord: string) {
		this.targetWord = targetWord.toLowerCase(); // Normalize the target word
	}

	evaluateSpeech(input: ISpeechRecognitionResult): ISpeechEvaluatorResult {
		// Extract the first transcript and confidence from the recognition result
		const { transcript, confidence } = input.values[0];

		// Normalize the spoken word
		const normalizedTranscript = transcript.trim().toLowerCase();

		// Simple comparison
		const isCorrect = normalizedTranscript === this.targetWord;

		return {
			isCorrect,
			spokenWord: normalizedTranscript,
			targetWord: this.targetWord,
			recognitionConfidence: confidence,
			evaluationConfidence: 1 // Always 1 for simple comparison
		};
	}
}
