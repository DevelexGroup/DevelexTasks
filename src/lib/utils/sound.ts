import { resolveAny } from '$lib/utils/resolveAny';

export const SOUND_CORRECT = '/sound/correct.mp3';
export const SOUND_MISTAKE = '/sound/mistake.mp3';

export function playSound(soundPath: string, volume = 0.5): Promise<void> {
	const audio = new Audio(resolveAny(soundPath));
	audio.volume = volume;
	return audio.play();
}

export function playSoundOrTTS(soundPath: string, word: string, ttsLang: string, volume = 0.5): Promise<void> {
	return new Promise((resolve, reject) => {
		const audio = new Audio(resolveAny(soundPath));
		audio.volume = volume;

		audio.addEventListener('canplaythrough', () => {
			audio.play().then(resolve).catch(reject);
		});

		audio.addEventListener('error', () => {
			// Sound file not found, use TTS instead
			const utterance = new SpeechSynthesisUtterance(word);
			utterance.lang = ttsLang;
			utterance.volume = volume;
			utterance.onend = () => resolve();
			utterance.onerror = (event) => reject(event.error);
			speechSynthesis.speak(utterance);
		});
	});
}