import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
import type { ISpeechRecognition } from '$lib/interfaces/ISpeechRecognition';
import type { IWordReader } from '$lib/interfaces/IWordReader';
import type { PairedReadingTaskType } from '$lib/types/lesson';

export interface LessonTaskPairedReadingTaskProps {
	currentContent: PairedReadingTaskType;
	speechEvaluator: ISpeechEvaluator;
	speechRecognition: ISpeechRecognition;
	wordReader: IWordReader;
	shouldListenForVoice: boolean;
	bufferSize: number;
	logicType?: 'main' | 'pilot';
	fontSize?: number;
	font?: 'times' | 'arial';
	shouldEmitMistake?: boolean;
}
