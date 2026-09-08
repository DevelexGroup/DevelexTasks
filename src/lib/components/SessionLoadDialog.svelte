<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import SessionPicker from '$lib/components/SessionPicker.svelte';
	import type { TestSessionDTO } from '$lib/types/api.types';
	import { loadRemoteSession, loadSessionsFromFiles } from '$lib/utils/sessionSim/loaders';
	import { sessionSourceLabel } from '$lib/utils/sessionSim/simState.svelte';
	import type { LoadedSession, SessionSource } from '$lib/utils/sessionSim/types';

	let {
		open = $bindable(false),
		multiSelect = true,
		onConfirm
	}: {
		open?: boolean;
		/** Single mode confirms one session: the picked remote one or the chosen file session. */
		multiSelect?: boolean;
		onConfirm?: (sources: SessionSource[]) => void;
	} = $props();

	type DataSource = 'remote' | 'files';
	let dataSource = $state<DataSource>('remote');
	let error = $state('');

	// ── Remote state ──
	let selectedRemote = $state<TestSessionDTO[]>([]);

	// ── File state ──
	let droppedFiles = $state<File[]>([]);
	let fileSessions = $state.raw<LoadedSession[]>([]);
	let selectedFileKey = $state<string | null>(null);
	let isParsing = $state(false);
	let dragOver = $state(false);

	const usableFileSessions = $derived(
		fileSessions.filter((s) => s.rawGazeData.length > 0 || s.gazeSamples.length > 0)
	);
	const fileSourceList = $derived(fileSources(usableFileSessions));
	const chosenFileSources = $derived.by((): SessionSource[] => {
		if (multiSelect) return fileSourceList;
		const chosen =
			fileSourceList.find((source) => source.key === selectedFileKey) ?? fileSourceList[0];
		return chosen ? [chosen] : [];
	});
	const sources = $derived.by((): SessionSource[] => {
		const remote = selectedRemote.map(remoteSource);
		if (multiSelect) return [...remote, ...chosenFileSources];
		return dataSource === 'remote' ? remote.slice(0, 1) : chosenFileSources;
	});
	const total = $derived(sources.length);

	function remoteSource(session: TestSessionDTO): SessionSource {
		return {
			key: `remote:${session.id}`,
			username: session.username,
			testType: session.testType,
			sessionStartTime: new Date(session.sessionStartTime),
			load: () => loadRemoteSession(session)
		};
	}

	function fileSources(sessions: LoadedSession[]): SessionSource[] {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const used = new Set<string>();
		return sessions.map((session) => {
			let key = `file:${session.exportFolder}`;
			for (let counter = 2; used.has(key); counter++)
				key = `file:${session.exportFolder}#${counter}`;
			used.add(key);
			const sessionMs = parseFloat(session.sessionId);
			return {
				key,
				username: session.childId,
				testType: session.taskName,
				sessionStartTime: Number.isFinite(sessionMs) ? new Date(sessionMs) : null,
				load: () => Promise.resolve(session)
			};
		});
	}

	async function parseFiles() {
		isParsing = true;
		error = '';
		try {
			fileSessions = await loadSessionsFromFiles(droppedFiles);
			if (droppedFiles.length > 0 && fileSessions.length === 0) {
				error = 'V souborech nebyla nalezena žádná data sezení (rawGazeData/gazeSamples).';
			}
		} catch (err) {
			fileSessions = [];
			error = err instanceof Error ? err.message : 'Soubory se nepodařilo načíst';
		} finally {
			isParsing = false;
		}
	}

	function addFiles(files: File[]) {
		droppedFiles = [...droppedFiles, ...files];
		void parseFiles();
	}

	function removeFile(index: number) {
		droppedFiles = droppedFiles.filter((_, i) => i !== index);
		void parseFiles();
	}

	function confirm() {
		if (sources.length === 0) return;
		onConfirm?.(sources);
		open = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		if (event.dataTransfer?.files) addFiles(Array.from(event.dataTransfer.files));
	}

	function handleFileInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (input.files) addFiles(Array.from(input.files));
		input.value = '';
	}

	const tabClass = (active: boolean) =>
		`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
			active ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
		}`;
</script>

