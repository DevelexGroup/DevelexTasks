<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Icon from '@iconify/svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import BackButton from '$lib/components/layout/BackButton.svelte';
	import { getAllUsers } from '$lib/api/user-management';
	import { getMyGroupMembers } from '$lib/api/groups';
	import {
		getTestSessions,
		I2MC_DEFAULT_PARAMETERS,
		type I2mcParameters
	} from '$lib/api/test-sessions';
	import { authUser } from '$lib/stores/auth';
	import { Guards, hasCapability } from '$lib/utils/capabilityGuard';
	import {
		SortBy,
		SortDirection,
		TestSessionStatus,
		type UserDTO,
		type TestSessionDTO
	} from '$lib/types/api.types';
	import { parseTaskName } from '$lib/utils/sessionSim/taskName';
	import { userDisplayName } from '$lib/utils/sessionLabels';
	import { analyzeSession } from '$lib/utils/progression/load';
	import { METRICS, type MetricKey, type ProgressionResult } from '$lib/utils/progression/model';
	import ProgressionChart from './components/ProgressionChart.svelte';

	let users = $state<UserDTO[]>([]);
	let search = $state('');
	let userId = $state('');
	let sessions = $state<TestSessionDTO[]>([]);
	let task = $state('');
	let level = $state('');
	let mode = $state('');
	let selected = $state<Set<string>>(new Set());
	let results = $state<Record<string, ProgressionResult>>({});
	let errors = $state<Record<string, string>>({});
	let loadingUsers = $state(false);
	let loadingSessions = $state(false);
	let loadError = $state('');
	let running = $state(false);
	let processed = $state(0);
	let total = $state(0);
	let activeSession = $state('');
	let metric = $state<MetricKey>('meanDuration');
	let parameters = $state<I2mcParameters>({ ...I2MC_DEFAULT_PARAMETERS });
	let useRecordedViewport = $state(true);
	let generation = 0;
	let userGeneration = 0;
	const cache = new SvelteMap<string, ProgressionResult>();
	const canCalculate = $derived(hasCapability($authUser, ...Guards.manageSessions));
	const filteredUsers = $derived(
		users.filter((user) =>
			`${userDisplayName(user)} ${user.username}`.toLowerCase().includes(search.toLowerCase())
		)
	);
	const described = $derived(
		sessions.map((session) => ({
			session,
			parsed: parseTaskName(session.testType) ?? {
				slug: session.testType,
				level: 'Neuvedeno',
				mode: 'reeducation'
			}
		}))
	);
	const unique = (values: string[]) =>
		[...new Set(values)].sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));
	const tasks = $derived(unique(described.map(({ parsed }) => parsed.slug)));
	const levels = $derived(
		unique(described.filter(({ parsed }) => parsed.slug === task).map(({ parsed }) => parsed.level))
	);
	const modes = $derived(
		unique(
			described
				.filter(({ parsed }) => parsed.slug === task && parsed.level === level)
				.map(({ parsed }) => parsed.mode)
		)
	);
	const matching = $derived(
		described
			.filter(
				({ parsed }) => parsed.slug === task && parsed.level === level && parsed.mode === mode
			)
			.map(({ session }) => session)
	);
	const eligible = (session: TestSessionDTO) =>
		session.status !== TestSessionStatus.InProgress && session.fileCount > 0;
	const selectedSessions = $derived(
		matching.filter((session) => selected.has(session.id) && eligible(session))
	);
	const settingsKey = $derived(JSON.stringify([parameters, useRecordedViewport, canCalculate]));
	const validSettings = $derived(
		[parameters.xres, parameters.yres, parameters.minFixDur, parameters.dist].every(
			(value) => Number.isFinite(value) && value > 0
		) &&
			[parameters.freq, parameters.gapSplitMs].every(
				(value) => Number.isFinite(value) && value >= 0
			)
	);
	const retryable = $derived(
		selectedSessions.filter(
			(session) =>
				errors[session.id] ||
				results[session.id]?.warnings.length ||
				results[session.id]?.slides.some((slide) => slide.error)
		)
	);
	const inputClass =
		'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:bg-gray-100';
	const dateLabel = (session: TestSessionDTO) =>
		new Date(session.sessionStartTime).toLocaleString('cs-CZ', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	const stop = () => {
		generation++;
		running = false;
		activeSession = '';
	};

	$effect(() => {
		const currentMatching = matching;
		const currentSettings = settingsKey;
		untrack(() => {
			stop();
			selected = new Set(currentMatching.filter(eligible).map((session) => session.id));
			results = Object.fromEntries(
				currentMatching.flatMap((session) => {
					const cached = cache.get(`${session.id}:${currentSettings}`);

					return cached ? [[session.id, cached]] : [];
				})
			);
			errors = {};
		});
	});

	const loadUsers = async () => {
		loadingUsers = true;
		loadError = '';

		try {
			users = (
				hasCapability($authUser, ...Guards.readAllUsers)
					? await getAllUsers()
					: await getMyGroupMembers()
			).sort((a, b) => userDisplayName(a).localeCompare(userDisplayName(b)));
		} catch {
			loadError = 'Účastníky se nepodařilo načíst. Zkuste to znovu.';
		} finally {
			loadingUsers = false;
		}
	};

	const chooseTask = () => {
		level = levels[0] ?? '';
		mode = modes[0] ?? '';
	};
	const chooseLevel = () => {
		mode = modes[0] ?? '';
	};
	const chooseUser = async () => {
		const request = ++userGeneration;
		const pickedUser = userId;
		stop();
		sessions = [];
		results = {};
		errors = {};
		cache.clear();
		loadError = '';
		loadingSessions = Boolean(pickedUser);

		if (!pickedUser) {
			return;
		}

		try {
			const all: TestSessionDTO[] = [];

			for (let page = 0; ; page++) {
				const response = await getTestSessions(
					page,
					100,
					SortBy.SessionStartTime,
					SortDirection.Asc,
					pickedUser
				);

				if (request !== userGeneration) {
					return;
				}

				all.push(...response.content);

				if (response.last || response.content.length === 0) {
					break;
				}
			}

			sessions = [...new Map(all.map((session) => [session.id, session])).values()].sort(
				(a, b) =>
					new Date(a.sessionStartTime).getTime() - new Date(b.sessionStartTime).getTime() ||
					a.id.localeCompare(b.id)
			);
			task =
				unique(
					sessions.map((session) => parseTaskName(session.testType)?.slug ?? session.testType)
				)[0] ?? '';
			chooseTask();
		} catch {
			if (request === userGeneration) {
				loadError = 'Relace se nepodařilo načíst. Zkuste to znovu.';
			}
		} finally {
			if (request === userGeneration) {
				loadingSessions = false;
			}
		}
	};
	const toggleSession = (id: string) => {
		stop();
		const next = new SvelteSet(selected);

		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}

		selected = next;
	};

	const analyze = async (retry = false) => {
		if (running || !validSettings) {
			return;
		}

		const request = ++generation;
		const queue = [...(retry ? retryable : selectedSessions)];
		const key = settingsKey;
		const options = {
			parameters: { ...parameters },
			useRecordedViewport,
			canCalculate,
			isCurrent: () => generation === request
		};
		running = true;
		processed = 0;
		total = queue.length;

		for (const session of queue) {
			if (request !== generation) {
				return;
			}

			activeSession = session.id;
			const nextErrors = { ...errors };
			delete nextErrors[session.id];
			errors = nextErrors;

			try {
				const cacheKey = `${session.id}:${key}`;
				cache.delete(cacheKey);
				const result = await analyzeSession(session, options);

				if (request !== generation) {
					return;
				}

				results = { ...results, [session.id]: result };

				if (!result.warnings.length && !result.slides.some((slide) => slide.error)) {
					cache.set(cacheKey, result);
				}
			} catch (error) {
				if (request !== generation) {
					return;
				}

				errors = {
					...errors,
					[session.id]: error instanceof Error ? error.message : 'Analýza relace selhala.'
				};
			}

			processed++;
		}

		running = false;
		activeSession = '';
	};

	onMount(() => {
		void loadUsers();

		return () => {
			stop();
			userGeneration++;
		};
	});
