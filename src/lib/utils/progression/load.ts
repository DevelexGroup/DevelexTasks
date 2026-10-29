import {
	downloadTestSessionFile,
	getTestSessionDetail,
	runI2mcHeadless,
	type I2mcParameters
} from '$lib/api/test-sessions';
import type { TestSessionDTO } from '$lib/types/api.types';
import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
import {
	parseFixationDataCsv,
	parseGazeSamplesCsv,
	parseRawGazeDataCsv,
	type I2mcFixationEntry
} from '$lib/utils/csvParser';
import {
	classifyFileName,
	parseAoiGeometryJson,
	parseSessionMetaJson
} from '$lib/utils/sessionSim/loaders';
import type { RecordedSlideGeometry, RecordedSessionMeta } from '$lib/utils/sessionSim/types';
import { DatabaseExporter } from '$lib/utils/databaseExport';
import {
	assignSeries,
	calculateMetrics,
	emptyMetrics,
	type ProgressionResult,
	type ProgressionSlide
} from './model';

export interface AnalysisOptions {
	canCalculate: boolean;
	parameters: I2mcParameters;
	useRecordedViewport: boolean;
	isCurrent?: () => boolean;
}

const I2MC_OUTPUT_PREFIX = 'I2MC_fixationData';

const messageOf = (error: unknown): string =>
	error instanceof Error ? error.message : 'Tento záznam se nepodařilo načíst.';
const usableId = (value: string | undefined | null): string | null =>
	value && value !== 'null' && value !== 'unknown' ? value : null;
const uniqueRows = <T>(rows: T[]): T[] => [
	...new Map(rows.map((row) => [JSON.stringify(row), row])).values()
];

