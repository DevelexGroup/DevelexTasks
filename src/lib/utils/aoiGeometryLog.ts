import { get } from 'svelte/store';
import { currentTask } from '$lib/stores/task';

export interface AoiGeometryEntry {
	id: string;
	left: number;
	top: number;
	right: number;
	bottom: number;
	bufferSize: number;
	fromTs: number;
	/** Missing while the AOI is still registered. */
	toTs?: number;
}

interface AoiGeometrySlideFile {
	version: number;
	slideIndex: number;
	stimulusId: string | null;
	viewport: { width: number; height: number };
	aois: AoiGeometryEntry[];
}

const AOI_GEOMETRY_VERSION = 1;

function now(): number {
	return window.performance.timeOrigin + window.performance.now();
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

/**
 * Records the geometry and lifetime of every AOI registered with the SDK, as
 * register/unregister intervals in viewport pixels, bucketed by slide index.
 * Timestamps share the epoch-ms clock of the gaze data tables, so recorded
 * fixations can be re-attributed to AOIs offline.
 */
class AoiGeometryLog {
	private entriesBySlide = new Map<number, AoiGeometryEntry[]>();
	private stimulusBySlide = new Map<number, string>();
	private openByElement = new Map<HTMLElement, AoiGeometryEntry>();
	private lastSlideIndex: number | null = null;
	private unsubscribe: (() => void) | null = null;

	private currentSlide(): number {
		return get(currentTask)?.currentSlideIndex ?? -1;
	}

	private recordStimulus(slideIndex: number): void {
		const stimulusId = get(currentTask)?.stimulusId;
		if (stimulusId && !this.stimulusBySlide.has(slideIndex)) {
			this.stimulusBySlide.set(slideIndex, stimulusId);
		}
	}

	private addEntry(slideIndex: number, entry: AoiGeometryEntry): void {
		const entries = this.entriesBySlide.get(slideIndex);
		if (entries) entries.push(entry);
		else this.entriesBySlide.set(slideIndex, [entry]);
		this.recordStimulus(slideIndex);
	}

	private measure(entry: AoiGeometryEntry, element: HTMLElement): void {
		const rect = element.getBoundingClientRect();
		entry.left = round(rect.left);
		entry.top = round(rect.top);
		entry.right = round(rect.right);
		entry.bottom = round(rect.bottom);
	}

	/** Closes every open interval and reopens it under the new slide's bucket. */
	private ensureSlideSubscription(): void {
		if (this.unsubscribe) return;
		this.unsubscribe = currentTask.subscribe((task) => {
			const slideIndex = task?.currentSlideIndex ?? -1;
			if (this.lastSlideIndex === slideIndex) return;
			this.lastSlideIndex = slideIndex;

			if (this.openByElement.size === 0) return;
			const timestamp = now();
			for (const [element, entry] of this.openByElement) {
				entry.toTs = timestamp;
				const rolled: AoiGeometryEntry = { ...entry, fromTs: timestamp };
				delete rolled.toTs;
				this.addEntry(slideIndex, rolled);
				this.openByElement.set(element, rolled);
			}
		});
	}

	register(element: HTMLElement, id: string, bufferSize: number): void {
		if (this.openByElement.has(element)) return;
		this.ensureSlideSubscription();

		const entry: AoiGeometryEntry = {
			id,
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			bufferSize,
			fromTs: now()
		};
		this.measure(entry, element);
		this.addEntry(this.currentSlide(), entry);
		this.openByElement.set(element, entry);

		// Re-measure once layout settles; the SDK reads fresh rects every frame.
		requestAnimationFrame(() => {
			if (this.openByElement.get(element) === entry && element.isConnected) {
				this.measure(entry, element);
			}
		});
	}

	unregister(element: HTMLElement): void {
		const entry = this.openByElement.get(element);
		if (!entry) return;
		entry.toTs = now();
		this.openByElement.delete(element);
	}

	/** Drops data from before the task; open intervals move to the current slide. */
	reset(): void {
		this.entriesBySlide.clear();
		this.stimulusBySlide.clear();
		this.lastSlideIndex = this.currentSlide();
		for (const [element, entry] of this.openByElement) {
			const reopened: AoiGeometryEntry = { ...entry };
			delete reopened.toTs;
			this.addEntry(this.lastSlideIndex, reopened);
			this.openByElement.set(element, reopened);
		}
	}

	exportSlideAsFile(slideIndex: number): File | null {
		const entries = this.entriesBySlide.get(slideIndex);
		if (!entries || entries.length === 0) return null;

		const content: AoiGeometrySlideFile = {
			version: AOI_GEOMETRY_VERSION,
			slideIndex,
			stimulusId: this.stimulusBySlide.get(slideIndex) ?? null,
			viewport: { width: window.innerWidth, height: window.innerHeight },
			aois: entries
		};
		return new File([JSON.stringify(content, null, 2)], `aoiGeometry_slide${slideIndex}.json`, {
			type: 'application/json'
		});
	}
}

export const aoiGeometryLog = new AoiGeometryLog();
