<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import {
		Chart,
		CategoryScale,
		LinearScale,
		LineController,
		LineElement,
		PointElement,
		Tooltip,
		type ChartDataset,
		type PointStyle
	} from 'chart.js';
	import type { TestSessionDTO } from '$lib/types/api.types';
	import {
		METRICS,
		formatMetric,
		type MetricKey,
		type ProgressionResult
	} from '$lib/utils/progression/model';

	let {
		sessions,
		results,
		metric
	}: { sessions: TestSessionDTO[]; results: Record<string, ProgressionResult>; metric: MetricKey } =
		$props();
	let canvas: HTMLCanvasElement;
	let chart: Chart<'line'> | undefined;
	let ready = $state(false);
	let hidden = $state<Set<string>>(new Set());
	const colors = ['#2563eb', '#0f766e', '#7c3aed', '#b45309', '#be185d', '#0369a1'];
	const shapes: PointStyle[] = ['circle', 'rectRot', 'triangle', 'rect', 'crossRot', 'star'];
	const series = $derived.by(() => {
		const entries = new SvelteMap<string, { label: string; slideIndex: number }>();

		for (const session of sessions) {
			for (const slide of results[session.id]?.slides ?? []) {
				entries.set(slide.seriesKey, { label: slide.label, slideIndex: slide.slideIndex });
			}
		}

		return [...entries]
			.sort(([, a], [, b]) => a.slideIndex - b.slideIndex)
			.map(([key, { label, slideIndex }]) => ({
				key,
				label,
				color: colors[(slideIndex + colors.length - 1) % colors.length],
				shape: shapes[(slideIndex + shapes.length - 1) % shapes.length],
				dash: slideIndex > colors.length ? [5, 4] : []
			}));
	});
	const rows = $derived(
		sessions.flatMap((session) =>
			(results[session.id]?.slides ?? [])
				.filter((slide) => !hidden.has(slide.seriesKey))
				.map((slide) => ({ session, slide }))
		)
	);
	const hasValues = $derived(rows.some(({ slide }) => slide.values[metric] !== null));
	const dateLabel = (session: TestSessionDTO, compact = false) =>
		new Date(session.sessionStartTime).toLocaleString(
			'en-GB',
			compact ? { day: 'numeric', month: 'short' } : { dateStyle: 'medium', timeStyle: 'short' }
		);
	const toggle = (key: string) => {
		const next = new SvelteSet(hidden);

		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}

		hidden = next;
	};

	onMount(() => {
		let disposed = false;
		Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip);
		void document.fonts.ready.then(() => {
			if (!disposed) {
				ready = true;
			}
		});

		return () => {
			disposed = true;
			chart?.destroy();
		};
	});

	$effect(() => {
		if (!ready || !canvas) {
			return;
		}

		const selectedMetric = metric;
		const selectedSessions = sessions;
		const selectedResults = results;
		const datasets: ChartDataset<'line'>[] = series.map((item) => ({
			label: item.label,
			data: selectedSessions.map(
				(session) =>
					selectedResults[session.id]?.slides.find((slide) => slide.seriesKey === item.key)?.values[
						selectedMetric
					] ?? null
			),
			hidden: hidden.has(item.key),
			borderColor: item.color,
			backgroundColor: item.color,
			borderWidth: 2,
			borderDash: item.dash,
			pointStyle: item.shape,
			pointRadius: 3,
			pointHoverRadius: 5,
			pointHitRadius: 12,
			tension: 0,
			fill: false,
			spanGaps: false
		}));
		const seriesSnapshot = series;
		const options = {
			responsive: true,
			maintainAspectRatio: false,
			animation: { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180 },
			font: { family: getComputedStyle(canvas).fontFamily, size: 12 },
			color: '#4b5563',
			interaction: { intersect: false, mode: 'nearest' as const },
			layout: { padding: { top: 12, right: 12 } },
			scales: {
				x: {
					border: { display: false },
					grid: { display: false, drawTicks: false },
					ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6, padding: 14, color: '#4b5563' }
				},
				y: {
					beginAtZero: true,
					border: { display: false },
					grid: { color: '#f0f2f5', drawTicks: false },
					ticks: {
						maxTicksLimit: 4,
						padding: 12,
						precision: METRICS[selectedMetric].unit ? undefined : 0,
						color: '#4b5563'
					}
				}
			},
			plugins: {
				tooltip: {
					backgroundColor: '#ffffff',
					titleColor: '#111827',
					bodyColor: '#374151',
					borderColor: '#e5e7eb',
					borderWidth: 1,
					cornerRadius: 8,
					padding: 12,
					displayColors: false,
					callbacks: {
						title: (items: { dataIndex: number }[]) =>
							selectedSessions[items[0]?.dataIndex]
								? dateLabel(selectedSessions[items[0].dataIndex])
								: '',
						label: (item: { dataIndex: number; datasetIndex: number }) => {
							const key = seriesSnapshot[item.datasetIndex]?.key;
							const slide = selectedResults[selectedSessions[item.dataIndex]?.id]?.slides.find(
								(entry) => entry.seriesKey === key
							);

							return slide
								? [
										slide.label,
										`${formatMetric(slide.values[selectedMetric], selectedMetric)} ${METRICS[selectedMetric].unit}`.trim(),
										slide.source === 'saved' ? 'Saved I2MC' : 'Calculated I2MC'
									]
								: '';
						}
					}
				}
			}
		};

		if (chart) {
			chart.data = {
				labels: selectedSessions.map((session) => dateLabel(session, true)),
				datasets
			};
			chart.options = options;
			chart.update();
		} else {
			chart = new Chart<'line'>(canvas, {
				type: 'line',
				data: { labels: selectedSessions.map((session) => dateLabel(session, true)), datasets },
				options
			});
		}
	});
