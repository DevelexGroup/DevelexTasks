import { describe, expect, it } from 'vitest';
import type { PostProcessorParameter } from '$lib/api/test-sessions';
import { draftFromDefaults, resolveParameters } from './parameters';

function parameter(overrides: Partial<PostProcessorParameter>): PostProcessorParameter {
	return {
		key: 'key',
		type: 'NUMBER',
		label: 'Key',
		description: null,
		defaultValue: null,
		required: true,
		min: null,
		max: null,
		options: null,
		...overrides
	};
}

const parameters: PostProcessorParameter[] = [
	parameter({ key: 'xres', defaultValue: 1920, min: 1 }),
	parameter({ key: 'freq', defaultValue: 0, min: 0 }),
	parameter({
		key: 'eyes',
		type: 'SELECT',
		defaultValue: 'both',
		options: [
			{ value: 'both', label: 'Obě' },
			{ value: 'average', label: 'Průměr' }
		]
	}),
	parameter({ key: 'scrWidthCm', required: false, min: 0 }),
	parameter({ key: 'count', type: 'INTEGER', defaultValue: 2, min: 0, max: 10 }),
	parameter({ key: 'verbose', type: 'BOOLEAN', defaultValue: false }),
	parameter({ key: 'note', type: 'STRING', required: false })
];

describe('draftFromDefaults', () => {
	it('stringifies defaults and leaves optional parameters empty', () => {
		expect(draftFromDefaults(parameters)).toEqual({
			xres: '1920',
			freq: '0',
			eyes: 'both',
			scrWidthCm: '',
			count: '2',
			verbose: 'false',
			note: ''
		});
	});
});

describe('resolveParameters', () => {
	it('resolves defaults without errors and omits empty optional values', () => {
		const { values, errors } = resolveParameters(parameters, draftFromDefaults(parameters));
		expect(errors).toEqual({});
		expect(values).toEqual({ xres: 1920, freq: 0, eyes: 'both', count: 2, verbose: false });
	});

	it('parses typed values including decimal commas', () => {
		const draft = {
			...draftFromDefaults(parameters),
			xres: '1280',
			scrWidthCm: '53,13',
			verbose: 'true',
			note: ' hi '
		};
		const { values, errors } = resolveParameters(parameters, draft);
		expect(errors).toEqual({});
		expect(values).toMatchObject({ xres: 1280, scrWidthCm: 53.13, verbose: true, note: 'hi' });
	});

	it('reports missing required, out-of-range, non-integer and unknown select values', () => {
		const draft = {
			...draftFromDefaults(parameters),
			xres: '',
			freq: '-1',
			eyes: 'left',
			count: '2.5'
		};
		const { values, errors } = resolveParameters(parameters, draft);
		expect(errors).toEqual({
			xres: 'Povinný údaj',
			freq: 'Nejméně 0',
			eyes: 'Neplatná volba',
			count: 'Zadejte celé číslo'
		});
		expect(values).toEqual({ verbose: false });
	});

	it('rejects values above max and non-numeric input', () => {
		const draft = { ...draftFromDefaults(parameters), count: '11', xres: 'abc' };
		const { errors } = resolveParameters(parameters, draft);
		expect(errors.count).toBe('Nejvýše 10');
		expect(errors.xres).toBe('Zadejte číslo');
	});
});
