import { resolveAny } from '$lib/utils/resolveAny';

export const SOUND_CORRECT = '/sound/correct.mp3';
export const SOUND_MISTAKE = '/sound/mistake.mp3';

export function playSound(soundPath: string, volume = 0.5): Promise<void> {
	const audio = new Audio(resolveAny(soundPath));
	audio.volume = volume;
	return audio.play();
}

export function playSoundOrTTS(soundPath: string, word: string, ttsLang: string, volume = 0.5): Promise<void> {
  const playTTS = () => {
    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = ttsLang;
      utterance.volume = volume;
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);
      window.speechSynthesis.speak(utterance);
    });
  };

  return new Promise((resolve) => {
    const resolvedPath = resolveAny(soundPath);
    const audio = new Audio(resolvedPath);
    audio.volume = volume;

    audio.onerror = () => {
      playTTS().then(resolve).catch(() => resolve());
    };

    audio.oncanplaythrough = () => {
      audio.play().then(resolve).catch(() => playTTS().then(resolve));
    };
  });
}
