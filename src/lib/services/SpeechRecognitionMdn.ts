import { CustomEventEmitter } from '$lib/utils/EventEmitter';
import type { ISpeechRecognition, ISpeechRecognitionEvent } from '../interfaces/ISpeechRecognition';

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
			console.log('Transcript:', event.results[event.results.length - 1][0].transcript);
			console.log('Confidence:', event.results[event.results.length - 1][0].confidence);
			console.log('Alternative:', event.results[event.results.length - 1][1].transcript);
		};
	}

	start(): void {
		this.recognition.start();
	}

	stop(): void {
		this.recognition.stop();
	}
}
