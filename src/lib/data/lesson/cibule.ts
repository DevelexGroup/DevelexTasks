import type { LessonConfigMap } from '$lib/types/lesson';

const globalGap = 0;

export const cibuleLessons: LessonConfigMap['cibule']['data'][] = [
	{
		instructionAudioPath: '/sound/tasks/instructions/cibule/level1.m4a',
		level: 'one',
		label: 'Úroveň 1',
		content: [
			[
				{
					correctSyllable: 'a',
					wordToRead: 'A',
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
					wordToRead: 'T',
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
					wordToRead: 'P',
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
					wordToRead: 'C',
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
		instructionAudioPath: '/sound/tasks/instructions/cibule/level2.m4a',
		level: 'two',
		label: 'Úroveň 2',
		content: [
			[
				{
					correctSyllable: 'k',
					wordToRead: 'K',
					syllables: ['k']
				}
			],
			[
				{
					correctSyllable: 'k',
					wordToRead: 'K',
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
					wordToRead: 'V',
					syllables: ['v']
				}
			],
			[
				{
					correctSyllable: 'v',
					wordToRead: 'V',
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
					wordToRead: 'M',
					syllables: ['m']
				}
			],
			[
				{
					correctSyllable: 'm',
					wordToRead: 'M',
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
					wordToRead: 'D',
					syllables: ['d']
				}
			],
			[
				{
					correctSyllable: 'd',
					wordToRead: 'D',
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
		instructionAudioPath: '/sound/tasks/instructions/cibule/level3.m4a',
		level: 'three',
		label: 'Úroveň 3',
		content: [
			[
				{
					correctSyllable: 'da',
					wordToRead: 'DA',
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
					wordToRead: 'LO',
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
		instructionAudioPath: '/sound/tasks/instructions/cibule/level4.m4a',
		level: 'four',
		label: 'Úroveň 4',
		content: [
			[
				{
					correctSyllable: 'pe',
					wordToRead: 'PE',
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
					wordToRead: 'MA',
					syllables: ['ma']
				}
			],
			[
				{
					correctSyllable: 'ma',
					wordToRead: 'MA',
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
		instructionAudioPath: '/sound/tasks/instructions/cibule/level5.m4a',
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
		instructionAudioPath: '/sound/tasks/instructions/cibule/level6.m4a',
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
		instructionAudioPath: '/sound/tasks/instructions/cibule/level7.m4a',
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
		instructionAudioPath: '/sound/tasks/instructions/cibule/level8.m4a',
		level: 'eight',
		label: 'Úroveň 8',
		content: [
			[
				{
					incorrectSyllable: 'k',
					binding: {
						5: 0,
						3: 1,
						1: 2
					},
					syllables: ['kkkkkkk', 'ta', 'kkkkkkkkkkk', 'pa', 'kkkkkkkkkk', 'lo', 'kkkkkk']
				}
			],
			[
				{
					incorrectSyllable: 'p',
					binding: {
						3: 0,
						1: 1,
						5: 2
					},
					syllables: ['ppppppp', 'li', 'pppppppppp', 'ma', 'pppppppppp', 'na', 'pppppp']
				}
			],
			[
				{
					incorrectSyllable: 'c',
					binding: {
						1: 0,
						5: 1,
						3: 2
					},
					syllables: ['ccccccc', 'no', 'ccccccccccc', 'ny', 'cccccccccc', 'vi', 'cccccc']
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
