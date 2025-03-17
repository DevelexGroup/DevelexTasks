import type { LessonConfigMap } from '$lib/types/lesson';

const partOneWidth = 950;

export const meaningfulTextLessons: LessonConfigMap['meaningfulText']['data'][] = [
	{
		level: 'one',
		label: 'Úroveň 1',
		content: [
			[
				{
					words: [
						'Malý',
						'osmiletý',
						'chlapec',
						'Adam',
						'stál',
						'u',
						'okna',
						'a',
						'upřeně',
						'sledoval'
					],
					width: 600
				},
				{
					words: [
						'silnici',
						'vedoucí',
						'k',
						'jejich',
						'domu.',
						'Za',
						'chvíli',
						'by',
						'se',
						'mělo',
						'objevit'
					],
					width: 600
				},
				{
					words: ['tatínkovo', 'auto', 's', 'přívesem', 'na', 'koně.'],
					width: 400
				}
			],
			[
				{
					words: [
						'Malý',
						'Pepík',
						'raději',
						'četl',
						'doma',
						'knížky',
						'plné',
						'dobrodružství,',
						'než',
						'aby',
						'skotačil',
						's',
						'dětmi',
						'venku.'
					],
					width: partOneWidth
				},
				{
					words: [
						'Možná',
						'k',
						'tomu',
						'příspěla',
						'i',
						'nemocná',
						'noha,',
						'která',
						'mu',
						'mnohé',
						'neplechyy',
						'znemožňovala.',
						'Raději',
						'se'
					],
					width: partOneWidth
				},
				{
					words: [
						'proto',
						'ponořil',
						'do',
						'příběhů',
						'plných',
						'plížících',
						'se',
						'indiánů,',
						'odvážných',
						'zálesáků',
						'nebo',
						'zlotřilých'
					],
					width: partOneWidth
				},
				{
					words: [
						'pirátů.',
						'Občas',
						'smutně',
						'vyhlédl',
						'z',
						'okna',
						'na',
						'hrající',
						'si',
						'kamarády',
						'a',
						'sledoval',
						'zpovzdálí',
						'jejich'
					],
					width: partOneWidth
				},
				{
					words: [
						'rozpustilou',
						'hru.',
						'Jednoho',
						'dne,',
						'když',
						'se',
						'jako',
						'obvykle',
						'díval',
						'částečně',
						'ukrytý',
						'za',
						'záclonou,',
						'si'
					],
					width: partOneWidth
				},
				{
					words: [
						'uvědomil,',
						'že',
						'nějaký',
						'stín',
						'se',
						'jako',
						'blesk',
						'pohybuje',
						'po',
						'stromě',
						'nahoru',
						'a',
						'dolů.',
						'Malá',
						'hnědá',
						'a',
						'velice'
					],
					width: partOneWidth
				},
				{
					words: [
						'hbitá',
						'veverka',
						'šmejdila',
						'po',
						'stromě',
						'a',
						'hledala',
						'oříšky,',
						'které',
						'by',
						'si',
						'uschovala',
						'do',
						'tajné',
						'skrýše.'
					],
					width: partOneWidth
				}
			]
		],
		partialProps: {
			width: 1000
		}
	}
];
