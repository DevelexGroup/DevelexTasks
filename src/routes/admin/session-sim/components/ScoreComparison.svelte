<script lang="ts">
	import type { SessionScoreDataEntry } from '$lib/database/db.types';

	interface Props {
		recorded: SessionScoreDataEntry | null;
		recomputed: SessionScoreDataEntry | null;
	}

	let { recorded, recomputed }: Props = $props();

	const METRICS: { key: keyof SessionScoreDataEntry; label: string; decimals: number }[] = [
		{ key: 'fluency_score', label: 'Fluency skóre', decimals: 1 },
		{ key: 'error_rate', label: 'Chyby', decimals: 0 },
		{ key: 'response_time', label: 'Doba řešení (ms)', decimals: 0 },
		{ key: 'mean_fix_dur', label: 'Prům. délka fixace (ms)', decimals: 1 },
		{ key: 'fix_count', label: 'Počet fixací', decimals: 0 },
		{ key: 'aoi_target_fix', label: 'Fixace na cíl (hint)', decimals: 0 },
		{ key: 'aoi_field_fix', label: 'Fixace na pole (track)', decimals: 0 },
		{ key: 'regression_count', label: 'Regrese', decimals: 0 }
	];

	function value(
		entry: SessionScoreDataEntry | null,
		key: keyof SessionScoreDataEntry
	): number | null {
		const raw = entry?.[key];
		return typeof raw === 'number' ? raw : null;
	}

	function format(num: number | null, decimals: number): string {
		return num === null ? '–' : num.toFixed(decimals);
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-gray-200 text-left text-gray-500">
				<th class="py-1.5 pr-4 font-medium">Metrika</th>
				<th class="py-1.5 pr-4 font-medium">Zaznamenáno</th>
				<th class="py-1.5 pr-4 font-medium">Přepočteno</th>
				<th class="py-1.5 font-medium">Δ</th>
			</tr>
		</thead>
		<tbody>
			{#each METRICS as metric (metric.key)}
				{@const before = value(recorded, metric.key)}
				{@const after = value(recomputed, metric.key)}
				{@const delta = before !== null && after !== null ? after - before : null}
				<tr class="border-b border-gray-100">
					<td class="py-1.5 pr-4 text-gray-700">{metric.label}</td>
					<td class="py-1.5 pr-4 text-gray-500 tabular-nums">
						{format(before, metric.decimals)}
					</td>
					<td class="py-1.5 pr-4 font-semibold text-gray-800 tabular-nums">
						{format(after, metric.decimals)}
					</td>
					<td
						class="py-1.5 tabular-nums {delta === null || delta === 0
							? 'text-gray-400'
							: delta > 0
								? 'text-emerald-600'
								: 'text-red-500'}"
					>
						{delta === null ? '–' : `${delta > 0 ? '+' : ''}${delta.toFixed(metric.decimals)}`}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
