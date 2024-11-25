import type { LessonConfigMap } from '$lib/types/lesson';

export const syllableLessons: LessonConfigMap['syllable']['data'][] = [
	{
		level: 'zero',
		content: [
			[
				{
					correctSyllable: 'do',
					syllables: ['po', 'pe', 'ba', 'du', 'pa', 'do', 'be']
				}
			],
			[
				{
					correctSyllable: 'se',
					syllables: [
						'sa',
						'su',
						'sa',
						'as',
						'so',
						'za',
						'sa',
						'si',
						'su',
						'ca',
						'sa',
						'so',
						'ze',
						'se',
						'sa'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 20,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'one',
		content: [
			[
				{
					correctSyllable: 'po',
					syllables: [
						'bo',
						'op',
						'po',
						'pe',
						'do',
						'pa',
						'po',
						'bo',
						'pu',
						'po',
						'do',
						'po',
						'po',
						'pi',
						'po'
					]
				},
				{
					correctSyllable: 'ja',
					syllables: [
						'je',
						'je',
						'jé',
						'ej',
						'je',
						'je',
						'je',
						'ji',
						'jo',
						'je',
						'ye',
						'ja',
						'je',
						'ju',
						'je'
					]
				},
				{
					correctSyllable: 'ci',
					syllables: [
						'ci',
						'ic',
						'ci',
						'ce',
						'ca',
						'co',
						'ci',
						'ca',
						'ci',
						'ic',
						'ci',
						'ce',
						'cu',
						'ce',
						'ci'
					]
				},
				{
					correctSyllable: 'ku',
					syllables: [
						'ku',
						'uk',
						'hu',
						'ku',
						'kn',
						'ku',
						'ku',
						'ka',
						'hu',
						'ku',
						'lu',
						'tu',
						'ku',
						'uk',
						'hu'
					]
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
		partialProps: {
			assignmentGap: 200,
			syllableGap: 20,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'two',
		content: [
			[
				{
					correctSyllable: 'hůl',
					syllables: [
						'hůl',
						'kůl',
						'hlů',
						'hůl',
						'nůl',
						'húl',
						'tůl',
						'lůh',
						'hůl',
						'hul',
						'luh',
						'hól'
					]
				}
			],
			[
				{
					correctSyllable: 'ma',
					syllables: ['ma', 'ma', 'so']
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 20,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'three',
		content: [
			[
				{
					correctSyllable: 'plyš',
					syllables: [
						'plys',
						'plyš',
						'slyš',
						'blyš',
						'plyš',
						'pylš',
						'šlyp',
						'dlyž',
						'plys',
						'blyž',
						'plyš',
						'blyš',
						'plyš',
						'plys',
						'slyš'
					]
				},
				{
					correctSyllable: 'krám',
					syllables: [
						'drám',
						'hrám',
						'krám',
						'trám',
						'krám',
						'krán',
						'hrán',
						'krém',
						'hrém',
						'krán',
						'hrán',
						'krám',
						'krám',
						'trám',
						'vrám'
					]
				},
				{
					correctSyllable: 'gram',
					syllables: [
						'aram',
						'gram',
						'gran',
						'fram',
						'grem',
						'grem',
						'gram',
						'garm',
						'gram',
						'garm',
						'gern',
						'fram',
						'gran',
						'gram',
						'tran'
					]
				},
				{
					correctSyllable: 'chlup',
					syllables: [
						'chlup',
						'clup',
						'chlub',
						'clud',
						'chlup',
						'pluh',
						'chulp',
						'chulp',
						'chlup',
						'chlub',
						'bluch',
						'chlap',
						'chlud',
						'chlup',
						'pluh',
						'bluh'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 20,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: true,
			correctSyllableVisibilityTimeout: 0
		}
	},
	{
		level: 'four',
		content: [
			[
				{
					correctSyllable: 'plyš',
					syllables: [
						'plys',
						'plyš',
						'slyš',
						'blyš',
						'plyš',
						'pylš',
						'šlyp',
						'dlyž',
						'plys',
						'blyž',
						'plyš',
						'blyš',
						'plyš',
						'plys',
						'slyš'
					]
				},
				{
					correctSyllable: 'krám',
					syllables: [
						'drám',
						'hrám',
						'krám',
						'trám',
						'krám',
						'krán',
						'hrán',
						'krém',
						'hrém',
						'krán',
						'hrán',
						'krám',
						'krám',
						'trám',
						'vrám'
					]
				},
				{
					correctSyllable: 'gram',
					syllables: [
						'aram',
						'gram',
						'gran',
						'fram',
						'grem',
						'grem',
						'gram',
						'garm',
						'gram',
						'garm',
						'gern',
						'fram',
						'gran',
						'gram',
						'tran'
					]
				},
				{
					correctSyllable: 'chlup',
					syllables: [
						'chlup',
						'clup',
						'chlub',
						'clud',
						'chlup',
						'pluh',
						'chulp',
						'chulp',
						'chlup',
						'chlub',
						'bluch',
						'chlap',
						'chlud',
						'chlup',
						'pluh',
						'bluh'
					]
				}
			]
		],
		partialProps: {
			assignmentGap: 200,
			syllableGap: 20,
			shouldReadCorrectSyllable: true,
			isSyllableAssignmentPresent: false,
			correctSyllableVisibilityTimeout: 0
		}
	}
] as const;
