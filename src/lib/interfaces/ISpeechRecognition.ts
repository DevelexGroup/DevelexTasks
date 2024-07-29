import type { Emitter } from '$lib/utils/EventEmitter';

/**
 * Interface representing a speech recognition service.
 * The service allows you to start and stop speech recognition and listen for various events.
 *
 * Currently, it is build around the Web Speech API, but it can be extended to support other speech recognition APIs in the future.
 * That's why the interface is defined separately from the implementation.
 *
 * @example
 * const recognition: ISpeechRecognition = new SpeechRecognitionMdn();
 * recognition.on('speech', handler);
 * recognition.off('speech', handler);
 * recognition.start();
 * recognition.stop();
 */
export interface ISpeechRecognition extends Emitter<ISpeechRecognitionEventMapping> {
	start(): void;
	stop(): void;
}

/**
 * Various types of events that can be emitted by the SpeechRecognition service.
 *
 * @example
 * const recognition: ISpeechRecognition = new SpeechRecognitionMdn();
 * recognition.on('speech', handler);
 * recognition.off('speech', handler);
 */
export type ISpeechRecognitionEventMapping = {
	speech: ISpeechRecognitionResult;
	error: ISpeechRecognitionError;
	start: ISpeechRecognitionStart;
	end: ISpeechRecognitionEnd;
};

export interface ISpeechRecognitionEvent {
	type: string;
	timestamp: number;
}

/**
 * The most important event emitted by the SpeechRecognition service.
 * It contains the recognized speech transcript, confidence, and whether the result is final.
 * It can have multiple values if the recognition engine returns multiple alternatives.
 * The first value is usually the most accurate one.
 * @example
 * recognition.on('speech', (e) => {
 *  console.log(e.values[0].transcript);
 * });
 */
export interface ISpeechRecognitionResult extends ISpeechRecognitionEvent {
	type: 'speech';
	values: Array<{
		transcript: string;
		confidence: number;
	}>;
	isFinal: boolean;
}

export interface ISpeechRecognitionError extends ISpeechRecognitionEvent {
	type: 'error';
	error: string;
}

export interface ISpeechRecognitionStart extends ISpeechRecognitionEvent {
	type: 'start';
}

export interface ISpeechRecognitionEnd extends ISpeechRecognitionEvent {
	type: 'end';
}
