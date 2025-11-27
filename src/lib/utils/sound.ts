import { resolveAny } from '$lib/utils/resolveAny';

export const SOUND_CORRECT = '/sound/correct.mp3';
export const SOUND_MISTAKE = '/sound/mistake.mp3';

export function playSound(soundPath: string, volume = 0.5): Promise<void> {
	const audio = new Audio(resolveAny(soundPath));
	audio.volume = volume;
	return audio.play();
}