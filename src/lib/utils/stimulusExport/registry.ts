import type { Component } from 'svelte';
import type { RawDataEntry } from '$lib/types/data.types';
import type {
	TrackTaskPreset,
	TrackTaskPresetEntryDefinition,
	TrackTaskPresetUnknown
} from '$lib/types/task.types';
import { filterRawDataByGenerator } from '$lib/utils/trackLevelUtils';

import { cibuleLevelPreset } from '$lib/components/tasks/cibule';
import { cibuleL1RawData, cibuleL3RawData } from '$lib/components/tasks/cibule/cibule.data';
import CibuleTask1 from '$lib/components/tasks/cibule/levels/1/Task.svelte';
import CibuleTask2 from '$lib/components/tasks/cibule/levels/2/Task.svelte';
import CibuleTask3 from '$lib/components/tasks/cibule/levels/3/Task.svelte';
import CibuleTask4 from '$lib/components/tasks/cibule/levels/4/Task.svelte';

import { slabikyLevelPreset } from '$lib/components/tasks/slabiky';
import { slabikyData } from '$lib/components/tasks/slabiky/slabiky.data';
import SlabikyTask1 from '$lib/components/tasks/slabiky/levels/1/Task.svelte';
import SlabikyTask2 from '$lib/components/tasks/slabiky/levels/2/Task.svelte';

import { zrakovkaLevelPreset } from '$lib/components/tasks/zrakovka';
import {
	zrakovkaLevel1Data,
	zrakovkaLevel2Data,
	zrakovkaLevel3Data,
	zrakovkaLevel4Data,
	zrakovkaLevel5Data,
	zrakovkaLevel6Data
} from '$lib/components/tasks/zrakovka/zrakovka.data';
import ZrakovkaTask1 from '$lib/components/tasks/zrakovka/levels/1/Task.svelte';
import ZrakovkaTask2 from '$lib/components/tasks/zrakovka/levels/2/Task.svelte';
import ZrakovkaTask3 from '$lib/components/tasks/zrakovka/levels/3/Task.svelte';
import ZrakovkaTask4 from '$lib/components/tasks/zrakovka/levels/4/Task.svelte';
import ZrakovkaTask5 from '$lib/components/tasks/zrakovka/levels/5/Task.svelte';
import ZrakovkaTask6 from '$lib/components/tasks/zrakovka/levels/6/Task.svelte';

import { fonologieLevelPreset } from '$lib/components/tasks/fonologie';
import { fonologieL1Data, fonologieL4Data } from '$lib/components/tasks/fonologie/fonologie.data';
import FonologieTask1 from '$lib/components/tasks/fonologie/levels/1/Task.svelte';
import FonologieTask2 from '$lib/components/tasks/fonologie/levels/2/Task.svelte';
import FonologieTask3 from '$lib/components/tasks/fonologie/levels/3/Task.svelte';
import FonologieTask4 from '$lib/components/tasks/fonologie/levels/4/Task.svelte';
import FonologieTask5 from '$lib/components/tasks/fonologie/levels/5/Task.svelte';

import DyslexTask1 from '$lib/components/tasks/dyslex/levels/1_syllables/Task.svelte';
import DyslexTask2 from '$lib/components/tasks/dyslex/levels/2_meantext/Task.svelte';
import DyslexTask3 from '$lib/components/tasks/dyslex/levels/3_pseudotext/Task.svelte';
import DyslexTask4 from '$lib/components/tasks/dyslex/levels/4_visdiff/Task.svelte';

export type ExportTaskComponent = Component<Record<string, unknown>>;

export interface ExportStimulus {
	/** Unique within the level; used for file naming. */
	id: string;
	/** Raw data entry rendered via a synthetic single-entry preset (track tasks only). */
	raw?: RawDataEntry;
	/** Extra props forwarded to the level's Task.svelte (e.g. dyslex visdiff initialSlide). */
	extraProps?: Record<string, unknown>;
}

