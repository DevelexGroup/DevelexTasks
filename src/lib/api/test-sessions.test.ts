import { describe, expect, it } from 'vitest';
import { snapToCommonRate } from './test-sessions';

describe('snapToCommonRate', () => {
	it('snaps measured rates within 5 % to the common tracker rate', () => {
		expect(snapToCommonRate(119.6)).toBe(120);
		expect(snapToCommonRate(124)).toBe(120);
		expect(snapToCommonRate(59.2)).toBe(60);
		expect(snapToCommonRate(30.9)).toBe(30);
	});

	it('rounds rates far from any common rate', () => {
		expect(snapToCommonRate(43.7)).toBe(44);
		expect(snapToCommonRate(0.2)).toBe(1);
	});
});
