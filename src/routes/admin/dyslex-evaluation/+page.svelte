<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onDestroy, onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import BackButton from '$lib/components/layout/BackButton.svelte';
	import { getAllUsers } from '$lib/api/user-management';
	import type { UserDTO } from '$lib/types/api.types';
	import {
		createDyslexEvaluation,
		downloadDyslexResult,
		getDyslexCandidates,
		getDyslexEvaluation,
		getDyslexEvaluations,
		type DyslexCandidatesResponse,
		type DyslexEvaluation,
		type DyslexEvaluationStatus,
		type DyslexModelResult,
		type DyslexPreprocessingSettings,
		type DyslexTaskKey
	} from '$lib/api/dyslex-evaluations';
	import {
		areDyslexSettingsValid,
		DEFAULT_DYSLEX_SETTINGS,
		DYSLEX_TASK_KEYS,
		isDyslexEvaluationActive
	} from '$lib/utils/dyslexEvaluation';
	import { pushParams, switchParams } from '$lib/utils/urlState';

	const taskResultOrder = [
		['T1_Syllables', 'Slabiky'],
		['T4_Meaningful_Text', 'Meaningful text'],
		['T5_Pseudo_Text', 'Pseudotext'],
		['T6_Visual_Diff_1', 'Visual difference · snímek 1'],
		['T6_Visual_Diff_2', 'Visual difference · snímek 2']
	] as const;
	const modelOrder = ['3NN', 'MLP', 'CNN-RN18', 'CNN-RN50'];
	const statusLabels: Record<DyslexEvaluationStatus, string> = {
		SUBMITTING: 'Odesílání',
		QUEUED: 'Ve frontě',
		PROCESSING: 'Zpracování',
		CLASSIFYING: 'Klasifikace',
		COMPLETED: 'Dokončeno',
		FAILED: 'Selhalo'
	};
	let users = $state<UserDTO[]>([]);
	let candidates = $state<DyslexCandidatesResponse | null>(null);
	let evaluations = $state<DyslexEvaluation[]>([]);
	let evaluationDetail = $state<DyslexEvaluation | null>(null);
	let selectedSessions = $state<Record<DyslexTaskKey, string>>({
		syllables: '',
		meantext: '',
		pseudotext: '',
		visdiff: ''
	});
	let settings = $state<DyslexPreprocessingSettings>({ ...DEFAULT_DYSLEX_SETTINGS });
	let userSearch = $state('');
	let isLoadingUsers = $state(true);
	let isLoadingSubject = $state(false);
	let isLoadingDetail = $state(false);
	let isSubmitting = $state(false);
	let isDownloading = $state(false);
	let loadedUserId = $state('');
	let requestedDetailId = $state('');
	let error = $state('');
	let failedOperation = $state<'users' | 'subject' | 'detail' | 'poll' | ''>('');
	let resultsScroll = $state<HTMLElement | null>(null);
	let pollTimer: ReturnType<typeof setInterval> | undefined;

	let activeUserId = $derived(page.url.searchParams.get('user') ?? '');
	let activeEvaluationId = $derived(page.url.searchParams.get('evaluation') ?? '');
	let filteredUsers = $derived.by(() => {
		const query = userSearch.trim().toLowerCase();
		return users.filter((user) =>
			`${user.firstName ?? ''} ${user.lastName ?? ''} ${user.username}`
				.toLowerCase()
				.includes(query)
		);
	});
	let allSlotsSelected = $derived(
		DYSLEX_TASK_KEYS.every((key) => {
			const task = candidates?.tasks.find((item) => item.key === key);
			return task?.sessions.some(
				(session) => session.available && session.sessionId === selectedSessions[key]
			);
		})
	);
	let settingsValid = $derived(areDyslexSettingsValid(settings));
	let hasPendingEvaluation = $derived(
		evaluations.some((item) => isDyslexEvaluationActive(item.status))
	);
	let canSubmit = $derived(
		allSlotsSelected && settingsValid && !isSubmitting && !hasPendingEvaluation
	);

	$effect(() => {
		const userId = activeUserId;
		if (userId && userId !== loadedUserId) {
			void loadSubject(userId);
		}
	});

	$effect(() => {
		const evaluationId = activeEvaluationId;
		if (evaluationId && evaluationId !== requestedDetailId) {
			void loadDetail(evaluationId);
		} else {
			if (!evaluationId) {
				evaluationDetail = null;
				requestedDetailId = '';
			}
		}
	});

	onMount(() => {
		void loadUsers();
		pollTimer = setInterval(() => {
			if (!document.hidden && activeUserId && hasPendingEvaluation) {
				void pollActiveEvaluations();
			}
		}, 5000);
	});

	onDestroy(() => {
		if (pollTimer) {
			clearInterval(pollTimer);
		}
	});

	const displayName = (user: UserDTO): string => {
		const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
		return name || user.username;
	};

	const formatDate = (value: string | null): string =>
		value
			? new Intl.DateTimeFormat('cs-CZ', {
					dateStyle: 'medium',
					timeStyle: 'short'
				}).format(new Date(value))
			: '—';

	const errorMessage = (cause: unknown, fallback: string): string => {
		if (!(cause instanceof Error)) {
			return fallback;
		}

		try {
			const parsed = JSON.parse(cause.message) as { message?: string; detail?: string };
			return parsed.message ?? parsed.detail ?? fallback;
		} catch {
			return cause.message || fallback;
		}
	};

	const statusClass = (status: DyslexEvaluationStatus): string => {
		if (status === 'COMPLETED') {
			return 'bg-emerald-100 text-emerald-800';
		}
		if (status === 'FAILED') {
			return 'bg-red-100 text-red-800';
		}

		return 'bg-blue-100 text-blue-800';
	};

	const outcomeLabel = (outcome: string): string => {
		if (outcome === 'DYSLEXIC') {
			return 'Dyslektický';
		}
		if (outcome === 'INTACT') {
			return 'Intaktní';
		}

		return 'Nejednoznačný';
	};

	const currentTaskLabel = (task: string | null, status: DyslexEvaluationStatus): string =>
		taskResultOrder.find(([taskId]) => taskId === task)?.[1] ?? statusLabels[status];

	const probability = (result: DyslexModelResult | undefined, label: 'D' | 'I'): string =>
		result ? `${(result.probabilities[label] * 100).toFixed(1)}%` : '—';

	const scrollResults = (): void => {
		resultsScroll?.scrollBy({ left: 180, behavior: 'smooth' });
	};

	const loadUsers = async (): Promise<void> => {
		isLoadingUsers = true;
		error = '';
		failedOperation = '';
		try {
			users = (await getAllUsers()).sort((a, b) => displayName(a).localeCompare(displayName(b)));
		} catch (cause) {
			error = errorMessage(cause, 'Uživatele se nepodařilo načíst.');
			failedOperation = 'users';
		} finally {
			isLoadingUsers = false;
		}
	};

	const loadSubject = async (userId: string): Promise<void> => {
		loadedUserId = userId;
		isLoadingSubject = true;
		error = '';
		failedOperation = '';
		candidates = null;
		evaluations = [];
		evaluationDetail = null;
		requestedDetailId = '';
		selectedSessions = { syllables: '', meantext: '', pseudotext: '', visdiff: '' };
		try {
			const [nextCandidates, nextEvaluations] = await Promise.all([
				getDyslexCandidates(userId),
				getDyslexEvaluations(userId)
			]);
			if (activeUserId !== userId) {
				return;
			}

			candidates = nextCandidates;
			evaluations = nextEvaluations;
		} catch (cause) {
			if (activeUserId !== userId) {
				return;
			}

			error = errorMessage(cause, 'Data pro výpočet dyslexie se nepodařilo načíst.');
			failedOperation = 'subject';
		} finally {
			if (activeUserId === userId) {
				isLoadingSubject = false;
			}
		}
	};

	const loadDetail = async (evaluationId: string): Promise<void> => {
		requestedDetailId = evaluationId;
		evaluationDetail = null;
		isLoadingDetail = true;
		try {
			const detail = await getDyslexEvaluation(evaluationId);
			if (activeEvaluationId !== evaluationId) {
				return;
			}

			evaluationDetail = detail;
			if (failedOperation === 'detail') {
				error = '';
				failedOperation = '';
			}
		} catch (cause) {
			if (activeEvaluationId !== evaluationId) {
				return;
			}

			error = errorMessage(cause, 'Detail výpočtu se nepodařilo načíst.');
			failedOperation = 'detail';
		} finally {
			if (activeEvaluationId === evaluationId) {
				isLoadingDetail = false;
			}
		}
	};

	const pollActiveEvaluations = async (): Promise<void> => {
		const userId = activeUserId;
		const evaluationId = activeEvaluationId;
		try {
			const nextEvaluations = await getDyslexEvaluations(userId);
			const nextDetail = evaluationId ? await getDyslexEvaluation(evaluationId) : null;
			if (activeUserId !== userId || activeEvaluationId !== evaluationId) {
				return;
			}

			evaluations = nextEvaluations;
			if (nextDetail) {
				evaluationDetail = nextDetail;
			}
			if (failedOperation === 'poll') {
				error = '';
				failedOperation = '';
			}
		} catch (cause) {
			if (activeUserId !== userId || activeEvaluationId !== evaluationId) {
				return;
			}

			error = errorMessage(
				cause,
				'Průběh se nepodařilo aktualizovat. Další pokus proběhne automaticky.'
			);
			failedOperation = 'poll';
		}
	};

	const retryFailedOperation = (): void => {
		if (failedOperation === 'users') {
			void loadUsers();
		} else if (failedOperation === 'subject' && activeUserId) {
			void loadSubject(activeUserId);
		} else if (failedOperation === 'detail' && activeEvaluationId) {
			void loadDetail(activeEvaluationId);
		} else if (failedOperation === 'poll') {
			void pollActiveEvaluations();
		}
	};

	const submitEvaluation = async (): Promise<void> => {
		if (!canSubmit || !activeUserId) {
			return;
		}

		isSubmitting = true;
		error = '';
		try {
			const evaluation = await createDyslexEvaluation({
				userId: activeUserId,
				syllablesSessionId: selectedSessions.syllables,
				meantextSessionId: selectedSessions.meantext,
				pseudotextSessionId: selectedSessions.pseudotext,
				visdiffSessionId: selectedSessions.visdiff,
				preprocessingSettings: { ...settings }
			});
			evaluations = [evaluation, ...evaluations];
			evaluationDetail = evaluation;
			requestedDetailId = evaluation.id;
			await switchParams({ evaluation: evaluation.id });
		} catch (cause) {
			error = errorMessage(cause, 'Výpočet se nepodařilo odeslat.');
		} finally {
			isSubmitting = false;
		}
	};

	const retryAsNew = (evaluation: DyslexEvaluation): void => {
		const nextSelection = { syllables: '', meantext: '', pseudotext: '', visdiff: '' };
		let unavailableSources = 0;
		for (const source of evaluation.sources) {
			const sourceIsAvailable = candidates?.tasks
				.find((task) => task.key === source.key)
				?.sessions.some((session) => session.available && session.sessionId === source.sessionId);
			if (source.sessionId && sourceIsAvailable) {
				nextSelection[source.key] = source.sessionId;
			} else {
				unavailableSources++;
			}
		}
		selectedSessions = nextSelection;
		settings = { ...evaluation.preprocessingSettings };
		if (unavailableSources > 0) {
			error =
				unavailableSources === 1
					? 'Jedno dříve použité zdrojové sezení již není dostupné. Před odesláním vyberte náhradu.'
					: `${unavailableSources} dříve použitá zdrojová sezení již nejsou dostupná. Před odesláním vyberte náhradu.`;
			failedOperation = '';
		}
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const downloadResult = async (evaluation: DyslexEvaluation): Promise<void> => {
		isDownloading = true;
		error = '';
		try {
			const blob = await downloadDyslexResult(evaluation.id);
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = `dyslex-evaluation-${evaluation.id}.json`;
			anchor.click();
			URL.revokeObjectURL(url);
		} catch (cause) {
			error = errorMessage(cause, 'Původní výsledek se nepodařilo stáhnout.');
		} finally {
			isDownloading = false;
		}
	};
</script>

<svelte:head>
	<title>Dyslex výpočty – DeveLex Tasks</title>
	<meta
		name="description"
		content="Spouštění a kontrola výpočtů dyslexie ze zaznamenaných dat pohledu."
	/>
</svelte:head>

<DefaultLayout wide>
	<BackButton label="Zpět do administrace" onclick={() => goto(resolve('/admin'))} />

	<header class="max-w-3xl">
		<h1 class="text-3xl font-black tracking-[-0.025em] text-gray-900">Dyslex výpočty</h1>
		<p class="mt-2 text-sm leading-6 text-gray-600">
			Pro každou úlohu vyberte jedno platné sezení. Poté můžete sledovat průběh zpracování a
			zkontrolovat uložený výsledek.
		</p>
	</header>

	{#if error}
		<div
			role="alert"
			class="flex items-start justify-between gap-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
		>
			<span>{error}</span>
			{#if failedOperation}
				<button class="font-semibold underline underline-offset-4" onclick={retryFailedOperation}
					>Zkusit znovu</button
				>
			{:else}
				<button class="font-semibold underline underline-offset-4" onclick={() => (error = '')}
					>Zavřít</button
				>
			{/if}
		</div>
	{/if}

	<div class="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
		<aside class="overflow-hidden rounded-xl bg-white shadow-md shadow-gray-300/50">
			<div class="border-b border-gray-100 p-4">
				<label
					for="dyslex-user-search"
					class="mb-2 block text-xs font-bold text-gray-600 uppercase"
				>
					Účastník
				</label>
				<div class="relative">
					<Icon
						icon="material-symbols:search"
						class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
					/>
					<input
						id="dyslex-user-search"
						bind:value={userSearch}
						placeholder="Hledat uživatele"
						class="w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
					/>
				</div>
			</div>

			<div class="max-h-80 overflow-y-auto lg:max-h-[calc(100vh-17rem)]">
				{#if isLoadingUsers}
					<p class="px-4 py-8 text-center text-sm text-gray-500">Načítání uživatelů…</p>
				{:else if failedOperation === 'users'}
					<p class="px-4 py-8 text-center text-sm text-gray-500">Seznam uživatelů není dostupný.</p>
				{:else if filteredUsers.length === 0}
					<p class="px-4 py-8 text-center text-sm text-gray-500">Žádní odpovídající uživatelé.</p>
				{:else}
					{#each filteredUsers as user (user.id)}
						<button
							type="button"
							class="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 focus-visible:ring-3 focus-visible:ring-blue-300 focus-visible:outline-none focus-visible:ring-inset {user.id ===
							activeUserId
								? 'bg-blue-50'
								: ''}"
							aria-current={user.id === activeUserId ? 'true' : undefined}
							onclick={() => pushParams({ user: user.id, evaluation: null })}
						>
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold text-gray-900"
									>{displayName(user)}</span
								>
								<span class="block truncate text-xs text-gray-500">@{user.username}</span>
							</span>
							<Icon icon="material-symbols:chevron-right" class="h-5 w-5 shrink-0 text-gray-400" />
						</button>
					{/each}
				{/if}
			</div>
		</aside>

		{#if !activeUserId}
			<section
				class="flex min-h-64 items-center justify-center rounded-xl bg-white px-6 text-center shadow-md shadow-gray-300/50"
			>
				<div class="max-w-md">
					<Icon
						icon="material-symbols:person-search-outline"
						class="mx-auto h-10 w-10 text-blue-600"
					/>
					<h2 class="mt-4 text-lg font-bold text-gray-900">Vyberte účastníka</h2>
					<p class="mt-1 text-sm leading-6 text-gray-600">
						Zobrazí se odpovídající sezení Dyslex a historie předchozích výpočtů.
					</p>
				</div>
			</section>
		{:else if isLoadingSubject}
			<section
				class="flex min-h-64 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50"
			>
				<div class="flex items-center gap-3 text-sm font-medium text-gray-600">
					<Icon icon="mdi:loading" class="h-5 w-5 animate-spin text-blue-600" />
					Načítání sezení a historie…
				</div>
			</section>
		{:else if candidates}
			<div class="min-w-0 space-y-8">
				<section class="rounded-xl bg-white p-5 shadow-md shadow-gray-300/50 sm:p-6">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 class="text-xl font-black text-gray-900">Nový výpočet</h2>
							<p class="mt-1 text-sm text-gray-600">
								{candidates.displayName} <span class="text-gray-400">@{candidates.username}</span>
							</p>
						</div>
						{#if hasPendingEvaluation}
							<span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
								Jeden výpočet již probíhá
							</span>
						{/if}
					</div>

					<div class="mt-6 grid gap-4 xl:grid-cols-2">
						{#each candidates.tasks as task (task.key)}
							<div class="rounded-xl border border-gray-200 p-4">
								<div class="flex items-start justify-between gap-3">
									<div>
										<h3 class="text-sm font-bold text-gray-900">
											{task.key === 'syllables' ? 'Slabiky' : task.label}
										</h3>
										<p class="mt-0.5 text-xs text-gray-500">
											{task.requiredSlides.length === 1
												? 'Požadovaný snímek'
												: 'Požadované snímky'}: {task.requiredSlides.join(', ')}
										</p>
									</div>
									{#if selectedSessions[task.key]}
										<Icon icon="material-symbols:check-circle" class="h-5 w-5 text-emerald-600" />
									{/if}
								</div>

								<label
									for={`session-${task.key}`}
									class="mt-4 mb-1.5 block text-xs font-semibold text-gray-700"
								>
									Zdrojové sezení
								</label>
								<select
									id={`session-${task.key}`}
									bind:value={selectedSessions[task.key]}
									class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:bg-gray-100"
									disabled={!task.sessions.some((session) => session.available)}
								>
									<option value="">Vyberte sezení</option>
									{#each task.sessions as session (session.sessionId)}
										<option value={session.sessionId} disabled={!session.available}>
											{formatDate(session.sessionStartTime)}{session.available
												? ''
												: ' — nedostupné'}
										</option>
									{/each}
								</select>

								{#if task.sessions.length === 0}
									<p class="mt-2 text-xs leading-5 text-amber-800">
										Nebyla zaznamenána žádná odpovídající sezení.
									</p>
								{:else if !task.sessions.some((session) => session.available)}
									<p class="mt-2 text-xs leading-5 text-amber-800">
										Žádné sezení nyní nesplňuje kontrolu vstupních dat.
									</p>
								{/if}
								{#each task.sessions.filter((session) => !session.available) as session (session.sessionId)}
									<p class="mt-2 text-xs leading-5 text-gray-500">
										{formatDate(session.sessionStartTime)}: {session.issues.join('; ')}
									</p>
								{/each}
							</div>
						{/each}
					</div>

					<details class="group mt-5 rounded-xl bg-gray-50 p-4">
						<summary
							class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-gray-900"
						>
							Pokročilé nastavení předzpracování
							<Icon
								icon="material-symbols:expand-more"
								class="h-5 w-5 transition-transform group-open:rotate-180"
							/>
						</summary>
						<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<label class="text-xs font-semibold text-gray-700">
								Vzorkovací frekvence (Hz)
								<input
									type="number"
									min="10"
									step="10"
									bind:value={settings.frequencyHz}
									class="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
								/>
							</label>
							<label class="text-xs font-semibold text-gray-700">
								Šířka obrazovky (cm)
								<input
									type="number"
									min="0.01"
									step="0.01"
									bind:value={settings.screenWidthCm}
									class="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
								/>
							</label>
							<label class="text-xs font-semibold text-gray-700">
								Výška obrazovky (cm)
								<input
									type="number"
									min="0.01"
									step="0.01"
									bind:value={settings.screenHeightCm}
									class="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
								/>
							</label>
							<label class="text-xs font-semibold text-gray-700">
								Pozorovací vzdálenost (cm)
								<input
									type="number"
									min="0.01"
									step="0.01"
									bind:value={settings.screenDistanceCm}
									class="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
								/>
							</label>
							<label class="text-xs font-semibold text-gray-700">
								Šířka rozlišení (px)
								<input
									type="number"
									min="1"
									step="1"
									bind:value={settings.screenWidthPx}
									class="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
								/>
							</label>
							<label class="text-xs font-semibold text-gray-700">
								Výška rozlišení (px)
								<input
									type="number"
									min="1"
									step="1"
									bind:value={settings.screenHeightPx}
									class="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
								/>
							</label>
						</div>
						{#if !settingsValid}
							<p class="mt-3 text-xs text-red-700">
								Použijte kladné hodnoty, celočíselné rozlišení a frekvenci dělitelnou deseti.
							</p>
						{/if}
					</details>

					<div
						class="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-end sm:justify-between"
					>
						<div>
							<p class="text-sm font-bold text-gray-900">Souhrn výběru</p>
							<p class="mt-1 text-xs leading-5 text-gray-600">
								Připravené úlohy: {DYSLEX_TASK_KEYS.filter((key) => selectedSessions[key]).length}
								ze 4 · {settings.frequencyHz} Hz · {settings.screenWidthPx} × {settings.screenHeightPx}
								px
							</p>
							{#if hasPendingEvaluation}
								<p class="mt-1 text-xs text-amber-800">
									Před spuštěním dalšího výpočtu počkejte na dokončení aktivního výpočtu.
								</p>
							{/if}
						</div>
						<button
							type="button"
							class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:ring-3 focus-visible:ring-blue-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-blue-300"
							disabled={!canSubmit}
							onclick={submitEvaluation}
						>
							{#if isSubmitting}
								<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
								Odesílání…
							{:else}
								<Icon icon="material-symbols:play-arrow" class="h-5 w-5" />
								Spustit výpočet
							{/if}
						</button>
					</div>
				</section>

				<section>
					<div class="mb-3 flex items-end justify-between gap-4">
						<div>
							<h2 class="text-xl font-black text-gray-900">Historie výpočtů</h2>
							<p class="mt-1 text-sm text-gray-600">
								Výpočty zůstávají dostupné s původními zdroji a nastavením.
							</p>
						</div>
						{#if hasPendingEvaluation}
							<span class="inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
								<span class="h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
								Automatická aktualizace
							</span>
						{/if}
					</div>

					{#if evaluations.length === 0}
						<div class="rounded-xl bg-white px-6 py-12 text-center shadow-md shadow-gray-300/50">
							<p class="text-sm font-semibold text-gray-700">Zatím nebyl spuštěn žádný výpočet.</p>
							<p class="mt-1 text-xs text-gray-500">
								Vyplňte čtyři úlohy výše a spusťte první výpočet.
							</p>
						</div>
					{:else}
						<div class="overflow-hidden rounded-xl bg-white shadow-md shadow-gray-300/50">
							{#each evaluations as evaluation (evaluation.id)}
								<button
									type="button"
									class="flex w-full flex-col gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors last:border-0 hover:bg-gray-50 focus-visible:ring-3 focus-visible:ring-blue-300 focus-visible:outline-none focus-visible:ring-inset sm:flex-row sm:items-center sm:justify-between {evaluation.id ===
									activeEvaluationId
										? 'bg-blue-50'
										: ''}"
									aria-current={evaluation.id === activeEvaluationId ? 'true' : undefined}
									onclick={() => switchParams({ evaluation: evaluation.id })}
								>
									<div>
										<span class="text-sm font-bold text-gray-900"
											>{formatDate(evaluation.createdAt)}</span
										>
										<p class="mt-0.5 text-xs text-gray-500">
											Spustil uživatel @{evaluation.requestedByUsername}
										</p>
									</div>
									<div class="flex items-center gap-3">
										{#if isDyslexEvaluationActive(evaluation.status)}
											<span class="text-xs text-gray-500"
												>{evaluation.completedTasks}/{evaluation.totalTasks} úloh</span
											>
										{:else if evaluation.summary}
											<span class="text-xs font-semibold text-gray-600"
												>{evaluation.summary.dyslexicVotes} D / {evaluation.summary.intactVotes} I</span
											>
										{/if}
										<span
											class={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(evaluation.status)}`}
											>{statusLabels[evaluation.status]}</span
										>
										<Icon icon="material-symbols:chevron-right" class="h-5 w-5 text-gray-400" />
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</section>

				{#if activeEvaluationId}
					<section class="rounded-xl bg-white p-5 shadow-md shadow-gray-300/50 sm:p-6">
						{#if isLoadingDetail && !evaluationDetail}
							<div class="flex min-h-32 items-center justify-center gap-3 text-sm text-gray-600">
								<Icon icon="mdi:loading" class="h-5 w-5 animate-spin text-blue-600" /> Načítání výsledku…
							</div>
						{:else if evaluationDetail}
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div>
									<h2 class="text-xl font-black text-gray-900">Detail výpočtu</h2>
									<p class="mt-1 text-xs text-gray-500">Výpočet {evaluationDetail.id}</p>
								</div>
								<span
									aria-live="polite"
									class={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(evaluationDetail.status)}`}
									>{statusLabels[evaluationDetail.status]}</span
								>
							</div>

							{#if isDyslexEvaluationActive(evaluationDetail.status)}
								<div class="mt-6">
									<div class="mb-2 flex justify-between gap-3 text-xs font-semibold text-gray-600">
										<span
											>{currentTaskLabel(
												evaluationDetail.currentTask,
												evaluationDetail.status
											)}</span
										>
										<span
											>{evaluationDetail.completedTasks} z {evaluationDetail.totalTasks} úloh</span
										>
									</div>
									<section
										class="h-2 overflow-hidden rounded-full bg-gray-100"
										role="progressbar"
										aria-label="Průběh výpočtu"
										aria-valuemin="0"
										aria-valuemax={evaluationDetail.totalTasks}
										aria-valuenow={evaluationDetail.completedTasks}
									>
										<div
											class="h-full rounded-full bg-blue-600 transition-[width] duration-500"
											style={`width: ${Math.max(4, (evaluationDetail.completedTasks / evaluationDetail.totalTasks) * 100)}%`}
										></div>
									</section>
								</div>
							{:else if evaluationDetail.status === 'FAILED'}
								<div class="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">
									<p class="font-bold">Výpočet selhal</p>
									<p class="mt-1 leading-6">
										{evaluationDetail.errorMessage ?? 'Výpočetní služba neposkytla popis chyby.'}
									</p>
									<button
										class="mt-3 font-bold underline underline-offset-4"
										onclick={() => retryAsNew(evaluationDetail!)}
										>Použít tyto vstupy pro nový výpočet</button
									>
								</div>
							{:else if evaluationDetail.summary && evaluationDetail.result}
								<div class="mt-6 grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
									<div class="rounded-xl bg-blue-50 p-5 text-blue-950">
										<p class="text-sm font-semibold">
											Souhrn {evaluationDetail.summary.totalVotes} hlasů modelů
										</p>
										<p class="mt-2 text-2xl font-black tracking-[-0.025em]">
											Souhrnný výsledek: {outcomeLabel(evaluationDetail.summary.outcome)}
										</p>
										<p class="mt-2 text-xs leading-5 text-blue-900">
											Jde o většinu hlasů modelů, nikoli o klinickou diagnózu.
										</p>
										<div class="mt-4 flex gap-4 text-sm tabular-nums">
											<span>D: <strong>{evaluationDetail.summary.dyslexicVotes}</strong></span>
											<span>I: <strong>{evaluationDetail.summary.intactVotes}</strong></span>
										</div>
										<p class="mt-3 text-xs leading-5 text-blue-900">
											Nejde o další samostatný model.
										</p>
									</div>

									<section
										bind:this={resultsScroll}
										class="min-w-0 overflow-x-auto focus-visible:ring-3 focus-visible:ring-blue-200 focus-visible:outline-none"
										aria-label="Pravděpodobnosti podle úloh a modelů"
									>
										<button
											type="button"
											class="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 underline underline-offset-4 sm:hidden"
											onclick={scrollResults}
										>
											Zobrazit další modely
											<Icon icon="material-symbols:arrow-forward" class="h-4 w-4" />
										</button>
										<table
											class="w-full min-w-[42rem] border-collapse text-left text-xs tabular-nums"
										>
											<thead>
												<tr class="border-b border-gray-200 text-gray-500">
													<th class="px-3 py-2 font-semibold">Úloha</th>
													{#each modelOrder as model}
														<th class="px-3 py-2 font-semibold">{model}</th>
													{/each}
												</tr>
											</thead>
											<tbody>
												{#each taskResultOrder as [taskId, taskLabel]}
													<tr class="border-b border-gray-100 last:border-0">
														<th class="px-3 py-3 font-semibold text-gray-800">{taskLabel}</th>
														{#each modelOrder as model}
															{@const modelResult =
																evaluationDetail.result.tasks[taskId]?.models[model]}
															<td class="px-3 py-3 text-gray-600">
																<span class="font-bold text-gray-900"
																	>{modelResult?.label ?? '—'}</span
																>
																<span class="mt-1 block whitespace-nowrap"
																	>D {probability(modelResult, 'D')} · I {probability(
																		modelResult,
																		'I'
																	)}</span
																>
															</td>
														{/each}
													</tr>
												{/each}
											</tbody>
										</table>
									</section>
								</div>
							{/if}

							{#if evaluationDetail.lastSyncError}
								<div
									class="mt-5 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
								>
									<Icon icon="material-symbols:sync-problem" class="mt-0.5 h-5 w-5 shrink-0" />
									<div>
										<strong>Průběh nemusí být aktuální.</strong>
										{evaluationDetail.lastSyncError}
									</div>
								</div>
							{/if}

							<div class="mt-6 grid gap-6 border-t border-gray-100 pt-6 md:grid-cols-2">
								<div>
									<h3 class="text-sm font-bold text-gray-900">Zdrojová sezení</h3>
									<dl class="mt-3 space-y-3">
										{#each evaluationDetail.sources as source (source.key)}
											<div>
												<dt class="text-xs font-semibold text-gray-600">
													{source.key === 'syllables' ? 'Slabiky' : source.label}
												</dt>
												<dd class="mt-0.5 text-xs break-all text-gray-500">
													{source.folderName}{source.sessionId
														? ` · ${source.sessionId}`
														: ' · sezení bylo smazáno'}
												</dd>
											</div>
										{/each}
									</dl>
								</div>
								<div>
									<h3 class="text-sm font-bold text-gray-900">Údaje o výpočtu</h3>
									<dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
										<dt class="font-semibold text-gray-600">Vytvořeno</dt>
										<dd class="text-gray-500">{formatDate(evaluationDetail.createdAt)}</dd>
										<dt class="font-semibold text-gray-600">Spuštěno</dt>
										<dd class="text-gray-500">{formatDate(evaluationDetail.startedAt)}</dd>
										<dt class="font-semibold text-gray-600">Dokončeno</dt>
										<dd class="text-gray-500">{formatDate(evaluationDetail.completedAt)}</dd>
										<dt class="font-semibold text-gray-600">Poslední synchronizace</dt>
										<dd class="text-gray-500">{formatDate(evaluationDetail.lastSyncedAt)}</dd>
										<dt class="font-semibold text-gray-600">Nastavení</dt>
										<dd class="text-gray-500">
											{evaluationDetail.preprocessingSettings.frequencyHz} Hz · {evaluationDetail
												.preprocessingSettings.screenWidthCm} × {evaluationDetail
												.preprocessingSettings.screenHeightCm} cm · {evaluationDetail
												.preprocessingSettings.screenDistanceCm} cm · {evaluationDetail
												.preprocessingSettings.screenWidthPx} × {evaluationDetail
												.preprocessingSettings.screenHeightPx} px
										</dd>
									</dl>
								</div>
							</div>

							<div class="mt-6 flex flex-wrap gap-3">
								{#if evaluationDetail.status === 'COMPLETED'}
									<button
										type="button"
										class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 focus-visible:ring-3 focus-visible:ring-blue-200 focus-visible:outline-none disabled:opacity-50"
										disabled={isDownloading}
										onclick={() => downloadResult(evaluationDetail!)}
									>
										<Icon
											icon={isDownloading ? 'mdi:loading' : 'material-symbols:download'}
											class={`h-4 w-4 ${isDownloading ? 'animate-spin' : ''}`}
										/>
										{isDownloading ? 'Příprava…' : 'Stáhnout původní JSON'}
									</button>
								{/if}
								<button
									type="button"
									class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:ring-3 focus-visible:ring-blue-100 focus-visible:outline-none"
									onclick={() => retryAsNew(evaluationDetail!)}
									>Použít vstupy pro nový výpočet</button
								>
							</div>
						{/if}
					</section>
				{/if}
			</div>
		{:else}
			<section
				class="flex min-h-64 items-center justify-center rounded-xl bg-white px-6 text-center shadow-md shadow-gray-300/50"
			>
				<div>
					<h2 class="text-lg font-bold text-gray-900">Data účastníka nejsou dostupná</h2>
					<p class="mt-1 text-sm text-gray-600">Zkuste data tohoto účastníka načíst znovu.</p>
					<button
						class="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 focus-visible:ring-3 focus-visible:ring-blue-200 focus-visible:outline-none"
						onclick={retryFailedOperation}>Zkusit znovu</button
					>
				</div>
			</section>
		{/if}
	</div>
</DefaultLayout>
