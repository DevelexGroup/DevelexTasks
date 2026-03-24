interface ResponsiveMultiplierOptions {
	designWidth?: number;
	designHeight?: number;
	minMultiplier?: number;
	maxMultiplier?: number;
	exponent?: number;
}

interface ScaleSizeOptions extends ResponsiveMultiplierOptions {
	roundTo?: number;
}

export type BreakpointName = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveBreakpoint {
	name: BreakpointName;
	minWidth: number;
}

export const tailwindBreakpoints: ReadonlyArray<ResponsiveBreakpoint> = [
	{ name: 'sm', minWidth: 640 },
	{ name: 'md', minWidth: 768 },
	{ name: 'lg', minWidth: 1024 },
	{ name: 'xl', minWidth: 1280 },
	{ name: '2xl', minWidth: 1536 }
] as const;

export interface BreakpointValueMap<T> {
	base: T;
	sm?: T;
	md?: T;
	lg?: T;
	xl?: T;
	'2xl'?: T;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function getBreakpointValue<T>(
	viewportWidth: number,
	values: BreakpointValueMap<T>,
	breakpoints: ReadonlyArray<ResponsiveBreakpoint> = tailwindBreakpoints
): T {
	const sortedBreakpoints = [...breakpoints].sort((a, b) => a.minWidth - b.minWidth);
	let resolved = values.base;

	for (const breakpoint of sortedBreakpoints) {
		if (viewportWidth < breakpoint.minWidth) {
			break;
		}

		const nextValue = values[breakpoint.name];
		if (nextValue !== undefined) {
			resolved = nextValue;
		}
	}

	return resolved;
}

export function getResponsiveMultiplier(
	viewportWidth: number,
	viewportHeight: number,
	{
		designWidth = 1920,
		designHeight = 1080,
		minMultiplier = 0.25,
		maxMultiplier = 1.5,
		exponent = 1
	}: ResponsiveMultiplierOptions = {}
): number {
	const widthRatio = viewportWidth / designWidth;
	const heightRatio = viewportHeight / designHeight;
	const ratio = Math.min(widthRatio, heightRatio);
	const safeExponent = exponent > 0 ? exponent : 1;
	const curvedRatio = Math.pow(Math.max(ratio, 0), safeExponent);

	return clamp(curvedRatio, minMultiplier, maxMultiplier);
}

export function scaleResponsiveSize(
	baseSize: number,
	viewportWidth: number,
	viewportHeight: number,
	{ roundTo = 1, ...multiplierOptions }: ScaleSizeOptions = {}
): number {
	const multiplier = getResponsiveMultiplier(viewportWidth, viewportHeight, multiplierOptions);
	const scaled = baseSize * multiplier;

	if (roundTo <= 1) {
		return Math.round(scaled);
	}

	return Math.round(scaled / roundTo) * roundTo;
}
