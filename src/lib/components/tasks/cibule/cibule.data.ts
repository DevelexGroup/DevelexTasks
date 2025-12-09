import type { TrackTaskData } from '$lib/types/task.types';

export const cibuleTestData: TrackTaskData = [
	{
		levelID: "level1",
		label: 'Úroveň 1',
		practiceContent: [
			{
				sequence: [ 'ggggg', 'a', 'ggg', 'a', 'gggggggg', 'a', 'ggg', 'a', 'gg', 'a', 'gggggggg', 'a', 'gggg', 'a', 'gggg' ],
				correct: [ 'a' ],
				wordToRead: 'A'
			},
		],
		content: [
			{
				sequence: [ 'hhhhh', 't', 'hhh', 't', 'hhhhhhhh', 't', 'hhh', 't', 'hh', 't', 'hhhhhhh', 't', 'hhhh', 't', 'hhhh' ],
				correct: [ 't' ],
				wordToRead: 'T',
			},
			{
				sequence: [ 'bbbbb', 'p', 'bbbb', 'p', 'bbbbbbbb', 'p', 'bbbb', 'p', 'bb', 'p', 'bbbbbbbb', 'p', 'bbbb', 'p', 'bbbb' ],
				correct: [ 'p' ],
				wordToRead: 'P',
			},
			{
				sequence: [ 'oooo', 'da', 'ooo', 'da', 'oo', 'da', 'ooooooo', 'da', 'ooooooo', 'da', 'ooo' ],
				correct: [ 'da' ],
				wordToRead: 'DA'
			},
			{
				sequence: [ 'aaa', 'lo', 'aaaaaa', 'lo', 'aaaaa', 'lo', 'aa', 'lo', 'aaaa', 'lo', 'aaaaaaa', 'lo', 'aaa', 'lo', 'aaaaa' ],
				correct: [ 'lo' ],
				wordToRead: 'LO'
			}
		]
	},
	{
		levelID: "level2",
		label: 'Úroveň 2',
		practiceContent: [
			{
				correct: [ 'k' ],
				wordToRead: 'K',
				sequence: [ 'eeeee', 'k', 'eeeeeee', 'k', 'eeeeeeeeee', 'k', 'eeeee', 'k', 'eee', 'k', 'eeeeeee', 'k', 'eeeee' ]
			}
		],
		content: [
			{
				correct: [ 'v' ],
				wordToRead: 'V',
				sequence: [ 'hhhhh', 'v', 'hhhhhhh', 'v', 'hhhhhhhhhh', 'v', 'hhhhh', 'v', 'hhhh', 'v', 'hhhhhhhh', 'v', 'hhhhh' ]
			},
			{
				correct: [ 'm' ],
				wordToRead: 'M',
				sequence: [ 'nnnn', 'm', 'nnnnnnn', 'm', 'nnnnnnnnnn', 'm', 'nnnnn', 'm', 'nnnn', 'm', 'nnnnnnn', 'm', 'nnnnn'	]
			},
			{
				correct: [ 'pe' ],
				wordToRead: 'PE',
				sequence: [ 'aaaaaa', 'pe', 'aaaaaa', 'pe', 'aa', 'pe', 'aa', 'pe', 'aaaaa', 'pe', 'aaaaaaaaaa', 'pe', 'aaaaa', 'pe' ]
			},
			{
				correct: [ 'ma' ],
				wordToRead: 'MA',
				sequence: [ 'ma', 'iiiiiiiiii', 'ma', 'iiiiiiii', 'ma', 'iii', 'ma', 'ii', 'ma', 'iiiiiiiiiiiiii', 'ma', 'ii', 'ma', 'iiiiiiii' ]
			}
		]
	},
	{
		levelID: "level3a",
		label: 'Úroveň 3A',
		practiceContent: [
			{
				correct: [ 'v', 'o', 'd', 'a' ],
				wordToRead: 'GRAM',
				sequence: [ 'zzzzzz', 'v',	'zzzzzz', 'o', 'zzzzzzzzz', 'd', 'zzzzzzzzzzzzzz', 'a', 'zzzzzz' ]
			}
		],
		content: [
			{
				correct: [ 'z', 'i', 'm', 'a' ],
				wordToRead: 'GRAM',
				sequence: [ 'sssssssssssss', 'z', 'ssss', 'i', 'sssssssssssssssss', 'm', 'ssssssssss', 'a', 'ssssss' ]
			},
			{
				correct: [ 'c', 'i', 'b', 'u', 'l', 'e' ],
				wordToRead: 'GRAM',
				sequence: [ 'ppppppp', 'c', 'ppp', 'i', 'pppppp', 'b', 'pppppppp', 'u', 'ppp', 'l', 'pppp', 'e', 'ppppp' ]
			},
			{
				correct: [ 's', 'l', 'u', 'n', 'c', 'e' ],
				wordToRead: 'GRAM',
				sequence: [ 'ooooo', 's', 'oooo', 'l', 'ooooo', 'u', 'ooooooooo', 'n', 'ooo', 'c', 'ooooo', 'e', 'oooooooo' ]
			}
		]
	},
	{
		levelID: "level3b",
		label: 'Úroveň 3B',
		practiceContent: [
			{
				correct: [ 'lo', 'pa', 'ta' ],
				wordToRead: 'GRAM',
				sequence: ['kkkkkkk', 'ta', 'kkkkkkkkkkk', 'pa', 'kkkkkkkkkk', 'lo', 'kkkkkk']
			}
		],
		content: [
			{
				correct: [ 'ma', 'li', 'na'],
				wordToRead: 'GRAM',
				sequence: [ 'ppppppp', 'li', 'pppppppppp', 'ma', 'pppppppppp', 'na', 'pppppp' ]
			},
			{
				correct: [ 'no', 'vi', 'ny' ],
				wordToRead: 'GRAM',
				sequence: ['ccccccc', 'no', 'ccccccccccc', 'ny', 'cccccccccc', 'vi', 'cccccc']
			}
		]
	}
];