</script>

<svelte:head
	><title>Vývoj účastníka - DeveLex Tasks</title><meta
		name="description"
		content="Porovnejte metriky fixací a čtení napříč zaznamenanými relacemi."
	/></svelte:head
>

<DefaultLayout wide>
	<BackButton label="Zpět do administrace" onclick={() => goto(resolve('/admin'))} />
	<div>
		<h1 class="text-2xl font-black text-gray-800">Vývoj účastníka</h1>
		<p class="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
			Vyberte účastníka, úlohu, úroveň a metriku pro porovnání všech snímků napříč vybranými
			relacemi.
		</p>
	</div>

	{#if loadError}<div
			role="alert"
			class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800"
		>
			{loadError}<button
				class="rounded px-3 py-1 font-semibold underline focus-visible:ring-2 focus-visible:ring-red-700"
				onclick={() => (userId ? chooseUser() : loadUsers())}>Zkusit znovu</button
			>
		</div>{/if}

	<section aria-label="Filtry záznamů" class="rounded-xl bg-white p-5 shadow-sm sm:p-6">
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
			<div>
				<label for="participant-search" class="mb-1.5 block text-xs font-semibold text-gray-700"
					>Vyhledat účastníka</label
				><input
					id="participant-search"
					type="search"
					bind:value={search}
					placeholder="Hledat podle jména nebo uživatelského jména"
					class={inputClass}
				/><label for="participant" class="sr-only">Účastník</label><select
					id="participant"
					class="{inputClass} mt-2"
					bind:value={userId}
					onchange={(event) => {
						userId = event.currentTarget.value;
						void chooseUser();
					}}
					disabled={loadingUsers}
					><option value="">{loadingUsers ? 'Načítání účastníků…' : 'Vyberte účastníka'}</option
					>{#each filteredUsers as user (user.id)}<option value={user.id}
							>{userDisplayName(user)} · {user.username}</option
						>{/each}{#if userId && !filteredUsers.some((user) => user.id === userId)}{@const active =
							users.find((user) => user.id === userId)}{#if active}<option value={active.id}
								>{userDisplayName(active)} · {active.username}</option
							>{/if}{/if}</select
				>
			</div>
			<div>
				<label for="task" class="mb-1.5 block text-xs font-semibold text-gray-700">Úloha</label
				><select
					id="task"
					class={inputClass}
					bind:value={task}
					onchange={(event) => {
						task = event.currentTarget.value;
						chooseTask();
					}}
					disabled={!tasks.length}
					><option value="" disabled>Vyberte úlohu</option>{#each tasks as item (item)}<option
							value={item}>{item}</option
						>{/each}</select
				>
			</div>
			<div>
				<label for="level" class="mb-1.5 block text-xs font-semibold text-gray-700">Úroveň</label
				><select
					id="level"
					class={inputClass}
					bind:value={level}
					onchange={(event) => {
						level = event.currentTarget.value;
						chooseLevel();
					}}
					disabled={!levels.length}
					><option value="" disabled>Vyberte úroveň</option>{#each levels as item (item)}<option
							value={item}>{item}</option
						>{/each}</select
				>
			</div>
			<div>
				<label for="mode" class="mb-1.5 block text-xs font-semibold text-gray-700"
					>Režim úlohy</label
				><select id="mode" class={inputClass} bind:value={mode} disabled={!modes.length}
					><option value="" disabled>Vyberte režim</option>{#each modes as item (item)}<option
							value={item}
							>{item === 'reeducation'
								? 'Reedukace'
								: item === 'evaluation'
									? 'Evaluace'
									: 'Intervence'}</option
						>{/each}</select
				>
			</div>
		</div>
	</section>

	{#if !userId || loadingSessions || !sessions.length}
		<div
			class="flex min-h-64 flex-col items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm"
		>
			<Icon
				icon={loadingSessions ? 'mdi:loading' : 'material-symbols:monitoring'}
				class="h-9 w-9 text-blue-600 {loadingSessions ? 'animate-spin' : ''}"
			/>
			<h2 class="mt-4 text-lg font-bold text-gray-900">
				{loadingSessions
					? 'Načítání záznamů…'
					: !userId
						? 'Začněte výběrem účastníka'
						: 'Nejsou dostupné žádné relace'}
			</h2>
			<p class="mt-2 max-w-md text-sm leading-6 text-gray-600">
				{!userId
					? 'Výše se zobrazí zaznamenané úlohy a úrovně účastníka. Všechny ukončené relace se vyberou automaticky.'
					: loadingSessions
						? 'Načítání relací tohoto účastníka.'
						: 'Tento účastník zatím nemá žádné dostupné záznamy.'}
			</p>
		</div>
	{:else}
		<div class="grid min-w-0 items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
			<aside class="min-w-0 rounded-xl bg-white p-5 shadow-sm" aria-label="Výběr relací">
				<div class="flex items-center justify-between">
					<h2 class="font-bold text-gray-900">Relace</h2>
					<span class="text-xs text-gray-600"
						>{selectedSessions.length} z {matching.filter(eligible).length}</span
					>
				</div>
				<div class="mt-3 flex gap-3 text-xs font-semibold text-blue-700">
					<button
						class="rounded py-1 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600"
						onclick={() => {
							stop();
							selected = new Set(matching.filter(eligible).map((session) => session.id));
						}}>Vybrat vše</button
					><button
						class="rounded py-1 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600"
						onclick={() => {
							stop();
							selected = new Set();
						}}>Zrušit výběr</button
					>
				</div>
				<div class="mt-3 max-h-72 overflow-y-auto xl:max-h-[540px]">
					{#each matching as session (session.id)}
						<label
							class="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-3 hover:bg-gray-50 {selected.has(
								session.id
							)
								? 'bg-blue-50/60'
								: ''} {!eligible(session) ? 'cursor-default opacity-60' : ''}"
							><input
								type="checkbox"
								checked={selected.has(session.id)}
								disabled={!eligible(session)}
								onchange={() => toggleSession(session.id)}
								class="mt-1 h-4 w-4 shrink-0 accent-blue-600"
							/><span class="min-w-0"
								><span class="block text-xs font-semibold text-gray-800">{dateLabel(session)}</span
								><span class="mt-1 block text-xs text-gray-600"
									>{session.status === 'IN_PROGRESS'
										? 'Probíhá'
										: session.fileCount === 0
											? 'Bez souborů'
											: session.status === 'COMPLETED'
												? 'Dokončeno'
												: session.status === 'ABANDONED'
													? 'Přerušeno'
													: 'Chyba záznamu'} · {session.id.slice(0, 8)}</span
								>{#if activeSession === session.id}<span class="mt-1 block text-xs text-blue-700"
										>Probíhá analýza…</span
									>{:else if errors[session.id]}<span class="mt-1 block text-xs text-red-700"
										>Analýza selhala</span
									>{:else if results[session.id]}<span class="mt-1 block text-xs text-gray-600"
										>{results[session.id].slides.some((slide) => slide.error)
											? 'Částečné výsledky'
											: 'Analyzováno'} · počet snímků: {results[session.id].slides.length}</span
									>{/if}</span
							></label
						>
					{/each}
				</div>
			</aside>

			<div class="min-w-0 space-y-6">
				<section class="rounded-xl bg-white p-5 shadow-sm sm:p-6" aria-label="Graf vývoje">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h2 class="text-lg font-bold text-gray-900">Vývoj napříč relacemi</h2>
							<p class="mt-1 text-xs text-gray-600">
								Jedna křivka pro každý snímek · relace od nejstarší po nejnovější
							</p>
						</div>
						<button
							class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-blue-700 focus-visible:ring-3 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={running || !selectedSessions.length || !validSettings}
							onclick={() => analyze()}
							><Icon icon="material-symbols:monitoring" class="h-4 w-4" />{running
								? 'Probíhá analýza…'
								: 'Analyzovat vybrané relace'}</button
						>
					</div>
					{#if running}<div class="mt-4" role="status">
							<div class="mb-2 flex justify-between text-xs text-gray-600">
								<span>Zpracování relací {processed} / {total}</span><button
									class="rounded font-semibold text-blue-700 underline focus-visible:ring-2 focus-visible:ring-blue-600"
									onclick={stop}>Zastavit</button
								>
							</div>
							<progress class="h-1.5 w-full accent-blue-600" value={processed} max={total}
							></progress>
						</div>{/if}
					<div class="mt-6 flex flex-wrap items-center gap-3">
						<label for="metric" class="sr-only">Metrika</label><select
							id="metric"
							class="{inputClass} sm:w-auto sm:min-w-64"
							bind:value={metric}
							>{#each Object.entries(METRICS) as [key, definition] (key)}<option value={key}
									>{definition.label}</option
								>{/each}</select
						>{#if METRICS[metric].unit}<span class="text-xs font-medium text-gray-600"
								>{METRICS[metric].unit}</span
							>{/if}
					</div>
					<p class="mt-2 max-w-2xl text-xs leading-5 text-gray-600">
						{METRICS[metric].description}
					</p>
					<p class="mt-1 max-w-2xl text-xs leading-5 text-gray-600">
						Každý bod shrnuje všechny fixace na jednom snímku v jedné relaci. Kliknutím na snímek
						níže zobrazíte nebo skryjete jeho křivku.
					</p>
					{#key JSON.stringify([userId, task, level, mode])}
						<ProgressionChart sessions={selectedSessions} {results} {metric} />
					{/key}
					{#if !selectedSessions.length}<p class="mt-3 text-sm text-gray-600">
							Vyberte alespoň jednu ukončenou relaci se soubory.
						</p>{/if}
				</section>

				{#if retryable.length}<div
						class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900"
						role="status"
					>
						<span
							>Počet relací s chybějícími daty nebo chybami zpracování: {retryable.length}. Dostupné
							výsledky jsou zobrazeny.</span
						><button
							class="rounded px-2 py-1 font-semibold underline focus-visible:ring-2 focus-visible:ring-amber-700 disabled:opacity-50"
							disabled={running || !validSettings}
							onclick={() => analyze(true)}>Znovu analyzovat dotčené relace</button
						>
					</div>{/if}

				<details class="rounded-xl bg-white p-5 shadow-sm sm:p-6">
					<summary
						class="cursor-pointer rounded text-sm font-semibold text-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
						>Nastavení výpočtu a podrobnosti záznamů</summary
					>
					<p class="mt-3 text-xs leading-5 text-gray-600">
						Uložené fixace I2MC se použijí znovu. Tato nastavení platí pouze pro chybějící výstupy,
						které se vypočítají bez změny uložených záznamů. Čas celého snímku zahrnuje přípravu i
						přestávky.
					</p>
					{#if !canCalculate}<p class="mt-3 text-xs text-amber-900">
							Uložené výsledky si můžete prohlížet. Výpočet chybějících výstupů I2MC vyžaduje
							oprávnění ke správě relací.
						</p>{/if}
					<label class="mt-4 flex items-center gap-2 text-sm text-gray-700"
						><input
							type="checkbox"
							bind:checked={useRecordedViewport}
							class="accent-blue-600"
						/>Použít zaznamenané rozměry zobrazovací plochy, pokud jsou dostupné</label
					>
					<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each [{ key: 'xres', label: 'Náhradní šířka (px)', min: 1 }, { key: 'yres', label: 'Náhradní výška (px)', min: 1 }, { key: 'freq', label: 'Vzorkovací frekvence (Hz; 0 = automaticky)', min: 0 }, { key: 'minFixDur', label: 'Minimální délka fixace (ms)', min: 1 }, { key: 'gapSplitMs', label: 'Práh pro rozdělení při výpadku (ms)', min: 0 }, { key: 'dist', label: 'Pozorovací vzdálenost (cm)', min: 1 }] as field (field.key)}<div
							>
								<label
									for={`setting-${field.key}`}
									class="mb-1.5 block text-xs font-medium text-gray-700">{field.label}</label
								><input
									id={`setting-${field.key}`}
									type="number"
									min={field.min}
									step="any"
									class={inputClass}
									value={parameters[field.key as keyof I2mcParameters]}
									oninput={(event) => {
										parameters = {
											...parameters,
											[field.key]:
												event.currentTarget.value === '' ? NaN : Number(event.currentTarget.value)
										};
									}}
								/>
							</div>{/each}
					</div>
					{#if !validSettings}<p role="alert" class="mt-3 text-xs text-red-700">
							Zadejte platné kladné rozměry, délku fixace a vzdálenost. Vzorkovací frekvence a práh
							pro rozdělení při výpadku mohou být nulové.
						</p>{/if}
					<p class="mt-3 text-xs leading-5 text-gray-600">
						I2MC používá obě oči a výchozí rozměry 24palcového monitoru (53,13 × 29,89 cm).
						Variabilita se počítá v pixelech z platných průměrů obou očí nebo z jednoho platného
						oka.
					</p>
					{#each selectedSessions as session (session.id)}{#if results[session.id] || errors[session.id]}<div
								class="mt-4 border-t border-gray-100 pt-4 text-xs leading-5 text-gray-600"
							>
								<p class="font-semibold text-gray-800">
									{dateLabel(session)} · {session.id.slice(0, 8)}
								</p>
								{#if errors[session.id]}<p class="text-red-700">
										{errors[session.id]}
									</p>{/if}{#if results[session.id]}<p>{results[session.id].settingsDescription}</p>
									{#each results[session.id].warnings as warning, index (index)}<p
											class="mt-1 text-amber-900"
										>
											{warning}
										</p>{/each}{/if}
							</div>{/if}{/each}
				</details>
			</div>
		</div>
	{/if}
</DefaultLayout>
