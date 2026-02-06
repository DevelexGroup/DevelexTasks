import type { TaskMistake } from '$lib/types/task.types';

export const MistakeUnfinished: TaskMistake = {
	id: 'unfinished',
	details: 'Úloha ještě není dokončená. Zkus pokračovat.'
};

export const MistakeMisclick: TaskMistake = {
	id: 'misclick',
	details: 'Netrefil jsi správné písmeno. Zkus kliknout znovu.'
};

export const MistakeSkipped: TaskMistake = {
	id: 'skipped',
	details: 'Zde jsi nějaké písmeno nebo slabiku vynechal. Zkus se vrátit zpátky.'
};

export const MistakeWrongOrder: TaskMistake = {
	id: 'wrong-order',
	details:
		'V této úloze musíš vzorová písmena/slabiky zakliknout ve správném pořadí, tedy zleva doprava.'
};

export const MistakeWrongFocus: TaskMistake = {
	id: 'wrong-focus',
	details: 'V této úloze se musíš podívat na vzorové písmeno/slabiku a najít ho postupně v řadě'
};
