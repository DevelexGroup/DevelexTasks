import type { LessonConfigMap } from '$lib/types/lesson';

const globalGap = 0;

export const fonologicLesson: LessonConfigMap['fonologic']['data'][] = [
	{
		level: 'one',
		label: 'Úroveň 1',
		content: [
			[
				{
					correctSyllable: 'D',
					correctIndexes: [0, 2, 3],
					syllables: ['ghost', 'cat', 'sink', 'house']
				}
			],
			[
				{
					correctSyllable: 'A',
					correctIndexes: [2, 3],
					syllables: ['mys', 'tree', 'coconut', 'shark']
				}
			],
			[
				{
					correctSyllable: 'B',
					correctIndexes: [1, 2],
					syllables: ['monkey', 'screwdriver', 'frog', 'eye']
				}
			],
			[
				{
					correctSyllable: 'O',
					correctIndexes: [1, 2, 3],
					syllables: ['sun', 'lamb', 'scythe', 'elephant']
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
					correctSyllable: 'K',
					correctIndexes: [2, 3],
					syllables: ['ghost', 'cowboy', 'cat', 'sink', 'house']
				}
			],
			[
				{
					correctSyllable: 'L',
					correctIndexes: [3, 4],
					syllables: ['mys', 'cake', 'tree', 'fence', 'shark']
				}
			],
			[
				{
					correctSyllable: 'O',
					correctIndexes: [0, 2, 4],
					syllables: ['monkey', 'music', 'screwdriver', 'frog', 'eye']
				}
			],
			[
				{
					correctSyllable: 'A',
					correctIndexes: [1, 3],
					syllables: ['sun', 'goat', 'lamb', 'scythe', 'elephant']
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
					correctSyllable: 'KO',
					correctIndexes: [0, 1, 3],
					syllables: ['bicycle', 'scythe', 'penguin', 'cat']
				}
			],
			[
				{
					correctSyllable: 'JE',
					correctIndexes: [0, 2],
					syllables: ['santa', 'apple', 'needle', 'car']
				}
			],
			[
				{
					correctSyllable: 'BO',
					correctIndexes: [0, 1],
					syllables: ['shoe', 'screwdriver', 'frog', 'eye']
				}
			],
			[
				{
					correctSyllable: 'VA',
					correctIndexes: [0, 1],
					syllables: ['cow', 'grass', 'screwdriver', 'zebra']
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
		level: 'four',
		label: 'Úroveň 4',
		content: [
			[
				{
					correctSyllable: 'KO',
					correctIndexes: [1, 2],
					syllables: ['ghost', 'cowboy', 'cat', 'sink', 'house']
				}
			],
			[
				{
					correctSyllable: 'LE',
					correctIndexes: [0, 2],
					syllables: ['glasses', 'grandma', 'airplane', 'shark', 'leg']
				}
			],
			[
				{
					correctSyllable: 'CE',
					correctIndexes: [0, 1, 4],
					syllables: ['colander', 'monkey', 'screwdriver', 'frog', 'heart']
				}
			],
			[
				{
					correctSyllable: 'ZÁ',
					correctIndexes: [0, 2, 4],
					syllables: ['backpain', 'goat', 'pencilsharpener', 'scythe', 'toilet']
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
		level: 'five',
		label: 'Úroveň 5',
		content: [
			[
				{
					correctImage: 'ghost',
					correctIndexes: [2],
					syllables: ['cat', 'penguin', 'house']
				}
			],
			[
				{
					correctImage: 'mys',
					correctIndexes: [0, 2],
					syllables: ['cloud', 'car', 'goldengate']
				}
			],
			[
				{
					correctImage: 'monkey',
					correctIndexes: [2],
					syllables: ['screwdriver', 'frog', 'eye']
				}
			],
			[
				{
					correctImage: 'sun',
					correctIndexes: [1, 2],
					syllables: ['lamb', 'tree', 'elephant']
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
		level: 'six',
		label: 'Úroveň 6',
		content: [
			[
				{
					correctIndexes: [0],
					syllables: ['santa']
				}
			],
			[
				{
					correctIndexes: [1, 2, 4],
					syllables: ['bear', 'strawberry', 'needle', 'ruler', 'apple']
				}
			],
			[
				{
					correctIndexes: [0],
					syllables: ['coconut']
				}
			],
			[
				{
					correctIndexes: [0, 2, 3],
					syllables: ['dog', 'strawberry', 'fence', 'ruler', 'apple']
				}
			],
			[
				{
					correctIndexes: [0],
					syllables: ['ear']
				}
			],
			[
				{
					correctIndexes: [1],
					syllables: ['monkey', 'sink', 'lamb', 'cat', 'apple']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 8,
			shouldReadCorrectSyllable: false,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'seven',
		label: 'Úroveň 7',
		content: [
			[
				{
					correctImage: 'cake',
					correctIndexes: [1],
					syllables: ['cat', 'penguin', 'house']
				}
			],
			[
				{
					correctImage: 'house',
					correctIndexes: [0, 2],
					syllables: ['cloud', 'car', 'goldengate']
				}
			],
			[
				{
					correctImage: 'car',
					correctIndexes: [2],
					syllables: ['screwdriver', 'frog', 'eye']
				}
			],
			[
				{
					correctImage: 'elephant',
					correctIndexes: [1, 2],
					syllables: ['nose', 'tree', 'scissors']
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
		level: 'eight',
		label: 'Úroveň 8',
		content: [
			[
				{
					correctIndexes: [0],
					syllables: ['cowboy']
				}
			],
			[
				{
					correctIndexes: [1, 2, 4],
					syllables: ['bear', 'strawberry', 'needle', 'ruler', 'apple']
				}
			],
			[
				{
					correctIndexes: [0],
					syllables: ['spear']
				}
			],
			[
				{
					correctIndexes: [0, 2, 3],
					syllables: ['dog', 'strawberry', 'fence', 'ruler', 'apple']
				}
			],
			[
				{
					correctIndexes: [0],
					syllables: ['ear']
				}
			],
			[
				{
					correctIndexes: [0, 2],
					syllables: ['monkey', 'sink', 'lamb', 'cat', 'apple']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 8,
			shouldReadCorrectSyllable: false,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'nine',
		label: 'Úroveň 9',
		content: [
			[
				{
					wordToRead: 'Ve slově pes vyměň P za L.',
					correctImage: 'dog',
					correctIndexes: [0, 1],
					syllables: ['sob', 'forest', 'house']
				}
			],
			[
				{
					wordToRead: 'Ve slově mrak vyměň M za D.',
					correctImage: 'cloud',
					correctIndexes: [2],
					syllables: ['wreck', 'goldengate', 'dragon']
				}
			],
			[
				{
					wordToRead: 'Ve slově žába vyměň Ž za B.',
					correctImage: 'frog',
					correctIndexes: [0],
					syllables: ['grandma', 'backpain', 'pour']
				}
			],
			[
				{
					wordToRead: 'Ve slově strom vyměň M za J.',
					correctImage: 'elephant',
					correctIndexes: [1],
					syllables: ['elephant', 'sew', 'ceiling']
				}
			],
			[
				{
					wordToRead: 'Ve slově lev vyměň V za D.',
					correctImage: 'bear',
					correctIndexes: [0],
					syllables: ['ice', 'nose', 'forest']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 8,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'ten',
		label: 'Úroveň 10',
		content: [
			[
				{
					wordToRead: 'Ve slově bota vyměň BO za NO.',
					correctImage: 'shoe',
					correctIndexes: [1],
					syllables: ['music', 'leg', 'devilhorns']
				}
			],
			[
				{
					wordToRead: 'Ve slově koza vyměň ZA za SA.',
					correctImage: 'goat',
					correctIndexes: [2],
					syllables: ['bicycle', 'drip', 'scythe']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 8,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0
		}
	}
];
