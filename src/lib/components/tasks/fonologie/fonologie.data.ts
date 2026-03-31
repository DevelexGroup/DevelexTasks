import type {
	FonologieManipulationRawDataEntry,
	FonologieAudioRawDataEntry
} from '$lib/components/tasks/fonologie/fonologie.types';
import FonologieLevel1Data from '$lib/components/tasks/fonologie/data/level1.json';
import FonologieLevel4Data from '$lib/components/tasks/fonologie/data/level4.json';

export const fonologieL1Data: FonologieAudioRawDataEntry[] = FonologieLevel1Data;
export const fonologieL4Data: FonologieManipulationRawDataEntry[] = FonologieLevel4Data;