export const DWELL_SYMBOL_IMAGES = [
	{ name: 'svestka', alt: 'Plum' },
	{ name: 'tresne', alt: 'Cherries' },
	{ name: 'vino2', alt: 'Grapes' },
	{ name: 'Rjablko2', alt: 'Apple' },
	{ name: 'Rcitron', alt: 'Lemon' },
	{ name: 'jahoda', alt: 'Strawberry' },
	{ name: 'hruska', alt: 'Pear' },
	{ name: 'banan', alt: 'Banana' },
	{ name: 'boruvky', alt: 'Blueberries' }
] as const;

export const DWELL_SHAPES = ['cube', 'circle', 'hexagon'] as const;

export type DwellShape = (typeof DWELL_SHAPES)[number];
export type DwellSymbolImage = (typeof DWELL_SYMBOL_IMAGES)[number];

export interface Position {
	x: number;
	y: number;
}

export interface DwellSymbolTarget extends Position {
	id: string;
	image: DwellSymbolImage;
	shape: DwellShape;
	dwellTimeMs: number;
}

export interface DwellSymbolLayout {
	width: number;
	height: number;
	targetSize: number;
	padding: number;
	topInset: number;
	gap: number;
}

export const TARGET_COUNT = 6;
export const MIN_DWELL_TIME_MS = 500;
export const MAX_DWELL_TIME_MS = 2000;

export function randomInteger(min: number, max: number, random = Math.random): number {
	return Math.floor(random() * (max - min + 1)) + min;
}

export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
	const result = [...values];

	for (let index = result.length - 1; index > 0; index--) {
		const swapIndex = randomInteger(0, index, random);
		[result[index], result[swapIndex]] = [result[swapIndex], result[index]];
	}

	return result;
}

export function positionsOverlap(
	first: Position,
	second: Position,
	targetSize: number,
	gap: number
): boolean {
	return !(
		first.x + targetSize + gap <= second.x ||
		second.x + targetSize + gap <= first.x ||
		first.y + targetSize + gap <= second.y ||
		second.y + targetSize + gap <= first.y
	);
}

export function generatePosition(
	layout: DwellSymbolLayout,
	occupied: Position[],
	random = Math.random,
	attempts = 500
): Position | null {
	const minX = layout.padding;
	const maxX = layout.width - layout.padding - layout.targetSize;
	const minY = layout.topInset;
	const maxY = layout.height - layout.padding - layout.targetSize;

	if (maxX < minX || maxY < minY) return null;

	for (let attempt = 0; attempt < attempts; attempt++) {
		const position = {
			x: minX + random() * (maxX - minX),
			y: minY + random() * (maxY - minY)
		};

		if (
			occupied.every((other) => !positionsOverlap(position, other, layout.targetSize, layout.gap))
		) {
			return position;
		}
	}

	return null;
}

export function generatePositions(
	count: number,
	layout: DwellSymbolLayout,
	random = Math.random
): Position[] {
	const positions: Position[] = [];

	for (let index = 0; index < count; index++) {
		const position = generatePosition(layout, positions, random);
		if (!position) return generateGridPositions(count, layout, random);
		positions.push(position);
	}

	return positions;
}

export function createInitialTargets(
	layout: DwellSymbolLayout,
	createId: () => string,
	random = Math.random
): DwellSymbolTarget[] {
	const positions = generatePositions(TARGET_COUNT, layout, random);
	const images = shuffle(DWELL_SYMBOL_IMAGES, random).slice(0, TARGET_COUNT);
	const shapes = shuffle(
		DWELL_SHAPES.flatMap((shape) => [shape, shape]),
		random
	);

	return positions.map((position, index) => ({
		...position,
		id: createId(),
		image: images[index],
		shape: shapes[index],
		dwellTimeMs: randomInteger(MIN_DWELL_TIME_MS, MAX_DWELL_TIME_MS, random)
	}));
}

export function createReplacementTarget(
	current: DwellSymbolTarget,
	otherTargets: DwellSymbolTarget[],
	layout: DwellSymbolLayout,
	createId: () => string,
	random = Math.random
): DwellSymbolTarget {
	const displayedImages = new Set(otherTargets.map((target) => target.image.name));
	const availableImages = DWELL_SYMBOL_IMAGES.filter(
		(image) => image.name !== current.image.name && !displayedImages.has(image.name)
	);
	const imagePool = availableImages.length > 0 ? availableImages : DWELL_SYMBOL_IMAGES;
	const position = generatePosition(layout, [...otherTargets, current], random) ?? {
		x: current.x,
		y: current.y
	};

	return {
		...position,
		id: createId(),
		image: imagePool[randomInteger(0, imagePool.length - 1, random)],
		shape: DWELL_SHAPES[randomInteger(0, DWELL_SHAPES.length - 1, random)],
		dwellTimeMs: randomInteger(MIN_DWELL_TIME_MS, MAX_DWELL_TIME_MS, random)
	};
}

function generateGridPositions(
	count: number,
	layout: DwellSymbolLayout,
	random: () => number
): Position[] {
	const availableWidth = layout.width - layout.padding * 2;
	const availableHeight = layout.height - layout.topInset - layout.padding;
	const columns = Math.min(3, count);
	const rows = Math.ceil(count / columns);
	const contentWidth = columns * layout.targetSize + (columns - 1) * layout.gap;
	const contentHeight = rows * layout.targetSize + (rows - 1) * layout.gap;
	const startX = layout.padding + (availableWidth - contentWidth) / 2;
	const startY = layout.topInset + (availableHeight - contentHeight) / 2;

	return shuffle(
		Array.from({ length: count }, (_, index) => ({
			x: startX + (index % columns) * (layout.targetSize + layout.gap),
			y: startY + Math.floor(index / columns) * (layout.targetSize + layout.gap)
		})),
		random
	);
}
