import { session } from '$lib/utils/persistedStore';

const DIAGNOSIS_PASSWORD = import.meta.env.VITE_DIAGNOSIS_PASSWORD || 'pass1234';

export const isDiagnosisMode = session('diagnosis_mode', false);

export function checkDiagnosisPassword(password: string): boolean {
	return password === DIAGNOSIS_PASSWORD; // veri secure
}
