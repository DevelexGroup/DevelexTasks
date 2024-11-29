import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
import type { ISpeechRecognition } from '$lib/interfaces/ISpeechRecognition';
import type { IWordReader } from '$lib/interfaces/IWordReader';
import type { PairedReadingTaskType } from '$lib/types/lesson';
import type { GazeInteractionObjectFixation } from '@473783/develex-core';

export interface LessonTaskPairedReadingTaskProps {
	gazeFixationEmitter: GazeInteractionObjectFixation;
	currentContent: PairedReadingTaskType;
	speechEvaluator: ISpeechEvaluator;
	speechRecognition: ISpeechRecognition;
	wordReader: IWordReader;
	shouldListenForVoice: boolean;
	bufferSize: number;
	logicType?: 'main' | 'pilot';
}
