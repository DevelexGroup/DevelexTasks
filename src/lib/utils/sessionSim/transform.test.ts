import { describe, expect, it } from 'vitest';
import type { RawGazeDataEntry } from '$lib/database/db.types';
import {
	applyCorrection,
	identityCorrection,
	invertCorrection,
	isIdentity,
	transformRawEntry
} from './transform';
import type { SpatialCorrection } from './types';

function raw(overrides: Partial<RawGazeDataEntry> = {}): RawGazeDataEntry {
	return {
		child_id: 'child',
		session_id: 'session',
		task_name: 'cibule-1',
		slide_index: 1,
		timestamp: 1000,
		bridgeTimeStamp: '1970-01-01T00:00:01.000Z',
		deviceTimeStamp: '1970-01-01T00:00:01.000Z',
		x: 100,
		y: 200,
		xL: 99,
		yL: 199,
		validityL: true,
		pupilDiameterL: 3,
		xR: 101,
		yR: 201,
		validityR: true,
		pupilDiameterR: 3,
		...overrides
	};
}

describe('applyCorrection', () => {
	it('identity keeps the point', () => {
		expect(applyCorrection(100, 200, identityCorrection())).toEqual({ x: 100, y: 200 });
	});

	it('applies offset', () => {
		const correction: SpatialCorrection = { ...identityCorrection(), offsetX: 10, offsetY: -20 };
		expect(applyCorrection(100, 200, correction)).toEqual({ x: 110, y: 180 });
	});

	it('scales about the center point', () => {
		const correction: SpatialCorrection = {
			offsetX: 0,
			offsetY: 0,
			scaleX: 2,
			scaleY: 0.5,
			centerX: 100,
			centerY: 100
		};
		expect(applyCorrection(150, 200, correction)).toEqual({ x: 200, y: 150 });
		expect(applyCorrection(100, 100, correction)).toEqual({ x: 100, y: 100 });
	});

	it('matrix mode replaces offset/scale', () => {
		const translate: SpatialCorrection = {
			...identityCorrection(),
			offsetX: 10,
			useMatrix: true,
			matrix: [1, 0, 0, 30, 0, 1, 0, -40, 0, 0, 1, 0, 0, 0, 0, 1]
		};
		expect(applyCorrection(100, 200, translate)).toEqual({ x: 130, y: 160 });

		const projective: SpatialCorrection = {
			...identityCorrection(),
			useMatrix: true,
			matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2]
		};
		expect(applyCorrection(100, 200, projective)).toEqual({ x: 50, y: 100 });
	});

	it('disabled matrix is ignored', () => {
		const correction: SpatialCorrection = {
			...identityCorrection(),
			offsetX: 10,
			matrix: [1, 0, 0, 30, 0, 1, 0, -40, 0, 0, 1, 0, 0, 0, 0, 1]
		};
		expect(applyCorrection(100, 200, correction)).toEqual({ x: 110, y: 200 });
	});

	it('invertCorrection round-trips a point', () => {
		const correction: SpatialCorrection = {
			offsetX: 25,
			offsetY: -10,
			scaleX: 1.2,
			scaleY: 0.8,
			centerX: 960,
			centerY: 540
		};
		const forward = applyCorrection(123, 456, correction);
		const back = applyCorrection(forward.x, forward.y, invertCorrection(correction));
		expect(back.x).toBeCloseTo(123);
		expect(back.y).toBeCloseTo(456);
	});
});

describe('isIdentity', () => {
	it('detects identity regardless of center', () => {
		expect(isIdentity(identityCorrection(500, 500))).toBe(true);
		expect(isIdentity({ ...identityCorrection(), offsetX: 1 })).toBe(false);
		expect(isIdentity({ ...identityCorrection(), scaleY: 1.01 })).toBe(false);
	});

	it('matrix mode judges only the matrix', () => {
		expect(isIdentity({ ...identityCorrection(), offsetX: 5, useMatrix: true })).toBe(true);
		expect(
			isIdentity({
				...identityCorrection(),
				useMatrix: true,
				matrix: [1, 0, 0, 5, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
			})
		).toBe(false);
		expect(
			isIdentity({
				...identityCorrection(),
				matrix: [1, 0, 0, 5, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
			})
		).toBe(true);
	});
});

describe('transformRawEntry', () => {
	const offset: SpatialCorrection = { ...identityCorrection(), offsetX: 50, offsetY: 100 };

	it('transforms combined and per-eye coordinates', () => {
		const result = transformRawEntry(raw(), offset);
		expect(result.x).toBe(150);
		expect(result.y).toBe(300);
		expect(result.xL).toBe(149);
		expect(result.yL).toBe(299);
		expect(result.xR).toBe(151);
		expect(result.yR).toBe(301);
	});

	it('transforms when only one eye is valid', () => {
		const result = transformRawEntry(raw({ validityL: false }), offset);
		expect(result.x).toBe(150);
	});

	it('passes invalid samples through untouched', () => {
		const entry = raw({ validityL: false, validityR: false });
		const result = transformRawEntry(entry, offset);
		expect(result).toEqual(entry);
		expect(result).not.toBe(entry);
	});
});
