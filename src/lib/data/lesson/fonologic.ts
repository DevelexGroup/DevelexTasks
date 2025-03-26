import type { LessonConfigMap } from '$lib/types/lesson';

const globalGap = 50;

export const fonologicLesson: LessonConfigMap['fonologic']['data'][] = [
	{
		level: 'one',
		label: 'Úroveň 1',
		content: [
			[
				{
					correctSyllable: 'D',
					correctIndexes: [0, 2, 3],
					syllables: ['delfín', 'kočka', 'umyvadlo', 'dům']
				}
			],
			[
				{
					correctSyllable: 'A',
					correctIndexes: [2, 3],
					syllables: ['myš', 'smrk', 'hruška', 'žralok']
				}
			],
			[
				{
					correctSyllable: 'B',
					correctIndexes: [1, 2],
					syllables: ['šimpanz', 'šroubovák', 'žába', 'oko']
				}
			],
			[
				{
					correctSyllable: 'O',
					correctIndexes: [1, 2, 3],
					syllables: ['slunce', 'ovce', 'bomba', 'slon']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
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
					wordToRead: 'K',
					correctIndexes: [1, 2],
					syllables: ['duch', 'klaun', 'kůň', 'banán', 'nůž']
				}
			],
			[
				{
					correctSyllable: 'L',
					wordToRead: 'L',
					correctIndexes: [3, 4],
					syllables: ['čáp', 'dárek', 'kotva', 'plot', 'žalud']
				}
			],
			[
				{
					correctSyllable: 'O',
					wordToRead: 'O',
					correctIndexes: [0, 1, 2, 4],
					syllables: ['citron', 'obraz', 'noha', 'třešeň', 'pavouk']
				}
			],
			[
				{
					correctSyllable: 'A',
					wordToRead: 'A',
					correctIndexes: [1, 3, 4],
					syllables: ['míč', 'koza', 'citron', 'kostka', 'květ']
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
					correctSyllable: 'KO',
					correctIndexes: [0, 1, 3],
					syllables: ['kolo', 'kost', 'tučňák', 'kočka']
				}
			],
			[
				{
					correctSyllable: 'JE',
					correctIndexes: [0, 2],
					syllables: ['jelen', 'jablko', 'jehla', 'auto']
				}
			],
			[
				{
					correctSyllable: 'BO',
					correctIndexes: [0, 1],
					syllables: ['bota', 'chobotnice', 'liška', 'dlaň']
				}
			],
			[
				{
					correctSyllable: 'VA',
					correctIndexes: [0, 1],
					syllables: ['kráva', 'tramvaj', 'vážka', 'zebra']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
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
					wordToRead: 'KO',
					correctIndexes: [1, 2],
					syllables: ['víla', 'koruna', 'klubko', 'tygr', 'guma']
				}
			],
			[
				{
					correctSyllable: 'LE',
					wordToRead: 'LE',
					correctIndexes: [0, 2],
					syllables: ['brýle', 'mrkev', 'letadlo', 'motýl', 'ryba']
				}
			],
			[
				{
					correctSyllable: 'CE',
					wordToRead: 'CE',
					correctIndexes: [0, 1, 4],
					syllables: ['slepice', 'mince', 'prase', 'list', 'srdce']
				}
			],
			[
				{
					correctSyllable: 'ZÁ',
					wordToRead: 'ZÁ',
					correctIndexes: [0, 2, 4],
					syllables: ['záda', 'vějíř', 'zámek', 'květák', 'zásuvka']
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
					correctImage: 'sýr',
					correctIndexes: [2],
					syllables: ['diamant', 'brokolice', 'skateboard']
				}
			],
			[
				{
					correctImage: 'mlýn',
					correctIndexes: [0, 2],
					syllables: ['mrak', 'svíčka', 'meloun']
				}
			],
			[
				{
					correctImage: 'veverka',
					correctIndexes: [2],
					syllables: ['astronaut', 'rty', 'volant']
				}
			],
			[
				{
					correctImage: 'kaktus',
					correctIndexes: [1, 2],
					syllables: ['medaile', 'klokan', 'kabát']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
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
					syllables: ['jelen']
				}
			],
			[
				{
					correctIndexes: [1, 2, 4],
					syllables: ['dýně', 'ještěrka', 'jizva', 'telefon', 'ježek']
				}
			],
			[
				{
					correctIndexes: [0],
					syllables: ['planeta']
				}
			],
			[
				{
					correctIndexes: [0, 1, 3],
					syllables: ['pes', 'pila', 'jahoda', 'pravítkp', 'rajče']
				}
			],
			[
				{
					correctIndexes: [0],
					syllables: ['královna']
				}
			],
			[
				{
					correctIndexes: [1],
					syllables: ['chata', 'krabice', 'hrnek', 'had', 'hadice']
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
		level: 'seven',
		label: 'Úroveň 7',
		content: [
			[
				{
					correctImage: 'prsten',
					correctIndexes: [1],
					syllables: ['holub', 'náklaďák', 'bonbon']
				}
			],
			[
				{
					correctImage: 'deštník',
					correctIndexes: [0, 2],
					syllables: ['kytara', 'chameleon', 'konev']
				}
			],
			[
				{
					correctImage: 'kokos',
					correctIndexes: [2],
					syllables: ['pírko', 'dinosaurus', 'slunečnice']
				}
			],
			[
				{
					correctImage: 'krocan',
					correctIndexes: [0, 2],
					syllables: ['nos', 'župan', 'nůžky']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: globalGap,
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
					syllables: ['kovboj']
				}
			],
			[
				{
					correctIndexes: [1, 3, 4],
					syllables: ['medvěd', 'jahoda', 'kytka', 'jazyk', 'jaguár']
				}
			],
			[
				{
					correctIndexes: [0],
					syllables: ['oštěp']
				}
			],
			[
				{
					correctIndexes: [0, 2, 3],
					syllables: ['puzzle', 'dudlík', 'paprika', 'poklad', 'žárovka']
				}
			],
			[
				{
					correctIndexes: [0],
					syllables: ['ucho']
				}
			],
			[
				{
					correctIndexes: [0, 2],
					syllables: ['obličej', 'zrcadlo', 'ovoce', 'batoh', 'sova']
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
		level: 'nine',
		label: 'Úroveň 9',
		content: [
			[
				{
					wordToRead: 'pes_les',
					correctImage: 'pes',
					correctIndexes: [1],
					syllables: ['luk', 'les', 'nos']
				}
			],
			[
				{
					wordToRead: 'mrak_drak',
					correctImage: 'mrak',
					correctIndexes: [2],
					syllables: ['pařát', 'mostík', 'drak']
				}
			],
			[
				{
					wordToRead: 'darek_parek',
					correctImage: 'dárek',
					correctIndexes: [0],
					syllables: ['párek', 'lilek', 'šála']
				}
			],
			[
				{
					wordToRead: 'vesta_vesta',
					correctImage: 'cesta',
					correctIndexes: [1],
					syllables: ['cela', 'vesta', 'vejce']
				}
			],
			[
				{
					wordToRead: 'lev_led',
					correctImage: 'lev',
					correctIndexes: [0],
					syllables: ['led', 'pilulka', 'les']
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
		level: 'ten',
		label: 'Úroveň 10',
		content: [
			[
				{
					wordToRead: 'hrnec_kanec',
					correctImage: 'hrnec',
					correctIndexes: [0],
					syllables: ['divočák', 'palec', 'tanečník']
				}
			],
			[
				{
					wordToRead: 'vaha_vaza',
					correctImage: 'váha',
					correctIndexes: [2],
					syllables: ['záda', 'vana', 'váza']
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
	}
];
