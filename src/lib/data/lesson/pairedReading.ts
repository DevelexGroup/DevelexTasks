import type { LessonConfigPairedReading } from '$lib/types/lesson';

export const pairedReadingLessons: {
	content: LessonConfigPairedReading['content'];
	partialProps: Partial<LessonConfigPairedReading['props']>;
	level: string;
}[] = [
	{
		level: 'one',
		content: [
			[
				{
					text: 'I am a cat.',
					id: 'fixw-0-0'
				},
				{
					text: 'I am a dog.',
					id: 'fixw-0-1'
				}
			],
			[
				{
					text: 'I am a cat.',
					id: 'fixw-1-0'
				},
				{
					text: 'I am a dog.',
					id: 'fixw-1-1'
				}
			],
			[
				{
					text: 'I am a cat.',
					id: 'fixw-2-0'
				},
				{
					text: 'I am a dog.',
					id: 'fixw-2-1'
				}
			]
		],
		partialProps: {
			shouldHighlightWords: true
		}
	}
];
