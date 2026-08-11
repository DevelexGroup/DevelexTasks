import {
	calculateFluencyScore as cibuleFluency,
	formatCibuleRawData
} from '$lib/components/tasks/cibule';
import {
	calculateFluencyScore as slabikyFluency,
	formatSlabikyRawData
} from '$lib/components/tasks/slabiky';
import type { SessionScoreMetrics } from '$lib/database/db.types';
import type { RawDataEntry } from '$lib/types/data.types';
import type { TrackTaskDataEntry, TrackTaskState } from '$lib/types/task.types';
import type { FluencyResolver } from '../types';

interface FluencyTaskSupport {
	calculate: (metrics: Partial<SessionScoreMetrics>, state: TrackTaskState) => number;
	toDataEntry: (raw: RawDataEntry) => TrackTaskDataEntry;
}

// Only these tasks pass a fluency evaluation into TrackLevel; everything else scores 0
const FLUENCY_TASKS: Record<string, FluencyTaskSupport> = {
	cibule: {
		calculate: cibuleFluency,
		toDataEntry: formatCibuleRawData as unknown as FluencyTaskSupport['toDataEntry']
	},
	slabiky: {
		calculate: slabikyFluency,
		toDataEntry: formatSlabikyRawData as unknown as FluencyTaskSupport['toDataEntry']
	}
};

export function createFluencyResolver(
	slug: string,
	stimulusRawById: (stimulusId: string) => RawDataEntry | null
): FluencyResolver {
	const support = FLUENCY_TASKS[slug];
	if (!support) return () => 0;

	return (metrics, stimulusId) => {
		const raw = stimulusRawById(stimulusId);
		if (!raw) return 0;
		const state: TrackTaskState = {
			selectedCorrectIndices: [],
			dataEntry: support.toDataEntry(raw)
		};
		return support.calculate(metrics, state);
	};
}
