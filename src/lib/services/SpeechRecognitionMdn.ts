import { CustomEventEmitter } from '$lib/utils/EventEmitter';
import type { ISpeechRecognition, ISpeechRecognitionEvent } from '../interfaces/ISpeechRecognition';

/**
 * A service for using the Web Speech API for speech recognition.
 * In each browser, the API functionality may vary, so it's important to check the compatibility of the API in the browser you're targeting.
 * On some browsers, like Chrome, using Speech Recognition on a web page involves a server-based recognition engine. Your audio is sent to a web service for recognition processing, so it won't work offline.
 */
export class SpeechRecognitionMdn
	extends CustomEventEmitter<ISpeechRecognitionEvent>
	implements ISpeechRecognition
{
	private recognition: SpeechRecognition;

	constructor() {
		super();
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		this.recognition = new SpeechRecognition();
		this.recognition.continuous = true;
		this.recognition.interimResults = true;
		this.recognition.lang = 'cs-CZ';
		this.recognition.maxAlternatives = 10;
		this.recognition.onstart = () => {
			console.log('Microphone access granted.');
		};

		// Handle other events like onend, onaudiostart, etc.
		this.recognition.onspeechstart = () => {
			console.log('Speech has been detected.');
		};

		this.recognition.onspeechend = () => {
			console.log('Speech has stopped.');
		};

		this.recognition.onend = () => {
			console.log('Microphone access ended.');
		};

		this.recognition.onaudiostart = () => {
			console.log('Audio capture started.');
		};

		this.recognition.onaudioend = () => {
			console.log('Audio capture ended.');
		};

		this.recognition.onsoundstart = () => {
			console.log('Sound has started.');
		};

		this.recognition.onsoundend = () => {
			console.log('Sound has ended.');
		};

		this.recognition.onspeechstart = () => {
			console.log('Speech has started.');
		};

		this.recognition.onspeechend = () => {
			console.log('Speech has ended.');
		};

		this.recognition.onnomatch = () => {
			console.log('No match found.');
		};

		this.recognition.onresult = (event) => {
			console.log('onresult', event);
		};

		this.recognition.onnomatch = (event) => {
			console.log('No match found.', event);
		};
	}

	start(): void {
		this.recognition.start();
	}

	stop(): void {
		this.recognition.stop();
	}
}
