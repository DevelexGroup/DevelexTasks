<script lang="ts">
	import { resolve } from '$app/paths';
	import { resolveAny } from '$lib/utils/resolveAny';
	import { onMount } from 'svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import FonologieLevel1Data from '$lib/components/tasks/fonologie/data/level1.json';
	import FonologieLevel4Data from '$lib/components/tasks/fonologie/data/level4.json';
	import type {
		FonologieTaskRawDataEntry
	} from '$lib/components/tasks/fonologie/fonologie.types';

	// ── Raw data ────────────────────────────────────────────────────────
	const l1Data = FonologieLevel1Data as FonologieTaskRawDataEntry[];
	const l4Data = FonologieLevel4Data as FonologieTaskRawDataEntry[];
	const allData: FonologieTaskRawDataEntry[] = [...l1Data, ...l4Data];

	// ── Types ───────────────────────────────────────────────────────────
	interface SymbolEntry {
		symbol: string;
		imageSrc: string;
		wordAudioSrc: string;
	}

	interface SoundEntry {
		id: string;
		level: string;
		soundFile: string;
		soundSrc: string;
	}

	// ── Extract unique symbols + all sounds ─────────────────────────────
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const symbolSet = new Set<string>();
	const allSymbols: SymbolEntry[] = [];
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const soundSet = new Set<string>();
	const allSounds: SoundEntry[] = [];

	const levelLabels: Record<string, string> = {
		level1: 'Úroveň 1',
		level2: 'Úroveň 2',
		level3: 'Úroveň 3',
		level4: 'Úroveň 4',
		level5: 'Úroveň 5'
	};

	function addSymbol(sym: string) {
		if (symbolSet.has(sym)) return;
		symbolSet.add(sym);
		const cleanName = sym.replace(/[0-9]+/g, '').replace(/[A-Z]+/g, '');
		allSymbols.push({
			symbol: sym,
			imageSrc: resolveAny(`/images/tasks/fonologie/${sym}.webp`),
			wordAudioSrc: resolveAny(`/sound/fonologie/words/${cleanName}.ogg`)
		});
	}

	for (const entry of allData) {
		for (const sym of entry.sequence) addSymbol(sym);

		if ('model' in entry && entry.model) {
			for (const sym of entry.model) addSymbol(sym);
		}

		const levelNum = entry.level.replace('level', '');
		const soundFile = `${entry.sound}.ogg`;
		const soundKey = `${levelNum}-${soundFile}`;
		if (!soundSet.has(soundKey)) {
			soundSet.add(soundKey);
			allSounds.push({
				id: `${entry.id}-${levelNum}`,
				level: entry.level,
				soundFile,
				soundSrc: resolveAny(`/sound/fonologie/${levelNum}/${soundFile}`)
			});
		}
	}

	// Sort symbols alphabetically
	allSymbols.sort((a, b) => a.symbol.localeCompare(b.symbol, 'cs'));

	// ── Loading / validation state ──────────────────────────────────────
	let imageStatus = $state<Record<string, 'pending' | 'ok' | 'error'>>({});
	let soundStatus = $state<Record<string, 'pending' | 'ok' | 'error'>>({});
	let loadingProgress = $state(0);
	let loadingTotal = $state(0);
	let loadingDone = $state(false);

	let filterStatus = $state<string>('all');

	function onImageLoad(symbol: string) {
		imageStatus = { ...imageStatus, [symbol]: 'ok' };
		loadingProgress++;
	}

	function onImageError(symbol: string) {
		imageStatus = { ...imageStatus, [symbol]: 'error' };
		loadingProgress++;
	}

	function onSoundChecked(key: string, ok: boolean) {
		soundStatus = { ...soundStatus, [key]: ok ? 'ok' : 'error' };
		loadingProgress++;
	}

	// Throttled fetch to avoid ERR_INSUFFICIENT_RESOURCES
	async function runThrottled(tasks: (() => Promise<void>)[], concurrency = 10) {
		let i = 0;
		async function next(): Promise<void> {
			while (i < tasks.length) {
				const task = tasks[i++];
				await task();
			}
		}
		await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => next()));
	}

	// Actively probe all sounds on mount
	onMount(() => {
		// Initialise all statuses to pending
		const imgInit: Record<string, 'pending'> = {};
		for (const s of allSymbols) imgInit[s.symbol] = 'pending';
		imageStatus = imgInit;

		const sndInit: Record<string, 'pending'> = {};
		for (const s of allSymbols) sndInit[`word-${s.symbol}`] = 'pending';
		for (const s of allSounds) sndInit[`task-${s.id}`] = 'pending';
		soundStatus = sndInit;

		loadingTotal = allSymbols.length + allSymbols.length + allSounds.length; // images + word sounds + task sounds
		loadingProgress = 0;

		// Build task list for throttled execution
		const fetchTasks: (() => Promise<void>)[] = [];

		for (const entry of allSymbols) {
			fetchTasks.push(() =>
				fetch(entry.wordAudioSrc, { method: 'HEAD' })
					.then((r) => onSoundChecked(`word-${entry.symbol}`, r.ok))
					.catch(() => onSoundChecked(`word-${entry.symbol}`, false))
			);
		}

		for (const sound of allSounds) {
			fetchTasks.push(() =>
				fetch(sound.soundSrc, { method: 'HEAD' })
					.then((r) => onSoundChecked(`task-${sound.id}`, r.ok))
					.catch(() => onSoundChecked(`task-${sound.id}`, false))
			);
		}

		runThrottled(fetchTasks, 10);
	});

	// Watch progress to mark loading done
	$effect(() => {
		if (loadingTotal > 0 && loadingProgress >= loadingTotal) {
			loadingDone = true;
		}
	});

	// ── Derived stats ───────────────────────────────────────────────────
	const imageErrorCount = $derived(
		Object.values(imageStatus).filter((v) => v === 'error').length
	);
	const wordSoundErrorCount = $derived(
		Object.entries(soundStatus)
			.filter(([k, v]) => k.startsWith('word-') && v === 'error')
			.length
	);
	const taskSoundErrorCount = $derived(
		Object.entries(soundStatus)
			.filter(([k, v]) => k.startsWith('task-') && v === 'error')
			.length
	);
	const progressPercent = $derived(
		loadingTotal > 0 ? Math.round((loadingProgress / loadingTotal) * 100) : 0
	);

	// ── Filtering ───────────────────────────────────────────────────────
	const filteredSymbols = $derived.by(() => {
		if (filterStatus === 'all') return allSymbols;
		if (filterStatus === 'ok')
			return allSymbols.filter(
				(s) => imageStatus[s.symbol] !== 'error' && soundStatus[`word-${s.symbol}`] !== 'error'
			);
		if (filterStatus === 'image-error')
			return allSymbols.filter((s) => imageStatus[s.symbol] === 'error');
		if (filterStatus === 'sound-error')
			return allSymbols.filter((s) => soundStatus[`word-${s.symbol}`] === 'error');
		return allSymbols;
	});

	const filteredTaskSounds = $derived.by(() => {
		if (filterStatus === 'task-sound-error')
			return allSounds.filter((s) => soundStatus[`task-${s.id}`] === 'error');
		return allSounds;
	});
