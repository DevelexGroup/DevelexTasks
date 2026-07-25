import { resolveAny } from '$lib/utils/resolveAny';

export const SOUND_CORRECT = '/sound/correct.mp3';
export const SOUND_MISTAKE = '/sound/mistake.mp3';

export const playSound = (soundPath: string, volume = 0.5): Promise<void> => {
	const audio = new Audio(resolveAny(soundPath));
	audio.volume = volume;
	return audio.play();
};

export const speakText = (word: string, ttsLang = 'cs-CZ', volume = 0.5): Promise<void> => {
	return new Promise<void>((resolve, reject) => {
		if (!('speechSynthesis' in window)) {
			reject(new Error('Speech synthesis is not supported by this browser.'));
			return;
		}

		const utterance = new SpeechSynthesisUtterance(word);
		utterance.lang = ttsLang;
		utterance.volume = volume;
		utterance.onend = () => resolve();
		utterance.onerror = (event) => reject(new Error(event.error));
		window.speechSynthesis.speak(utterance);
	});
};

export const playSoundOrTTS = (
	soundPath: string,
	word: string,
	ttsLang: string,
	volume = 0.5
): Promise<void> => {
	return new Promise((resolve) => {
		const resolvedPath = resolveAny(soundPath);
		const audio = new Audio(resolvedPath);
		audio.volume = volume;

		audio.onerror = () => {
			speakText(word, ttsLang, volume)
				.then(resolve)
				.catch(() => resolve());
		};

		audio.oncanplaythrough = () => {
			audio.onended = () => resolve();
			audio.play().catch(() =>
				speakText(word, ttsLang, volume)
					.then(resolve)
					.catch(() => resolve())
			);
		};
	});
};
