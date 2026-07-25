import type { AnalyticsManager } from '$lib/utils/analyticsManager';
import { speakText } from '$lib/utils/sound';

interface PlayPairedReadingAudioOptions {
	text: string;
	analyticsManager: Pick<AnalyticsManager, 'setSoundActive'>;
	onStart: () => void;
	onComplete: () => void;
	play?: () => Promise<void>;
}

export const playPairedReadingAudio = async ({
	text,
	analyticsManager,
	onStart,
	onComplete,
	play = () => speakText(text, 'cs-CZ', 0.5)
}: PlayPairedReadingAudioOptions): Promise<void> => {
	const audioAnalyticsId = `paired-reading-tts-${text}`;

	onStart();
	analyticsManager.setSoundActive(audioAnalyticsId, true);

	try {
		await play();

		// () => playSoundOrTTS(`/sound/paired-reading/${taskId}/${stimulusId}.mp3`, text, 'cs-CZ', 0.5)
	} catch (error) {
		console.warn('Unable to play text: ', error);
	} finally {
		analyticsManager.setSoundActive(audioAnalyticsId, false);
		onComplete();
	}
};