export const analyzeSession = async (
	session: TestSessionDTO,
	options: AnalysisOptions
): Promise<ProgressionResult> => {
	const current = options.isCurrent ?? (() => true);
	const checkCurrent = () => {
		if (!current()) {
			throw new Error('Analýza byla nahrazena novým výběrem.');
		}
	};
	const detail = await getTestSessionDetail(session.id);
	checkCurrent();
	const files = new Map<string, { id: string; name: string; slide: number | null }>();

	for (const part of detail.parts ?? []) {
		for (const file of part.files ?? []) {
			files.set(file.id, {
				id: file.id,
				name: file.fileName,
				slide: part.partType === 'SLIDE' ? part.partNumber : null
			});
		}
	}

	for (const file of detail.files ?? []) {
		if (!files.has(file.id)) {
			files.set(file.id, { id: file.id, name: file.fileName, slide: null });
		}
	}

	const fixations = new Map<number, I2mcFixationEntry[]>();
	const sources = new Map<number, 'saved' | 'calculated'>();
	const errors = new Map<number, string>();
	const slideIds = new Set<number>();
	const geometry: RecordedSlideGeometry[] = [];
	const samples: GazeSampleDataEntry[] = [];
	const raw: RawGazeDataEntry[] = [];
	const warnings: string[] = [];
	let meta: RecordedSessionMeta | null = null;

	for (const file of files.values()) {
		checkCurrent();
		const kind = file.name.startsWith(I2MC_OUTPUT_PREFIX)
			? 'i2mcFixationData'
			: classifyFileName(file.name);

		if (!kind || kind === 'fixationData' || kind === 'sessionScores') {
			continue;
		}

		const match = /slide(\d+)/i.exec(file.name);
		const fileSlide = match ? Number(match[1]) : file.slide;

		if (fileSlide !== null && fileSlide >= 0) {
			slideIds.add(fileSlide);
		}

		try {
			const content = await (await downloadTestSessionFile(session.id, file.id)).text();
			checkCurrent();

			if (kind === 'i2mcFixationData') {
				const entries = parseFixationDataCsv(content, true);
				const groups = new Set(entries.map((entry) => entry.slide_index));

				if (fileSlide !== null) {
					if (entries.some((entry) => entry.slide_index !== fileSlide)) {
						throw new Error('Indexy snímků fixací neodpovídají souboru.');
					}

					groups.add(fileSlide);
				}

				for (const slide of groups) {
					slideIds.add(slide);
					fixations.set(slide, [
						...(fixations.get(slide) ?? []),
						...entries.filter((entry) => entry.slide_index === slide)
					]);
					sources.set(slide, 'saved');
				}
			} else if (kind === 'aoiGeometry') {
				const parsed = parseAoiGeometryJson(content);

				if (parsed) {
					geometry.push(parsed);
					slideIds.add(parsed.slideIndex);
				}
			} else if (kind === 'sessionMeta') {
				meta = parseSessionMetaJson(content);
			} else if (kind === 'gazeSamples') {
				for (const sample of parseGazeSamplesCsv(content, true)) {
					samples.push(sample);
				}
			} else if (kind === 'rawGazeData') {
				for (const sample of parseRawGazeDataCsv(content, true)) {
					raw.push(sample);
				}
			}
		} catch (error) {
			checkCurrent();
			warnings.push(`${file.name}: ${messageOf(error)}`);

			if (kind === 'i2mcFixationData' && fileSlide !== null) {
				errors.set(fileSlide, messageOf(error));
			}
		}
	}

	for (const entry of [...samples, ...raw]) {
		if (entry.slide_index >= 0) {
			slideIds.add(entry.slide_index);
		}
	}

	for (const slide of Object.keys(meta?.samplesPerSlide ?? {})) {
		slideIds.add(Number(slide));
	}

	const distinctRaw = uniqueRows(raw).sort((a, b) => a.timestamp - b.timestamp);
	const geometryViewport = geometry.find(
		(item) => item.viewport.width > 0 && item.viewport.height > 0
	)?.viewport;
	const viewport = geometryViewport ?? meta?.viewport;
	const reconstructedViewport = meta?.recalculated?.items.includes(
		geometryViewport ? 'aoiGeometry' : 'meta'
	);
	const viewportSource =
		options.useRecordedViewport && viewport
			? reconstructedViewport
				? 'rekonstruovaná zobrazovací plocha'
				: 'zaznamenaná zobrazovací plocha'
			: 'nastavené náhradní rozměry';
	const parameters = { ...options.parameters };

	if (options.useRecordedViewport && viewport) {
		parameters.xres = viewport.width;
		parameters.yres = viewport.height;
	}

	const missing = [...slideIds].filter((slide) => !fixations.has(slide) && !errors.has(slide));
	const calculable = missing.filter((slide) =>
		distinctRaw.some((sample) => sample.slide_index === slide)
	);

	if (calculable.length && options.canCalculate) {
		checkCurrent();
		const missingRaw = distinctRaw.filter((sample) => calculable.includes(sample.slide_index));
		const inputFiles = [
			{
				name: 'rawGazeData.csv',
				content: DatabaseExporter.createCsvContent(missingRaw, 'rawGazeData')
			}
		];

		for (const item of geometry.filter((item) => calculable.includes(item.slideIndex))) {
			inputFiles.push({
				name: `aoiGeometry_slide${item.slideIndex}.json`,
				content: JSON.stringify(item)
			});
		}

		try {
			const outputs = await runI2mcHeadless(inputFiles, parameters);
			checkCurrent();

			for (const output of outputs) {
				const match = /^I2MC_fixationData_slide(\d+)\.csv$/i.exec(output.fileName);

				if (!match || !calculable.includes(Number(match[1]))) {
					continue;
				}

				const slide = Number(match[1]);

				try {
					const entries = parseFixationDataCsv(output.content, true);

					if (entries.some((entry) => entry.slide_index !== slide)) {
						throw new Error('Indexy snímků vypočítaných fixací neodpovídají výstupnímu souboru.');
					}

					fixations.set(slide, entries);
					sources.set(slide, 'calculated');
				} catch (error) {
					errors.set(slide, messageOf(error));
				}
			}
		} catch (error) {
			checkCurrent();

			for (const slide of calculable) {
				errors.set(slide, messageOf(error));
			}
		}
	}

	const slides: ProgressionSlide[] = [...slideIds].map((slideIndex) => {
		const entries = fixations.get(slideIndex);
		const stimulusId =
			usableId(
				samples.find((sample) => sample.slide_index === slideIndex && usableId(sample.stimulus_id))
					?.stimulus_id
			) ??
			usableId(geometry.find((item) => item.slideIndex === slideIndex)?.stimulusId) ??
			usableId(entries?.find((entry) => usableId(entry.stimulus_id))?.stimulus_id);
		const slideRaw = distinctRaw.filter((sample) => sample.slide_index === slideIndex);
		const error =
			errors.get(slideIndex) ??
			(!entries
				? slideRaw.length === 0
					? 'Chybí výstup I2MC a surová data pohledu.'
					: !options.canCalculate
						? 'Výpočet chybějících fixací vyžaduje oprávnění ke správě relací.'
						: 'I2MC nevrátil žádný výstup pro tento snímek.'
				: undefined);
		const metrics =
			entries && !error
				? calculateMetrics(uniqueRows(entries), slideRaw)
				: { values: emptyMetrics(), reasons: {} };

		return {
			slideIndex,
			stimulusId,
			seriesKey: '',
			label: '',
			source: error ? 'unavailable' : (sources.get(slideIndex) ?? 'unavailable'),
			...metrics,
			error
		};
	});

	if (!slides.length) {
		throw new Error(
			warnings.join(' ') || 'V této relaci nebyly nalezeny žádné zaznamenané snímky.'
		);
	}

	return {
		sessionId: session.id,
		slides: assignSeries(slides),
		warnings,
		settingsDescription: `${parameters.xres} × ${parameters.yres} px (${viewportSource}); ${parameters.freq ? `${parameters.freq} Hz` : 'automatická vzorkovací frekvence'}; ${parameters.minFixDur} ms minimální délka fixace; ${parameters.gapSplitMs} ms práh pro rozdělení při výpadku. Nastavení uložených fixací I2MC se může lišit.${meta?.recalculated?.items.includes('aoiGeometry') ? ' Geometrie položek byla rekonstruována po pořízení záznamu a může se lišit od původního rozložení.' : ''}`
	};
};
