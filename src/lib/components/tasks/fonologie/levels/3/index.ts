import type { FonologieTaskRawDataEntry } from '$lib/components/tasks/fonologie/fonologie.types';
import { fonologieL1Data } from '$lib/components/tasks/fonologie/fonologie.data';
import { resolveAny } from '$lib/utils/resolveAny';

export const id = '3';
export const rawData: FonologieTaskRawDataEntry[] = fonologieL1Data;

export const instructionVideo = resolveAny('/video/fonologie-instrukce-03.webm');
