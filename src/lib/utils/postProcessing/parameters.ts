import type { PostProcessorParameter } from '$lib/api/test-sessions';

/** Form state for a processor's parameters: each value as typed, empty = not set. */
export type ParameterDraft = Record<string, string>;

export interface ResolvedParameters {
	values: Record<string, unknown>;
	errors: Record<string, string>;
}

export function draftFromDefaults(parameters: PostProcessorParameter[]): ParameterDraft {
	const draft: ParameterDraft = {};
	for (const parameter of parameters) {
		draft[parameter.key] = parameter.defaultValue == null ? '' : String(parameter.defaultValue);
	}
	return draft;
}

/** Converts the drafted strings to typed request values; empty optional fields are omitted. */
export function resolveParameters(
	parameters: PostProcessorParameter[],
	draft: ParameterDraft
): ResolvedParameters {
	const values: Record<string, unknown> = {};
	const errors: Record<string, string> = {};

	for (const parameter of parameters) {
		const key = parameter.key;
		const raw = (draft[key] ?? '').trim();
		if (raw === '') {
			if (parameter.required) errors[key] = 'Povinný údaj';
			continue;
		}

		switch (parameter.type) {
			case 'NUMBER':
			case 'INTEGER': {
				const value = Number(raw.replace(',', '.'));
				if (!Number.isFinite(value)) {
					errors[key] = 'Zadejte číslo';
				} else if (parameter.type === 'INTEGER' && !Number.isInteger(value)) {
					errors[key] = 'Zadejte celé číslo';
				} else if (parameter.min != null && value < parameter.min) {
					errors[key] = `Nejméně ${parameter.min}`;
				} else if (parameter.max != null && value > parameter.max) {
					errors[key] = `Nejvýše ${parameter.max}`;
				} else {
					values[key] = value;
				}
				break;
			}
			case 'BOOLEAN':
				values[key] = raw === 'true';
				break;
			case 'SELECT':
				if (parameter.options?.some((option) => option.value === raw)) {
					values[key] = raw;
				} else {
					errors[key] = 'Neplatná volba';
				}
				break;
			default:
				values[key] = raw;
		}
	}

	return { values, errors };
}