export interface ExportableLevel {
	taskSlug: 'cibule' | 'slabiky' | 'zrakovka' | 'fonologie' | 'dyslex';
	/** Equals the level module's exported `id`, so Task.svelte finds it in the synthetic preset. */
	levelId: string;
	label: string;
	component: ExportTaskComponent;
	kind: 'track' | 'dyslex';
	stimuli: ExportStimulus[];
	supportsAnswerOverlay: boolean;
}

export interface ExportableTask {
	slug: ExportableLevel['taskSlug'];
	label: string;
	levels: ExportableLevel[];
}

/**
 * Every stimulus the level's content generators can reach, tags deliberately ignored
 * (disabled/evaluation/interference stimuli are all exportable).
 */
function enumerateLevelStimuli<TRawDataEntry extends RawDataEntry>(
	preset: TrackTaskPreset<TRawDataEntry>,
	levelId: string,
	rawData: TRawDataEntry[],
	extraProps?: Record<string, unknown>
): ExportStimulus[] {
	const content = preset.find((level) => level.levelID === levelId)?.content ?? [];
	const byId = new Map<string, ExportStimulus>();

	for (const entry of content) {
		if (entry.generate) {
			for (const match of filterRawDataByGenerator(rawData, entry.generate)) {
				byId.set(String(match.id), { id: String(match.id), raw: match, extraProps });
			}
		} else {
			const definition = entry as TRawDataEntry;
			byId.set(String(definition.id), { id: String(definition.id), raw: definition, extraProps });
		}
	}

	return [...byId.values()];
}

/**
 * Synthetic preset rendering exactly one stimulus. `getLevelData`'s definition branch
 * formats the entry directly and never applies tag exclusion, so tagged stimuli render too.
 */
export function buildSingleStimulusPreset(
	levelId: string,
	raw: RawDataEntry
): TrackTaskPresetUnknown {
	return [
		{
			levelID: levelId,
			label: 'export',
			practiceContent: [],
			content: [raw as TrackTaskPresetEntryDefinition<RawDataEntry>]
		}
	];
}

function trackLevel<TRawDataEntry extends RawDataEntry>(
	taskSlug: ExportableLevel['taskSlug'],
	levelId: string,
	label: string,
	component: unknown,
	preset: TrackTaskPreset<TRawDataEntry>,
	rawData: TRawDataEntry[],
	extraProps?: Record<string, unknown>
): ExportableLevel {
	return {
		taskSlug,
		levelId,
		label,
		component: component as ExportTaskComponent,
		kind: 'track',
		stimuli: enumerateLevelStimuli(preset, levelId, rawData, extraProps),
		supportsAnswerOverlay: true
	};
}

// Fonologie levels 1-3 default to a random word category per run; pin it off so the
// synthetic preset's stimulus is rendered deterministically.
const noCategories = { useCategories: false };

