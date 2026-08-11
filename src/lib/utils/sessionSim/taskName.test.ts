import { describe, expect, it } from 'vitest';
import { parseTaskName, registryLevelId } from './taskName';

describe('parseTaskName', () => {
	it('parses simple slug-level names', () => {
		expect(parseTaskName('cibule-1')).toEqual({ slug: 'cibule', level: '1', mode: 'reeducation' });
	});

	it('parses mode suffixes', () => {
		expect(parseTaskName('slabiky-2-evaluation')).toEqual({
			slug: 'slabiky',
			level: '2',
			mode: 'evaluation'
		});
		expect(parseTaskName('cibule-1-intervention')).toEqual({
			slug: 'cibule',
			level: '1',
			mode: 'intervention'
		});
	});

	it('handles slugs containing dashes', () => {
		expect(parseTaskName('dwell-symbols-1')).toEqual({
			slug: 'dwell-symbols',
			level: '1',
			mode: 'reeducation'
		});
	});

	it('parses dyslex directory-style levels', () => {
		expect(parseTaskName('dyslex-1_syllables')).toEqual({
			slug: 'dyslex',
			level: '1_syllables',
			mode: 'reeducation'
		});
	});

	it('returns null for unknown slugs or missing level', () => {
		expect(parseTaskName('unknown-1')).toBeNull();
		expect(parseTaskName('cibule')).toBeNull();
	});
});

describe('registryLevelId', () => {
	it('maps dyslex route levels to registry level ids', () => {
		expect(registryLevelId({ slug: 'dyslex', level: '1_syllables', mode: 'reeducation' })).toBe(
			'syllables'
		);
		expect(registryLevelId({ slug: 'cibule', level: '3', mode: 'reeducation' })).toBe('3');
	});
});
