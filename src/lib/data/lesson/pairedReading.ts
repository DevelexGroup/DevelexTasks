import type LessonTaskPairedReadingLevel from '$lib/components/LessonTaskPairedReadingLevel.svelte';
import type { ComponentProps, SvelteComponent } from 'svelte';

type TaskContent<T extends SvelteComponent> = T extends { $$prop_def: { currentContent: unknown } }
	? {
			content: ComponentProps<T>['currentContent'][];
			partialProps: Partial<ComponentProps<T>>;
			level: string;
		}
	: never;

export const pairedReadingLessonsE: TaskContent<LessonTaskPairedReadingLevel>[] = [
	{
		level: 'one',
		content: [],
		partialProps: {
			bufferSize: 150
		}
	}
];