</script>

<div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Visible slides">
	{#each series as item (item.key)}
		<button
			type="button"
			class="inline-flex max-w-full items-center gap-2 rounded-md px-1 py-1 text-left text-xs font-medium text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-600 {hidden.has(
				item.key
			)
				? 'line-through opacity-60'
				: ''}"
			aria-pressed={!hidden.has(item.key)}
			onclick={() => toggle(item.key)}
		>
			<svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true" class="shrink-0"
				><line
					x1="0"
					y1="6"
					x2="24"
					y2="6"
					stroke={item.color}
					stroke-width="2"
					stroke-dasharray={item.dash.join(' ')}
				/>
				{#if item.shape === 'rectRot'}
					<path d="M12 2 L16 6 L12 10 L8 6 Z" fill={item.color} />
				{:else if item.shape === 'triangle'}
					<path d="M12 2 L16 9 L8 9 Z" fill={item.color} />
				{:else if item.shape === 'rect'}
					<rect x="9" y="3" width="6" height="6" fill={item.color} />
				{:else if item.shape === 'crossRot' || item.shape === 'star'}
					<path d="M9 3 L15 9 M9 9 L15 3" stroke={item.color} stroke-width="2" />
					{#if item.shape === 'star'}
						<path d="M12 2 V10 M8 6 H16" stroke={item.color} stroke-width="2" />
					{/if}
				{:else}
					<circle cx="12" cy="6" r="3" fill={item.color} />
				{/if}</svg
			>
			<span class="break-all">{item.label}</span>
		</button>
	{/each}
	{#if series.length > 1}<button
			type="button"
			class="rounded px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600"
			onclick={() => (hidden = new Set())}>Show all</button
		>{/if}
</div>

<div class="relative mt-4 h-[300px] sm:h-[380px]" data-testid="progression-chart">
	<canvas
		bind:this={canvas}
		aria-label={`${METRICS[metric].label} across selected sessions. Exact values are in the table below.`}
	></canvas>
	{#if !hasValues}<div
			class="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center"
		>
			<p class="max-w-sm text-sm leading-6 text-gray-600">
				{series.length
					? 'No values are available for this metric and the visible slides. See the table for details.'
					: 'Analyze selected sessions to display their progression.'}
			</p>
		</div>{/if}
</div>

{#if rows.length}
	<details class="mt-6 border-t border-gray-100 pt-4">
		<summary
			class="cursor-pointer rounded text-sm font-semibold text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
			>Exact values <span class="ml-1 font-normal text-gray-500">({rows.length})</span></summary
		>
		<div class="mt-4 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<caption class="sr-only">{METRICS[metric].label} by session and slide</caption>
				<thead
					><tr class="border-b border-gray-200 text-xs text-gray-600"
						><th scope="col" class="py-3 pr-4 font-medium">Session</th><th
							scope="col"
							class="py-3 pr-4 font-medium">Slide</th
						><th scope="col" class="py-3 pr-4 text-right font-medium"
							>{METRICS[metric].label} {METRICS[metric].unit ? `(${METRICS[metric].unit})` : ''}</th
						><th scope="col" class="py-3 font-medium">Source / availability</th></tr
					></thead
				>
				<tbody
					>{#each rows as { session, slide } (JSON.stringify([session.id, slide.seriesKey]))}<tr
							class="border-b border-gray-100 last:border-0"
							><td class="py-3 pr-4 whitespace-nowrap text-gray-600"
								>{dateLabel(session)}<span class="mt-1 block text-xs text-gray-500"
									>{session.id.slice(0, 8)}</span
								></td
							><td class="max-w-64 py-3 pr-4 break-words text-gray-800">{slide.label}</td><td
								class="py-3 pr-4 text-right font-medium whitespace-nowrap text-gray-900 tabular-nums"
								>{formatMetric(slide.values[metric], metric)}</td
							><td class="max-w-80 py-3 text-xs leading-5 text-gray-600"
								>{slide.error ??
									slide.reasons[metric] ??
									(slide.source === 'saved' ? 'Saved I2MC' : 'Calculated I2MC')}</td
							></tr
						>{/each}</tbody
				>
			</table>
		</div>
	</details>
{/if}
