import { describe, expect, it } from 'vitest';
import { shiftMapper, type CorrectionSnapshot } from './layers';
import { identityCorrection } from './transform';
import type { SpatialCorrection } from './types';

function snapshot(
	sessionCorrection: SpatialCorrection,
	slideOverrides: Record<number, SpatialCorrection> = {}
): CorrectionSnapshot {
	return { sessionCorrection, slideOverrides };
}

const identity = identityCorrection(960, 540);
const shiftRight = { ...identity, offsetX: 20 };

describe('shiftMapper', () => {
	it('leaves uncorrected output alone while there is no correction', () => {
		expect(shiftMapper(snapshot(identity), null)(1)).toBeNull();
	});

	it('applies the current correction to uncorrected output', () => {
		const mapper = shiftMapper(snapshot(shiftRight), null)(1);
		expect(mapper?.(100, 100)).toEqual({ x: 120, y: 100 });
	});

	it('moves a re-run only by the change since it was computed', () => {
		const later = { ...identity, offsetX: 30, offsetY: 5 };
		const mapper = shiftMapper(snapshot(later), snapshot(shiftRight))(1);
		expect(mapper?.(120, 100)).toEqual({ x: 130, y: 105 });
		expect(shiftMapper(snapshot(shiftRight), snapshot(shiftRight))(1)).toBeNull();
	});

	it('follows per-slide overrides', () => {
		const mapperFor = shiftMapper(snapshot(identity, { 2: shiftRight }), null);
		expect(mapperFor(1)).toBeNull();
		expect(mapperFor(2)?.(0, 0)).toEqual({ x: 20, y: 0 });
	});
});