export const exportableTasks: ExportableTask[] = [
	{
		slug: 'cibule',
		label: 'Řádkový lov (cibule)',
		levels: [
			trackLevel('cibule', '1', 'Úroveň 1', CibuleTask1, cibuleLevelPreset, cibuleL1RawData),
			trackLevel('cibule', '2', 'Úroveň 2', CibuleTask2, cibuleLevelPreset, cibuleL1RawData),
			trackLevel('cibule', '3', 'Úroveň 3', CibuleTask3, cibuleLevelPreset, cibuleL3RawData),
			trackLevel('cibule', '4', 'Úroveň 4', CibuleTask4, cibuleLevelPreset, cibuleL3RawData)
		]
	},
	{
		slug: 'slabiky',
		label: 'Slabiková stopa (slabiky)',
		levels: [
			trackLevel('slabiky', '1', 'Úroveň 1', SlabikyTask1, slabikyLevelPreset, slabikyData),
			trackLevel('slabiky', '2', 'Úroveň 2', SlabikyTask2, slabikyLevelPreset, slabikyData)
		]
	},
	{
		slug: 'zrakovka',
		label: 'Zrakový detektiv (zrakovka)',
		levels: [
			trackLevel(
				'zrakovka',
				'1',
				'Úroveň 1',
				ZrakovkaTask1,
				zrakovkaLevelPreset,
				zrakovkaLevel1Data
			),
			trackLevel(
				'zrakovka',
				'2',
				'Úroveň 2',
				ZrakovkaTask2,
				zrakovkaLevelPreset,
				zrakovkaLevel2Data
			),
			trackLevel(
				'zrakovka',
				'3',
				'Úroveň 3',
				ZrakovkaTask3,
				zrakovkaLevelPreset,
				zrakovkaLevel3Data
			),
			trackLevel(
				'zrakovka',
				'4',
				'Úroveň 4',
				ZrakovkaTask4,
				zrakovkaLevelPreset,
				zrakovkaLevel4Data
			),
			trackLevel(
				'zrakovka',
				'5',
				'Úroveň 5',
				ZrakovkaTask5,
				zrakovkaLevelPreset,
				zrakovkaLevel5Data
			),
			trackLevel(
				'zrakovka',
				'6',
				'Úroveň 6',
				ZrakovkaTask6,
				zrakovkaLevelPreset,
				zrakovkaLevel6Data
			)
		]
	},
	{
		slug: 'fonologie',
		label: 'Zvuková skládačka (fonologie)',
		levels: [
			trackLevel(
				'fonologie',
				'1',
				'Úroveň 1',
				FonologieTask1,
				fonologieLevelPreset,
				fonologieL1Data,
				noCategories
			),
			trackLevel(
				'fonologie',
				'2',
				'Úroveň 2',
				FonologieTask2,
				fonologieLevelPreset,
				fonologieL1Data,
				noCategories
			),
			trackLevel(
				'fonologie',
				'3',
				'Úroveň 3',
				FonologieTask3,
				fonologieLevelPreset,
				fonologieL1Data,
				noCategories
			),
			trackLevel(
				'fonologie',
				'4',
				'Úroveň 4',
				FonologieTask4,
				fonologieLevelPreset,
				fonologieL4Data
			),
			trackLevel(
				'fonologie',
				'5',
				'Úroveň 5',
				FonologieTask5,
				fonologieLevelPreset,
				fonologieL4Data
			)
		]
	},
	{
		slug: 'dyslex',
		label: 'Dyslex (diagnostika)',
		levels: [
			{
				taskSlug: 'dyslex',
				levelId: 'syllables',
				label: 'Slabiky',
				component: DyslexTask1 as unknown as ExportTaskComponent,
				kind: 'dyslex',
				stimuli: [{ id: 'syllables-content' }],
				supportsAnswerOverlay: false
			},
			{
				taskSlug: 'dyslex',
				levelId: 'meantext',
				label: 'Smysluplný text',
				component: DyslexTask2 as unknown as ExportTaskComponent,
				kind: 'dyslex',
				stimuli: [{ id: 'meantext-content' }],
				supportsAnswerOverlay: false
			},
			{
				taskSlug: 'dyslex',
				levelId: 'pseudotext',
				label: 'Pseudotext',
				component: DyslexTask3 as unknown as ExportTaskComponent,
				kind: 'dyslex',
				stimuli: [{ id: 'pseudotext-content' }],
				supportsAnswerOverlay: false
			},
			{
				taskSlug: 'dyslex',
				levelId: 'visdiff',
				label: 'Vizuální rozdíly',
				component: DyslexTask4 as unknown as ExportTaskComponent,
				kind: 'dyslex',
				stimuli: [
					{ id: 'visdiff-1', extraProps: { initialSlide: 0 } },
					{ id: 'visdiff-2', extraProps: { initialSlide: 1 } }
				],
				supportsAnswerOverlay: true
			}
		]
	}
];

export function countTaskStimuli(task: ExportableTask): number {
	return task.levels.reduce((sum, level) => sum + level.stimuli.length, 0);
}

export function countAllStimuli(): number {
	return exportableTasks.reduce((sum, task) => sum + countTaskStimuli(task), 0);
}

export function sanitizeFileName(name: string): string {
	return name.replace(/[^\w.-]/g, '_');
}
