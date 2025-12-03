import type { TrackTaskData } from '$lib/types/task.types';

export const slabikyTestData: TrackTaskData = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				sequence: ['po', 'pe', 'ba', 'du', 'pa', 'do', 'be'],
				correct: ['do'],
				wordToRead: 'DO',
			}
		],
		content: [
			{
				sequence: ['sa', 'su', 'sa', 'as', 'so', 'za', 'sa', 'si', 'su', 'ca', 'sa', 'so', 'ze', 'se', 'sa'],
				correct: ['se'],
				wordToRead: 'SE',
			},
			{
				sequence: ['bo', 'op', 'po', 'pe', 'do', 'pa', 'po', 'bo', 'pu', 'po', 'do', 'po', 'po', 'pi', 'po'],
				correct: ['po'],
				wordToRead: 'PO',
			},
			{
				sequence: ['je', 'je', 'ja', 'ju', 'ja', 'ja', 'je', 'ja', 'jo', 'ja', 'ju', 'ja', 'ja', 'ja', 'ja'],
				correct: ['ja'],
				wordToRead: 'JA',
			},
			{
				sequence: [
					['ci', 'ic', 'ci', 'ce', 'ca', 'co', 'ci'],
					['ca', 'ci', 'ic', 'ci', 'ce', 'cu', 'ce'],
					['ci', 'co', 'ca', 'ci', 'ce', 'ci', 'ci'],
					['cu', 'ci', 'ic', 'ci', 'ca', 'ce', 'ci']
				],
				correct: ['ci'],
				wordToRead: 'CI',
			},
			{
				sequence: [
					['ku', 'uk', 'hu', 'ku', 'kn', 'ku', 'ku'],
					['ka', 'hu', 'ku', 'lu', 'tu', 'ku', 'uk'],
					['hu', 'ku', 'ku', 'ku', 'ka', 'ku', 'ku'],
					['ku', 'lu', 'ka', 'ku', 'hu', 'ku', 'ak']
				],
				correct: ['ku'],
				wordToRead: 'KU'
			},
			{
				sequence: ['hůl', 'kůl', 'hlů', 'hůl', 'nůl', 'húl', 'tůl', 'lůh', 'hůl', 'hul', 'luh', 'hól'],
				correct: ['hůl'],
				wordToRead: 'HŮL'
			},
			{
				sequence: ['koš', 'kus', 'kos', 'kso', 'kos', 'sok', 'kos', 'kas', 'kos', 'kos', 'hos', 'koš', 'kos', 'sok', 'šok'],
				correct: ['kos'],
				wordToRead: 'KOS'
			},
			{
				sequence: ['nám', 'nám', 'mán', 'nám', 'nam', 'ném', 'nem', 'nán', 'mná', 'ném', 'nám', 'máu', 'ním', 'míň', 'nám'],
				correct: ['nám'],
				wordToRead: 'NÁM'
			},
			{
				sequence: [
					['vír', 'rýv', 'výr', 'vir', 'vrý', 'vír', 'výr'],
					['vyr', 'výz', 'výr', 'vzý', 'výr', 'zvý', 'vír'],
					['viz', 'výr', 'vrý', 'výr', 'vír', 'výr', 'vří'],
					['výr', 'vír', 'rýv', 'výr', 'vír', 'výr', 'výr']
				],
				correct: ['výr'],
				wordToRead: 'VÝR'
			},
			{
				sequence: [
					['cor', 'car', 'rac', 'cer', 'rec', 'car', 'cac'],
					['sar', 'ras', 'čar', 'rač', 'car', 'car', 'čer'],
					['cra', 'car', 'car', 'cac', 'rac', 'car', 'ras'],
					['cer', 'sar', 'car', 'cra', 'car', 'čar', 'rec']
				],
				correct: ['car'],
				wordToRead: 'CAR'
			}
		]
	},
	{
		levelID: 'level2',
		label: 'Úroveň 2',
		practiceContent: [
			{
				sequence: ['po', 'pe', 'ba', 'du', 'pa', 'do', 'be'],
				correct: ['do'],
				wordToRead: 'DO',
			}
		],
		content: [
			{
				sequence: ['nr', 'vr', 'vř', 'rv', 'vr', 'br', 'ir', 'vr', 'vl', 'ru', 'pr', 'vr'],
				correct: ['vr'],
				wordToRead: 'VR',
			},
			{
				sequence: ['tl', 'tr', 'lr', 'tř', 'kr', 'tř', 'tr', 'jr', 'tl', 'hr', 'tr', 'lr', 'kr', 'tr', 'tř'],
				correct: ['tr'],
				wordToRead: 'TR',
			},
			{
				sequence: ['nr', 'ml', 'mr', 'mv', 'mi', 'rm', 'mr', 'ur', 'nr', 'rn', 'jm', 'mr', 'nr', 'mv', 'rm'],
				correct: ['mr'],
				wordToRead: 'MR',
			},
			{
				sequence: [
					['rh', 'hr', 'hr', 'nr', 'hl', 'kr', 'rh'],
					['tr', 'lr', 'fr', 'hr', 'rh', 'rt', 'mr'],
					['hl', 'hr', 'pr', 'hr', 'rh', 'hr', 'hr'],
					['ht', 'rl', 'fr', 'hr', 'hr', 'tr', 'rh']
				],
				correct: ['hr'],
				wordToRead: 'HR',
			},
			{
				sequence: [
					['dr', 'rb', 'br', 'pr', 'br', 'bř', 'rd', 'bl'],
					['bu', 'rd', 'br', 'pr', 'rb', 'př', 'br', 'br'],
					['br', 'dr', 'rb', 'br', 'pr', 'br', 'br', 'rb'],
					['rb', 'br', 'pr', 'br', 'dr', 'br', 'rb', 'br']
				],
				correct: ['br'],
				wordToRead: 'BR',
			},
			{
				sequence: ['srod', 'zrod', 'zrob', 'zdor', 'zrod', 'zdro', 'zrop', 'zrad', 'zrod', 'srod', 'zrop', 'zrob'],
				correct: ['zrod'],
				wordToRead: 'ZROD'
			},
			{
				sequence: ['plys', 'plyš', 'slyš', 'blyš', 'plyš', 'pylš', 'šlyp', 'dlyž', 'plys', 'blyž', 'plyš', 'blyš', 'plyš', 'plys', 'slyš'],
				correct: ['plyš'],
				wordToRead: 'PLYŠ'
			},
			{
				sequence: ['drám', 'hrám', 'krám', 'trám', 'krám', 'krán', 'hrán', 'krém', 'hrém', 'krán', 'hrán', 'krám', 'krám', 'trám', 'vrám'],
				correct: ['krám'],
				wordToRead: 'KRÁM'
			},
			{
				sequence: [
					['aram','gram', 'gran', 'fram', 'grem', 'grem', 'gram'],
					['garm', 'gram', 'garm', 'gern', 'fram', 'gran', 'gram'],
					['tran', 'gram', 'gram', 'grem', 'fram', 'garm', 'eram'],
					['gram', 'gern', 'fram', 'tran', 'garm', 'gram', 'gran']
				],
				correct: ['gram'],
				wordToRead: 'GRAM'
			},
			{
				sequence: [
					['chlup', 'clup', 'chlub', 'clud', 'chlup', 'pluh', 'chulp', 'chulp'],
					['chlup', 'chlub', 'bluch', 'chlap', 'chlud', 'chlup', 'pluh', 'bluh'],
					['chlap', 'bluh', 'chlup', 'chulp', 'chlub', 'chlup', 'clud', 'chlub'],
					['chlub', 'chlup', 'pluh', 'bluch', 'chulp', 'chlud', 'chlup', 'chlap']
				],
				correct: ['chlup'],
				wordToRead: 'CHLUP'
			}
		]
	}
];
