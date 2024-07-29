import type { ISpeechRecognitionResult } from './ISpeechRecognition';

export interface ISpeechEvaluatorResult {
	isCorrect: boolean;
	spokenWord: string;
	targetWord: string;
	recognitionConfidence: number;
	evaluationConfidence: number;
	timestamp: number;
}

/**
 * Interface representing a speech evaluator that compares the recognized speech to a target word.
 * The target word should be
 */
export interface ISpeechEvaluator {
	targetWord: string;
	evaluateSpeech(recognitionResult: ISpeechRecognitionResult): ISpeechEvaluatorResult;
}
