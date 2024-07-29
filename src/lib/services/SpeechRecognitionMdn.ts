import { Emitter } from '$lib/utils/EventEmitter';
import type {
	ISpeechRecognition,
	ISpeechRecognitionEventMapping
} from '../interfaces/ISpeechRecognition';

/**
 * A service for using the Web Speech API for speech recognition.
 * In each browser, the API functionality may vary, so it's important to check the compatibility of the API in the browser you're targeting.
 * On some browsers, like Chrome, using Speech Recognition on a web page involves a server-based recognition engine. Your audio is sent to a web service for recognition processing, so it won't work offline.
 */
export class SpeechRecognitionMdn
	extends Emitter<ISpeechRecognitionEventMapping>
	implements ISpeechRecognition
{
	public isOn: boolean;
	private recognition: SpeechRecognition;

	constructor() {
		super();
		this.isOn = false;
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		this.recognition = new SpeechRecognition();
		this.recognition.continuous = true;
		this.recognition.interimResults = true;
		this.recognition.lang = 'cs-CZ';
		this.recognition.maxAlternatives = 10;

		this.recognition.onstart = () => {
			this.isOn = true;
			this.emit('start', { type: 'start', timestamp: Date.now() });
		};

		this.recognition.onend = () => {
			this.isOn = false;
			this.emit('end', { type: 'end', timestamp: Date.now() });
		};

		this.recognition.onerror = (event) => {
			this.emit('error', { type: 'error', timestamp: Date.now(), error: event.error });
		};

		this.recognition.onresult = (event: SpeechRecognitionEvent) => {
			console.warn('onresult', event);
			const { results, resultIndex } = event;
			const relevantResults = results[resultIndex];
			const values = Array.from(relevantResults).map((result) => ({
				transcript: result.transcript,
				confidence: result.confidence
			}));
			this.emit('speech', {
				type: 'speech',
				timestamp: Date.now(),
				values,
				isFinal: relevantResults.isFinal
			});
		};
	}

	start(): void {
		this.recognition.start();
	}

	stop(): void {
		this.recognition.stop();
	}
}
