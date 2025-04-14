<script lang="ts">
	import Button from './Button.svelte';
	import DownloadSessionTable from './DownloadSessionTable.svelte';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import sessionRepository from '$lib/database/repositories/session.repository';
	import { db } from '$lib/database/database';
	import type { Session } from '$lib/database/models/Session';

	interface SessionWithDate extends Session {
		firstRecordDate: string;
		firstRecordTimestamp: number;
	}

	const appState = $state({
		isLoading: true,
		sessions: [] as Session[],
		sessionsWithFirstRecord: [] as SessionWithDate[]
	});

	onMount(async () => {
		if (browser) {
			// Add artificial delay of at least 300ms
			const startTime = Date.now();
			const minLoadTime = 300; // ms

			// Start loading data
			appState.sessions = await sessionRepository.getAll();

			// Get first record date for each session
			appState.sessionsWithFirstRecord = await Promise.all(
				appState.sessions.map(async (session) => {
					// Find earliest timestamp in any event table
					const userEvents = await db.userEvents
						.where('sessionId')
						.equals(session.id)
						.sortBy('timestamp');

					const stateEvents = await db.stateEvents
						.where('sessionId')
						.equals(session.id)
						.sortBy('timestamp');

					const xstateEvents = await db.xstateEvents
						.where('sessionId')
						.equals(session.id)
						.toArray();

					// Find the earliest timestamp from any table
					let firstTimestamp: number | null = null;
					if (userEvents.length > 0) firstTimestamp = userEvents[0].timestamp;
					if (
						stateEvents.length > 0 &&
						(!firstTimestamp || stateEvents[0].timestamp < firstTimestamp)
					) {
						firstTimestamp = stateEvents[0].timestamp;
					}

					// For XState events, we need to convert string timestamps to numbers for comparison
					if (xstateEvents.length > 0) {
						const firstXStateTimestamp = Math.min(
							...xstateEvents.map((event) => new Date(event.timestamp).getTime())
						);
						if (!firstTimestamp || firstXStateTimestamp < firstTimestamp) {
							firstTimestamp = firstXStateTimestamp;
						}
					}

					// Format date if we have a timestamp
					let formattedDate = 'N/A';
					const actualTimestamp = firstTimestamp || 0; // Use 0 for sorting when no timestamp

					if (firstTimestamp) {
						const date = new Date(firstTimestamp);
						formattedDate = date
							.toLocaleDateString('cs-CZ', {
								day: '2-digit',
								month: '2-digit',
								year: '2-digit',
								hour: '2-digit',
								minute: '2-digit'
							})
							.replace(',', '');
					}

					return {
						...session,
						firstRecordDate: formattedDate,
						firstRecordTimestamp: actualTimestamp
					};
				})
			);

			// Check if we need to wait before showing content
			const checkLoadTime = () => {
				const elapsedTime = Date.now() - startTime;
				if (elapsedTime >= minLoadTime) {
					appState.isLoading = false;
				} else {
					// Wait remaining time if needed
					setTimeout(() => {
						appState.isLoading = false;
					}, minLoadTime - elapsedTime);
				}
			};

			// Call to check if we need to wait more
			checkLoadTime();
		}
	});
</script>

<div class="h-full w-full overflow-x-hidden px-4 py-6">
	<h1 class="mb-6 w-full text-center text-2xl font-bold">Stáhnout data</h1>

	<div class="w-full">
		{#if appState.isLoading || !browser}
			<div class="mb-6 flex w-full items-center justify-center">
				<div transition:fade={{ duration: 200 }}>
					<div class="flex h-full items-center gap-3 rounded-lg bg-gray-50 p-6 shadow-sm">
						<span
							class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
						></span>
						<span class="text-lg">Načítání...</span>
					</div>
				</div>
			</div>
		{:else}
			<div transition:fade={{ duration: 200 }} class="mb-8 w-full">
				<DownloadSessionTable sessionsWithFirstRecord={appState.sessionsWithFirstRecord} />
			</div>
		{/if}
	</div>
	<div class="mt-4 flex w-full items-center justify-center">
		<Button href="/">Zpět</Button>
	</div>
</div>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
