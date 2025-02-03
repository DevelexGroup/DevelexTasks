import type { LessonConfigMap } from '$lib/types/lesson';

export const syllableLessons: LessonConfigMap['syllable']['data'][] = [
	{
		level: 'one',
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
			],
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
					correctSyllable: 'do',
					syllables: ['po', 'pe', 'ba', 'du', 'pa', 'do', 'be']
				}
			],
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
					correctSyllable: 'kos',
					syllables: [
						'koš',
						'kus',
						'kos',
						'kso',
						'kos',
						'sok',
						'kos',
						'kas',
						'kos',
						'kos',
						'hos',
						'koš',
						'kos',
						'sok',
						'šok'
					]
				},
				{
					correctSyllable: 'nám',
					syllables: [
						'nám',
						'nám',
						'mán',
						'nám',
						'nam',
						'ném',
						'nem',
						'nán',
						'mná',
						'ném',
						'nám',
						'máu',
						'ním',
						'míň',
						'nám'
					]
				},
				{
					correctSyllable: 'výr',
					syllables: [
						'vír',
						'rýv',
						'výr',
						'vir',
						'vrý',
						'vír',
						'výr',
						'vyr',
						'výz',
						'výr',
						'vzý',
						'výr',
						'zvý',
						'vír',
						'viz'
					]
				},
				{
					correctSyllable: 'car',
					syllables: [
						'cor',
						'car',
						'rac',
						'cer',
						'rec',
						'car',
						'cac',
						'sar',
						'ras',
						'čar',
						'rač',
						'car',
						'car',
						'čer',
						'cra'
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
		level: 'three',
		content: [
			[
				{
					correctSyllable: 'do',
					syllables: ['po', 'pe', 'ba', 'du', 'pa', 'do', 'be']
				}
			],
			[
				{
					correctSyllable: 'vr',
					syllables: ['nr', 'vr', 'vř', 'rv', 'vr', 'br', 'ir', 'vr', 'vl', 'ru', 'pr', 'vr']
				}
			],
			[
				{
					correctSyllable: 'tr',
					syllables: [
						'tl',
						'tr',
						'lr',
						'tř',
						'kr',
						'tř',
						'tr',
						'jr',
						'tl',
						'hr',
						'tr',
						'lr',
						'kr',
						'tr',
						'tř'
					]
				},
				{
					correctSyllable: 'mr',
					syllables: [
						'nr',
						'ml',
						'mr',
						'mv',
						'mi',
						'rm',
						'mr',
						'ur',
						'nr',
						'rn',
						'jm',
						'mr',
						'nr',
						'mv',
						'rm'
					]
				},
				{
					correctSyllable: 'hr',
					syllables: [
						'rh',
						'hr',
						'hr',
						'nr',
						'hl',
						'kr',
						'rh',
						'tr',
						'lr',
						'fr',
						'hr',
						'rh',
						'rt',
						'mr',
						'hl'
					]
				},
				{
					correctSyllable: 'br',
					syllables: [
						'dr',
						'rb',
						'br',
						'pr',
						'br',
						'bř',
						'rd',
						'bl',
						'bu',
						'rd',
						'br',
						'pr',
						'rb',
						'př',
						'br'
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
	},
	{
		level: 'four',
		content: [
			[
				{
					correctSyllable: 'do',
					syllables: ['po', 'pe', 'ba', 'du', 'pa', 'do', 'be']
				}
			],
			[
				{
					correctSyllable: 'zrod',
					syllables: [
						'srod',
						'zrod',
						'zrob',
						'zdor',
						'zrod',
						'zdro',
						'zrop',
						'zrad',
						'zrod',
						'srod',
						'zrop',
						'zrob'
					]
				}
			],
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
