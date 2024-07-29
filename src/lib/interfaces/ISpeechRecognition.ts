export interface ISpeechRecognition {
	start(): void;
	stop(): void;
	on(listener: (data: ISpeechRecognitionEvent) => void): void;
	off(listener: (data: ISpeechRecognitionEvent) => void): void;
	emit(data: ISpeechRecognitionEvent): void;
}

export type ISpeechRecognitionEvent = ISpeechRecognitionResult | ISpeechRecognitionError;

export interface ISpeechRecognitionResult {
	type: 'speech-transcript';
	transcript: string;
	confidence: number;
	timestamp: number;
	isFinal: boolean;
}

export interface ISpeechRecognitionError {
	type: 'speech-error';
	error: string;
	timestamp: number;
}
