import type { LessonConfigMap } from '$lib/types/lesson';

const globalGap = 0;

export const visualDiffLessons: LessonConfigMap['visualDiff']['data'][] = [
	{
		level: 'one',
		label: 'Úroveň 1',
		content: [
			[
				{
					correctSyllable: 'apple',
					syllables: [
						'banana',
						'lemon',
						'apple',
						'melon',
						'cherry',
						'lemon',
						'apple',
						'melon',
						'banana'
					]
				}
			],
			[
				{
					correctSyllable: 'lemon',
					syllables: [
						'banana',
						'cherry',
						'apple',
						'lemon',
						'melon',
						'banana',
						'apple',
						'melon',
						'lemon'
					]
				}
			],
			[
				{
					correctSyllable: 'cherry',
					syllables: [
						'banana',
						'cherry',
						'apple',
						'lemon',
						'melon',
						'banana',
						'cherry',
						'melon',
						'lemon'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 8,
			shouldReadCorrectSyllable: false,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'two',
		label: 'Úroveň 2',
		content: [
			[
				{
					correctSyllable: 'banana',
					wordToRead: 'banán',
					syllables: [
						'lemon',
						'apple',
						'cherry',
						'banana',
						'lemon',
						'apple',
						'melon',
						'cherry',
						'lemon',
						'apple',
						'melon',
						'banana'
					]
				}
			],
			[
				{
					correctSyllable: 'lemon',
					wordToRead: 'citrón',
					syllables: [
						'melon',
						'apple',
						'lemon',
						'banana',
						'cherry',
						'apple',
						'banana',
						'cherry',
						'lemon',
						'apple',
						'melon',
						'lemon'
					]
				}
			],
			[
				{
					correctSyllable: 'melon',
					wordToRead: 'meloun',
					syllables: [
						'banana',
						'apple',
						'lemon',
						'apple',
						'cherry',
						'apple',
						'banana',
						'cherry',
						'lemon',
						'melon',
						'lemon',
						'melon'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 8,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'three',
		label: 'Úroveň 3',
		content: [
			[
				{
					wordToRead: 'Vyznač skupinu, ve které je jablko první v pořadí',
					correctGroupIndex: 1,
					syllables: [],
					groups: [
						['banana', 'apple', 'lemon'],
						['apple', 'cherry', 'banana'],
						['cherry', 'lemon', 'melon']
					]
				}
			],
			[
				{
					wordToRead: 'Vyznač skupinu, ve které je banán třetí v pořadí',
					correctGroupIndex: 2,
					syllables: [],
					groups: [
						['cherry', 'lemon', 'melon'],
						['banana', 'apple', 'lemon'],
						['apple', 'cherry', 'banana']
					]
				}
			],
			[
				{
					wordToRead: 'Vyznač skupinu, ve které je meloun na druhém místě v pořadí',
					correctGroupIndex: 1,
					syllables: [],
					groups: [
						['cherry', 'lemon', 'apple'],
						['banana', 'melon', 'lemon'],
						['apple', 'cherry', 'banana']
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 100,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'four',
		label: 'Úroveň 4',
		content: [
			[
				{
					correctSyllable: 'delulu',
					syllables: [
						'surprised',
						'drunk',
						'wink',
						'delulu',
						'surprised',
						'drunk',
						'crazy',
						'wink',
						'delulu',
						'crazy',
						'drunk',
						'delulu',
						'wink',
						'surprised',
						'crazy'
					]
				}
			],
			[
				{
					correctSyllable: 'drunk',
					syllables: [
						'delulu',
						'drunk',
						'wink',
						'surprised',
						'delulu',
						'wink',
						'crazy',
						'delulu',
						'surprised',
						'drunk',
						'crazy',
						'delulu',
						'crazy',
						'surprised',
						'wink'
					]
				}
			],
			[
				{
					correctSyllable: 'crazy',
					syllables: [
						'surprised',
						'drunk',
						'delulu',
						'crazy',
						'delulu',
						'wink',
						'drunk',
						'surprised',
						'delulu',
						'drunk',
						'wink',
						'delulu',
						'surprised',
						'crazy',
						'surprised'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 1,
			shouldReadCorrectSyllable: false,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'five',
		label: 'Úroveň 5',
		content: [
			[
				{
					correctSyllable: 'crazy',
					syllables: [
						'wink',
						'drunk',
						'delulu',
						'crazy',
						'surprised',
						'delulu',
						'wink',
						'drunk',
						'crazy',
						'surprised',
						// \n
						'surprised',
						'delulu',
						'drunk',
						'surprised',
						'crazy',
						'drunk',
						'crazy',
						'wink',
						'delulu',
						'wink',
						// \n
						'drunk',
						'surprised',
						'delulu',
						'crazy',
						'wink',
						'surprised',
						'wink',
						'delulu',
						'crazy',
						'wink',
						// \n
						'crazy',
						'drunk',
						'surprised',
						'delulu',
						'surprised',
						'drunk',
						'crazy',
						'wink',
						'wink',
						'delulu',
						// \n
						'drunk',
						'surprised',
						'crazy',
						'wink',
						'delulu',
						'wink',
						'drunk',
						'delulu',
						'surprised',
						'delulu'
					]
				}
			],
			[
				{
					correctSyllable: 'wink',
					syllables: [
						'delulu',
						'crazy',
						'wink',
						'drunk',
						'surprised',
						'surprised',
						'delulu',
						'drunk',
						'crazy',
						'wink',
						// \n
						'delulu',
						'surprised',
						'delulu',
						'crazy',
						'drunk',
						'wink',
						'wink',
						'crazy',
						'surprised',
						'drunk',
						// \n
						'wink',
						'drunk',
						'surprised',
						'surprised',
						'delulu',
						'delulu',
						'wink',
						'crazy',
						'crazy',
						'drunk',
						// \n
						'wink',
						'delulu',
						'crazy',
						'drunk',
						'surprised',
						'crazy',
						'delulu',
						'wink',
						'drunk',
						'surprised',
						// \n
						'surprised',
						'delulu',
						'crazy',
						'crazy',
						'drunk',
						'crazy',
						'drunk',
						'wink',
						'surprised',
						'delulu'
					]
				}
			],
			[
				{
					correctSyllable: 'drunk',
					syllables: [
						'delulu',
						'crazy',
						'wink',
						'surprised',
						'surprised',
						'wink',
						'delulu',
						'wink',
						'crazy',
						'drunk',
						// \n
						'wink',
						'delulu',
						'crazy',
						'crazy',
						'surprised',
						'surprised',
						'delulu',
						'drunk',
						'drunk',
						'wink',
						// \n
						'wink',
						'drunk',
						'surprised',
						'delulu',
						'delulu',
						'drunk',
						'wink',
						'surprised',
						'crazy',
						'crazy',
						// \n
						'delulu',
						'surprised',
						'delulu',
						'wink',
						'drunk',
						'drunk',
						'wink',
						'crazy',
						'surprised',
						'crazy',
						// \n
						'surprised',
						'delulu',
						'crazy',
						'crazy',
						'drunk',
						'delulu',
						'drunk',
						'crazy',
						'surprised',
						'wink'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 1,
			shouldReadCorrectSyllable: false,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0,
			gridCols: 10
		}
	}
];
