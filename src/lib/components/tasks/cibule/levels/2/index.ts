import { resolveAny } from '$lib/utils/resolveAny';
import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';
import { cibuleL1RawData } from '$lib/components/tasks/cibule/cibule.data';

export const id = 'level2';
export const rawData: CibuleRawDataEntry[] = cibuleL1RawData;

export const instructionVideo = resolveAny('/video/cibule-instrukce-02.webm');
