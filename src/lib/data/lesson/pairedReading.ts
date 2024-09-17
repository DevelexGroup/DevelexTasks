import type LessonTaskPairedReadingLevel from '$lib/components/LessonTaskPairedReadingLevel.svelte';
import type { ComponentProps } from 'svelte';

export const pairedReadingLessons: {
	content: ComponentProps<LessonTaskPairedReadingLevel>['currentContent'][];
	partialProps: Partial<ComponentProps<LessonTaskPairedReadingLevel>>;
	level: string;
}[] = [
	{
		level: 'one',
		content: [],
		partialProps: {
			bufferSize: 150
		}
	}
];
