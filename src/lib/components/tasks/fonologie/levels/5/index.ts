import type { FonologieTaskRawDataEntry } from '$lib/components/tasks/fonologie/fonologie.types';
import { fonologieL4Data } from '$lib/components/tasks/fonologie/fonologie.data';
import { resolveAny } from '$lib/utils/resolveAny';

export const id = '5';
export const rawData: FonologieTaskRawDataEntry[] = fonologieL4Data;

export const instructionVideo = resolveAny('/video/fonologie-instrukce-05.webm');
