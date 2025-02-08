import type { LessonConfigMap } from '$lib/types/lesson';

const globalGap = 0;

export const cibuleLessons: LessonConfigMap['cibule']['data'][] = [
	{
		level: 'one',
		label: 'Úroveň 1',
		content: [
			[
				{
					correctSyllable: 'a',
					syllables: [
						'ggggg',
						'a',
						'ggg',
						'a',
						'gggggggg',
						'a',
						'ggg',
						'a',
						'gg',
						'a',
						'gggggggg',
						'a',
						'gggg',
						'a',
						'gggg'
					]
				}
			],
			[
				{
					correctSyllable: 't',
					syllables: [
						'hhhhh',
						't',
						'hhh',
						't',
						'hhhhhhhh',
						't',
						'hhh',
						't',
						'hh',
						't',
						'hhhhhhh',
						't',
						'hhhh',
						't',
						'hhhh'
					]
				}
			],
			[
				{
					correctSyllable: 'p',
					syllables: [
						'bbbbb',
						'p',
						'bbbb',
						'p',
						'bbbbbbbb',
						'p',
						'bbbb',
						'p',
						'bb',
						'p',
						'bbbbbbbb',
						'p',
						'bbbb',
						'p',
						'bbbb'
					]
				}
			],
			[
				{
					correctSyllable: 'c',
					wordToRead: 'cé',
					syllables: [
						'ooooo',
						'c',
						'ooo',
						'c',
						'ooooooo',
						'c',
						'ooo',
						'c',
						'oo',
						'c',
						'ooooooo',
						'c',
						'oooo',
						'c',
						'oooo'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
			shouldReadCorrectSyllable: true,
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
					correctSyllable: 'k',
					wordToRead: 'ká',
					syllables: ['k']
				}
			],
			[
				{
					correctSyllable: 'k',
					wordToRead: 'ká',
					syllables: [
						'eeeee',
						'k',
						'eeeeeee',
						'k',
						'eeeeeeeeee',
						'k',
						'eeeee',
						'k',
						'eee',
						'k',
						'eeeeeee',
						'k',
						'eeeee'
					]
				}
			],
			[
				{
					correctSyllable: 'v',
					syllables: ['v']
				}
			],
			[
				{
					correctSyllable: 'v',
					syllables: [
						'hhhhh',
						'v',
						'hhhhhhh',
						'v',
						'hhhhhhhhhh',
						'v',
						'hhhhh',
						'v',
						'hhhh',
						'v',
						'hhhhhhhh',
						'v',
						'hhhhh'
					]
				}
			],
			[
				{
					correctSyllable: 'm',
					syllables: ['m']
				}
			],
			[
				{
					correctSyllable: 'm',
					syllables: [
						'nnnn',
						'm',
						'nnnnnnn',
						'm',
						'nnnnnnnnnn',
						'm',
						'nnnnn',
						'm',
						'nnnn',
						'm',
						'nnnnnnn',
						'm',
						'nnnnn'
					]
				}
			],
			[
				{
					correctSyllable: 'd',
					syllables: ['d']
				}
			],
			[
				{
					correctSyllable: 'd',
					syllables: [
						'bbbbb',
						'd',
						'bbbbbbb',
						'd',
						'bbbbbbbbbb',
						'd',
						'bbbbb',
						'd',
						'bbbb',
						'd',
						'bbbbbbb',
						'd',
						'bbbbb'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
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
					correctSyllable: 'da',
					syllables: [
						'oooo',
						'da',
						'ooo',
						'da',
						'oo',
						'da',
						'ooooooo',
						'da',
						'ooooooo',
						'da',
						'ooo'
					]
				}
			],
			[
				{
					correctSyllable: 'lo',
					syllables: [
						'aaa',
						'lo',
						'aaaaaa',
						'lo',
						'aaaaa',
						'lo',
						'aa',
						'lo',
						'aaaa',
						'lo',
						'aaaaaaa',
						'lo',
						'aaa',
						'lo',
						'aaaaa'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'four',
		label: 'Úroveň 4',
		content: [
			[
				{
					correctSyllable: 'pe',
					syllables: ['pe']
				}
			],
			[
				{
					correctSyllable: 'pe',
					syllables: [
						'aaaaaa',
						'pe',
						'aaaaaa',
						'pe',
						'aa',
						'pe',
						'aa',
						'pe',
						'aaaaa',
						'pe',
						'aaaaaaaaaa',
						'pe',
						'aaaaa',
						'pe'
					]
				}
			],
			[
				{
					correctSyllable: 'ma',
					syllables: ['ma']
				}
			],
			[
				{
					correctSyllable: 'ma',
					syllables: [
						'ma',
						'iiiiiiiiii',
						'ma',
						'iiiiiiii',
						'ma',
						'iii',
						'ma',
						'ii',
						'ma',
						'iiiiiiiiiiiiii',
						'ma',
						'ii',
						'ma',
						'iiiiiiii'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'five',
		label: 'Úroveň 5',
		content: [
			[
				{
					incorrectSyllable: 'z',
					syllables: [
						'zzzzzz',
						'v',
						'zzzzzz',
						'o',
						'zzzzzzzzz',
						'd',
						'zzzzzzzzzzzzzz',
						'a',
						'zzzzzz'
					]
				}
			],
			[
				{
					incorrectSyllable: 's',
					syllables: [
						'sssssssssssss',
						'z',
						'ssss',
						'i',
						'sssssssssssssssss',
						'm',
						'ssssssssss',
						'a',
						'ssssss'
					]
				}
			],
			[
				{
					incorrectSyllable: 'p',
					syllables: [
						'ppppppp',
						'c',
						'ppp',
						'i',
						'pppppp',
						'b',
						'pppppppp',
						'u',
						'ppp',
						'l',
						'pppp',
						'e',
						'ppppp'
					]
				}
			],
			[
				{
					incorrectSyllable: 'o',
					syllables: [
						'ooooo',
						's',
						'oooo',
						'l',
						'ooooo',
						'u',
						'ooooooooo',
						'n',
						'ooo',
						'c',
						'ooooo',
						'e',
						'oooooooo'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
			shouldReadCorrectSyllable: false,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'six',
		label: 'Úroveň 6',
		content: [
			[
				{
					incorrectSyllable: 'q',
					syllables: ['qqqqqqq', 'do', 'qqqqqqqqqq', 'ce', 'qqqqqqqq', 'la', 'qqqqqqqqq']
				}
			],
			[
				{
					incorrectSyllable: 'o',
					syllables: ['oooooooo', 'mi', 'ooooooooooo', 'ze', 'ooooo', 'ra', 'ooooooooooo']
				}
			],
			[
				{
					incorrectSyllable: 'd',
					syllables: ['ddddddd', 'ko', 'ddddddddddd', 'ru', 'ddddddddddd', 'na', 'dddddd']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
			shouldReadCorrectSyllable: false,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0,
			markWantedSyllables: true
		}
	},
	{
		level: 'seven',
		label: 'Úroveň 7',
		content: [
			[
				{
					incorrectSyllable: 'p',
					syllables: ['ppppppp', 'ta', 'ppppppppppppp', 'bu', 'pppppppp', 'le', 'ppppppp']
				}
			],
			[
				{
					incorrectSyllable: 'a',
					syllables: ['aaaaaaaaa', 'po', 'aaaaaaaaa', 'li', 'aaaaaaaa', 'ce', 'aaaaaaaaa']
				}
			],
			[
				{
					incorrectSyllable: 'v',
					syllables: ['vvvvvvv', 'ja', 'vvvvvvvvvvv', 'ho', 'vvvvvvvvvv', 'da', 'vvvvvv']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
			shouldReadCorrectSyllable: false,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'eight',
		label: 'Úroveň 8',
		content: [
			[
				{
					incorrectSyllable: 'p',
					binding: {
						3: 0,
						1: 1,
						5: 2
					},
					syllables: ['ppppppp', 'bu', 'ppppppppppppp', 'ta', 'pppppppp', 'le', 'ppppppp']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
			shouldReadCorrectSyllable: false,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0
		}
	}
];