</script>

<svelte:head>
	<title>Fonologie Showcase - DeveLex Tasks</title>
</svelte:head>

<DefaultLayout>
	<div class="mb-4 flex items-center gap-4">
		<a
			href={resolve('/admin')}
			class="text-sm font-semibold text-blue-600 hover:underline"
		>
			← Zpět na administraci
		</a>
	</div>

	<h1 class="text-2xl font-black text-gray-800">Fonologie – Showcase obrázků a zvuků</h1>
	<p class="text-sm text-gray-500">
		Zobrazení všech obrázků a zvuků ze všech úrovní fonologie. Kliknutím na kartu přehrajete zvuk slova.
	</p>

	<!-- Loading bar -->
	{#if !loadingDone}
		<div class="loading-bar mt-4">
			<div class="loading-bar__track">
				<div class="loading-bar__fill" style="width: {progressPercent}%"></div>
			</div>
			<span class="loading-bar__label">
				Ověřování souborů… {loadingProgress} / {loadingTotal} ({progressPercent}%)
			</span>
		</div>
	{/if}

	<!-- Stats bar -->
	<div class="mt-4 flex flex-wrap gap-3">
		<span class="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800">
			Symbolů: {allSymbols.length}
		</span>
		<span class="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800">
			Zvuků úloh: {allSounds.length}
		</span>
		{#if loadingDone}
			<span
				class="rounded-md px-3 py-1.5 text-xs font-semibold {imageErrorCount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}"
			>
				Chybějící obrázky: {imageErrorCount}
			</span>
			<span
				class="rounded-md px-3 py-1.5 text-xs font-semibold {wordSoundErrorCount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}"
			>
				Chybějící zvuky slov: {wordSoundErrorCount}
			</span>
			<span
				class="rounded-md px-3 py-1.5 text-xs font-semibold {taskSoundErrorCount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}"
			>
				Chybějící zvuky úloh: {taskSoundErrorCount}
			</span>
		{:else}
			<span class="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
				⏳ Načítání…
			</span>
		{/if}
	</div>

	<!-- Filters -->
	<div class="mt-4 flex flex-wrap items-center gap-4">
		<label class="flex items-center gap-2 text-sm font-medium text-gray-700">
			Filtr:
			<select
				bind:value={filterStatus}
				class="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
			>
				<option value="all">Vše</option>
				<option value="ok">OK (bez chyb)</option>
				<option value="image-error">Chybějící obrázek</option>
				<option value="sound-error">Chybějící zvuk slova</option>
				<option value="task-sound-error">Chybějící zvuk úlohy</option>
			</select>
		</label>
	</div>

	<!-- Images section -->
	{#if filterStatus !== 'task-sound-error'}
		<section class="mt-8">
			<h2 class="mb-1 text-xl font-bold text-gray-800">
				Obrázky
				<span class="text-sm font-normal text-gray-500">
					({filteredSymbols.length} symbolů)
				</span>
			</h2>

			{#if filteredSymbols.length === 0}
				<p class="mt-2 text-sm italic text-gray-400">Žádné symboly pro zvolený filtr.</p>
			{:else}
				<div class="symbols-grid mt-4">
					{#each filteredSymbols as entry (entry.symbol)}
						{@const imgState = imageStatus[entry.symbol]}
						{@const sndState = soundStatus[`word-${entry.symbol}`]}
						{@const hasImageError = imgState === 'error'}
						{@const hasSoundError = sndState === 'error'}
						<button
							type="button"
							class="symbol-card"
							class:error={hasImageError || hasSoundError}
							onclick={() => {
								if (!hasSoundError) {
									const a = new Audio(entry.wordAudioSrc);
									a.play();
								}
							}}
						>
							<span class="symbol-card__image">
								<img
									src={entry.imageSrc}
									alt={entry.symbol}
									loading="lazy"
									onload={() => onImageLoad(entry.symbol)}
									onerror={() => onImageError(entry.symbol)}
								/>
							</span>

							<span class="symbol-card__info">
								<span class="symbol-card__name" title={entry.symbol}>
									{entry.symbol}
								</span>
							</span>

							{#if hasImageError}
								<span class="missing-badge missing-badge--image">Obrázek</span>
							{/if}
							{#if hasSoundError}
								<span class="missing-badge missing-badge--sound">Zvuk</span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</section>
	{/if}

	<!-- Task sounds section -->
	{#if filterStatus === 'all' || filterStatus === 'task-sound-error'}
		<section class="mt-10">
			<h2 class="mb-1 text-xl font-bold text-gray-800">
				Zvuky úloh
				<span class="text-sm font-normal text-gray-500">
					({filteredTaskSounds.length} zvuků)
				</span>
			</h2>

			{#if filteredTaskSounds.length === 0}
				<p class="mt-2 text-sm italic text-gray-400">Žádné zvuky pro zvolený filtr.</p>
			{:else}
				<div class="sounds-grid mt-4">
					{#each filteredTaskSounds as sound (sound.id)}
						{@const state = soundStatus[`task-${sound.id}`]}
						{@const hasSoundErr = state === 'error'}
						<div class="sound-item" class:error={hasSoundErr}>
							<div class="sound-item__info">
								<span class="text-xs font-mono">{sound.soundFile}</span>
								<span class="text-[10px] text-gray-400">{levelLabels[sound.level] ?? sound.level}</span>
							</div>
							<button
								type="button"
								class="sound-btn-sm"
								class:sound-error={hasSoundErr}
								title={hasSoundErr ? 'Zvuk nenalezen' : 'Přehrát'}
								onclick={() => {
									if (!hasSoundErr) {
										const a = new Audio(sound.soundSrc);
										a.play();
									}
								}}
							>
								{hasSoundErr ? '🔇' : '▶'}
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</DefaultLayout>

<style>
	.loading-bar {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.loading-bar__track {
		width: 100%;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		overflow: hidden;
	}

	.loading-bar__fill {
		height: 100%;
		background: #3b82f6;
		border-radius: 4px;
		transition: width 0.2s ease;
	}

	.loading-bar__label {
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
	}

	.symbols-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 12px;
	}

	.symbol-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10px 8px 8px;
		border-radius: 10px;
		border: none;
		background: white;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
		transition: box-shadow 0.2s;
		cursor: pointer;
	}

	.symbol-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	.symbol-card.error {
		border: 2px solid #ef4444;
		background: #fef2f2;
	}

	.symbol-card__image {
		position: relative;
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.symbol-card__image img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.missing-badge {
		font-size: 9px;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 4px;
		color: white;
		display: inline-block;
		margin-top: 4px;
	}

	.missing-badge--image {
		background: #ef4444;
	}

	.missing-badge--sound {
		background: #f59e0b;
	}

	.symbol-card__info {
		margin-top: 6px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		width: 100%;
	}

	.symbol-card__name {
		font-size: 11px;
		font-weight: 600;
		color: #374151;
		word-break: break-all;
	}


	.sounds-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 8px;
	}

	.sound-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 10px;
		border-radius: 6px;
		background: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.sound-item__info {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.sound-item.error {
		border: 1px solid #ef4444;
		background: #fef2f2;
	}

	.sound-btn-sm {
		cursor: pointer;
		border: none;
		background: none;
		font-size: 13px;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.sound-btn-sm:hover {
		background: #f3f4f6;
	}

	.sound-btn-sm.sound-error {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

