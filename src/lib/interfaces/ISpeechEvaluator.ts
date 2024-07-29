import type { ISpeechRecognitionResult } from './ISpeechRecognition';

export interface ISpeechEvaluatorResult {
	isCorrect: boolean;
	spokenWord: string;
	targetWord: string;
	recognitionConfidence: number;
	evaluationConfidence: number;
}

export interface ISpeechEvaluator {
	targetWord: string;
	evaluateSpeech(recognitionResult: ISpeechRecognitionResult): ISpeechEvaluatorResult;
}
