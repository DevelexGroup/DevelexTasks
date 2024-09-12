import { error } from '@sveltejs/kit';
import type { LessonConfigSyllables } from '$lib/types/lesson';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const levels: {
		content: LessonConfigSyllables['content'];
		partialProps: Partial<LessonConfigSyllables['props']>;
		level: string;
	}[] = [
		{
			level: 'zero',
			content: [
				[
					{
						correctSyllable: 'ta',
						syllables: ['ma', 'ma', 'so', 'ta', 'ta', 'ta']
					}
				],
				[
					{
						correctSyllable: 'ma',
						syllables: ['ma', 'ma', 'so']
					}
				],
				[
					{
						correctSyllable: 'ma',
						syllables: ['ma', 'ma', 'so']
					}
				]
			],
			partialProps: {}
		},
		{
			level: 'one',
			content: [
				[
					{
						correctSyllable: 'ma',
						syllables: ['ma', 'ma', 'so']
					},
					{
						correctSyllable: 'ba',
						syllables: ['ba', 'ma', 'ro']
					}
				],
				[
					{
						correctSyllable: 'ma',
						syllables: ['ma', 'ma', 'so']
					},
					{
						correctSyllable: 'ba',
						syllables: ['ba', 'ma', 'ro']
					}
				],
				[
					{
						correctSyllable: 'ma',
						syllables: ['ma', 'ma', 'so']
					},
					{
						correctSyllable: 'ba',
						syllables: ['ba', 'ma', 'ro']
					}
				]
			],
			partialProps: {}
		},
		{
			level: 'two',
			content: [
				[
					{
						correctSyllable: 'ma',
						syllables: ['ma', 'ma', 'so']
					},
					{
						correctSyllable: 'ba',
						syllables: ['ba', 'ma', 'ro']
					}
				],
				[
					{
						correctSyllable: 'ma',
						syllables: ['ma', 'ma', 'so']
					},
					{
						correctSyllable: 'ba',
						syllables: ['ba', 'ma', 'ro']
					}
				],
				[
					{
						correctSyllable: 'ma',
						syllables: ['ma', 'ma', 'so']
					},
					{
						correctSyllable: 'ba',
						syllables: ['ba', 'ma', 'ro']
					}
				]
			],
			partialProps: {}
		}
	];

	const selectedLevel = levels.find((level) => level.level === params.level);

	if (!selectedLevel) {
		error(404, 'Lesson not found');
	}

	return {
		config: selectedLevel
	};
}
