import LessonTaskSyllableLevel from '$lib/components/tasks/syllable/LessonTaskSyllableLevel.svelte';
import LessonTaskCibuleLevel from '$lib/components/tasks/cibule/LessonTaskCibuleLevel.svelte';

export const lessonComponentMap = {
	syllables: LessonTaskSyllableLevel,
	cibule: LessonTaskCibuleLevel
} as const;

export type LessonType = keyof typeof lessonComponentMap;

import type { LessonConfig } from '$lib/types/lesson';

export function createLessonSetup<T extends LessonType>(
	type: T,
	config: Omit<LessonConfig['setup'], 'component'>
): LessonConfig['setup'] {
	const component = lessonComponentMap[type];
	if (!component) throw new Error(`Unknown lesson type: ${type}`);

	return {
		...config,
		component
	};
}