{#snippet fileRow(source: SessionSource, session: LoadedSession, chosen: boolean)}
	<span class="flex min-w-0 items-center gap-2">
		{#if !multiSelect}
			<Icon
				icon={chosen
					? 'material-symbols:radio-button-checked'
					: 'material-symbols:radio-button-unchecked'}
				class="h-4 w-4 shrink-0 {chosen ? 'text-blue-600' : 'text-gray-400'}"
			/>
		{/if}
		<span class="truncate text-gray-800">{sessionSourceLabel(source)}</span>
	</span>
	<span class="shrink-0 text-xs text-gray-400">
		{session.rawGazeData.length} raw
		{#if session.warnings.length > 0}
			<span class="ml-1 rounded bg-amber-100 px-1 py-0.5 text-amber-700">
				{session.warnings.length} varování
			</span>
		{/if}
	</span>
{/snippet}

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>Načíst sezení</Dialog.Title>
			<Dialog.Description>
				{#if multiSelect}
					Vyberte sezení ze serveru nebo přetáhněte soubory; obojí lze kombinovat.
				{:else}
					Vyberte jedno sezení ze serveru nebo ze souborů.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex border-b border-gray-200">
			<button
				type="button"
				class={tabClass(dataSource === 'remote')}
				onclick={() => (dataSource = 'remote')}
			>
				Vzdálený server{selectedRemote.length > 0 ? ` (${selectedRemote.length})` : ''}
			</button>
			<button
				type="button"
				class={tabClass(dataSource === 'files')}
				onclick={() => (dataSource = 'files')}
			>
				Soubory (CSV/JSON/ZIP){usableFileSessions.length > 0
					? ` (${usableFileSessions.length})`
					: ''}
			</button>
		</div>

		{#if error}
			<div class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
		{/if}

		<div class="py-2">
			{#if dataSource === 'remote'}
				<SessionPicker bind:selected={selectedRemote} {multiSelect} />
			{:else}
				<div class="space-y-4">
					<div
						role="button"
						tabindex="0"
						class="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-6 text-center text-sm transition-colors {dragOver
							? 'border-blue-400 bg-blue-50 text-blue-600'
							: 'border-gray-300 text-gray-500 hover:border-gray-400'}"
						ondragover={(e) => {
							e.preventDefault();
							dragOver = true;
						}}
						ondragleave={() => (dragOver = false)}
						ondrop={handleDrop}
						onclick={() => document.getElementById('session-file-input')?.click()}
						onkeydown={(e) => {
							if (e.key === 'Enter') document.getElementById('session-file-input')?.click();
						}}
					>
						Přetáhněte sem soubory sezení (CSV, aoiGeometry/meta JSON) nebo ZIP exporty, nebo
						klikněte pro výběr. ZIP může obsahovat více uživatelů i sezení.
					</div>
					<input
						id="session-file-input"
						type="file"
						multiple
						accept=".csv,.zip,.json"
						class="hidden"
						onchange={handleFileInput}
					/>

					{#if droppedFiles.length > 0}
						<ul class="max-h-32 space-y-1 overflow-y-auto text-sm text-gray-700">
							{#each droppedFiles as file, i (file.name + i)}
								<li class="flex items-center justify-between gap-2">
									<span class="truncate">{file.name}</span>
									<button
										type="button"
										class="text-xs text-red-500 hover:underline"
										onclick={() => removeFile(i)}
									>
										odebrat
									</button>
								</li>
							{/each}
						</ul>
					{/if}

					{#if isParsing}
						<p class="text-sm text-gray-500">Načítám soubory…</p>
					{:else if usableFileSessions.length > 0}
						<div class="space-y-1">
							<p class="text-xs font-semibold text-gray-500 uppercase">
								Nalezená sezení ({usableFileSessions.length})
							</p>
							<ul
								class="max-h-48 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 text-sm"
							>
								{#each fileSourceList as source, i (source.key)}
									{@const session = usableFileSessions[i]}
									{@const chosen = !multiSelect && chosenFileSources[0]?.key === source.key}
									<li>
										{#if multiSelect}
											<div class="flex items-center justify-between gap-2 px-3 py-1.5">
												{@render fileRow(source, session, chosen)}
											</div>
										{:else}
											<button
												type="button"
												class="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-gray-50 {chosen
													? 'bg-blue-50'
													: ''}"
												onclick={() => (selectedFileKey = source.key)}
											>
												{@render fileRow(source, session, chosen)}
											</button>
										{/if}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Zavřít</Button>
			<Button onclick={confirm} disabled={total === 0 || isParsing}>
				Načíst{total > 0 ? ` (${total})` : ''}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
