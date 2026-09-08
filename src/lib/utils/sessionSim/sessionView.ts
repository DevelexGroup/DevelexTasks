import type { AoiRect, LoadedSession } from './types';
import { distinctSlides } from './builders';
import { parseTaskName, type ParsedTaskName } from './taskName';
import { resolveSlide, type ResolvedSlide } from './taskResolver';

export type ViewportSource = 'geometry' | 'meta' | 'manual';

export interface Viewport {
	width: number;
	height: number;
}

/** Slide-by-slide description of a loaded session, shared by the sim and the heatmap. */
export interface SessionView {
	parsedTask: ParsedTaskName | null;
	slides: number[];
	stimulusBySlide: Record<number, string>;
	resolvedBySlide: Record<number, ResolvedSlide | null>;
	/** Recording viewport from recorded geometry or meta.json; null when neither has one. */
	viewport: Viewport | null;
	viewportSource: ViewportSource;
	/** AOI rects recorded during the live session, per slide. */
	recordedAois: Record<number, AoiRect[]>;
}

export function describeSession(session: LoadedSession): SessionView {
	const parsedTask = parseTaskName(session.taskName);
	const slides = distinctSlides(session.gazeSamples);

	const geometryStimulus: Record<number, string> = {};
	for (const geometry of session.recordedGeometry) {
		if (geometry.stimulusId) geometryStimulus[geometry.slideIndex] ??= geometry.stimulusId;
	}
	const stimulusBySlide: Record<number, string> = {};
	const resolvedBySlide: Record<number, ResolvedSlide | null> = {};
	for (const slide of slides) {
		const row = session.gazeSamples.find(
			(sample) => sample.slide_index === slide && sample.stimulus_id !== 'null'
		);
		stimulusBySlide[slide] = row?.stimulus_id ?? geometryStimulus[slide] ?? 'null';
		resolvedBySlide[slide] = parsedTask ? resolveSlide(parsedTask, stimulusBySlide[slide]) : null;
	}

	// Geometry recorded during the live session beats DOM re-capture: it has
	// real rects, lifetimes, and works even when the stimulus can't render.
	const recorded = session.recordedGeometry.filter((geometry) => geometry.aois.length > 0);
	const recordedViewport = recorded.find(
		(geometry) => geometry.viewport.width > 0 && geometry.viewport.height > 0
	)?.viewport;
	// Viewport priority: recorded geometry > meta.json > manual entry
	const viewport = recordedViewport ?? session.meta?.viewport ?? null;
	const viewportSource: ViewportSource = recordedViewport
		? 'geometry'
		: session.meta?.viewport
			? 'meta'
			: 'manual';
	const recordedAois: Record<number, AoiRect[]> = {};
	for (const geometry of recorded) {
		recordedAois[geometry.slideIndex] = [
			...(recordedAois[geometry.slideIndex] ?? []),
			...geometry.aois
		];
	}

	return {
		parsedTask,
		slides,
		stimulusBySlide,
		resolvedBySlide,
		viewport,
		viewportSource,
		recordedAois
	};
}
