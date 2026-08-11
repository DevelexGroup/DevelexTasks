import { describe, expect, it } from 'vitest';
import { hitTest, hitTestAll } from './hitTest';
import type { AoiRect } from '../types';

function rect(overrides: Partial<AoiRect> = {}): AoiRect {
	return { id: 'aoi', left: 100, top: 100, right: 200, bottom: 200, bufferSize: 0, ...overrides };
}

describe('hitTest', () => {
	it('is inclusive on rect edges', () => {
		expect(hitTest(100, 100, rect())).toBe(true);
		expect(hitTest(200, 200, rect())).toBe(true);
		expect(hitTest(99.9, 150, rect())).toBe(false);
		expect(hitTest(150, 200.1, rect())).toBe(false);
	});

	it('inflates the rect by bufferSize on all sides', () => {
		const buffered = rect({ bufferSize: 50 });
		expect(hitTest(50, 50, buffered)).toBe(true);
		expect(hitTest(250, 250, buffered)).toBe(true);
		expect(hitTest(49, 150, buffered)).toBe(false);
	});
});

describe('hitTestAll', () => {
	it('returns ids of all hit AOIs in order', () => {
		const aois = [
			rect({ id: 'a' }),
			rect({ id: 'b', left: 150, right: 300, top: 150, bottom: 300 }),
			rect({ id: 'c', left: 500, right: 600, top: 500, bottom: 600 })
		];
		expect(hitTestAll(175, 175, aois)).toEqual(['a', 'b']);
		expect(hitTestAll(0, 0, aois)).toEqual([]);
	});
});
