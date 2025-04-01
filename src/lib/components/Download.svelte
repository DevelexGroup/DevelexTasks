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
	}

	let isLoading = true;
	let sessions: Session[] = [];
	let sessionsWithFirstRecord: SessionWithDate[] = [];

	onMount(async () => {
		if (browser) {
			// Add artificial delay of at least 300ms
			const startTime = Date.now();
			const minLoadTime = 300; // ms

			// Start loading data
			sessions = await sessionRepository.getAll();

			// Get first record date for each session
			sessionsWithFirstRecord = await Promise.all(
				sessions.map(async (session) => {
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
						firstRecordDate: formattedDate
					};
				})
			);

			// Check if we need to wait before showing content
			const checkLoadTime = () => {
				const elapsedTime = Date.now() - startTime;
				if (elapsedTime >= minLoadTime) {
					isLoading = false;
				} else {
					// Wait remaining time if needed
					setTimeout(() => {
						isLoading = false;
					}, minLoadTime - elapsedTime);
				}
			};

			// Call to check if we need to wait more
			checkLoadTime();
		}
	});
</script>

<h1 class="mb-4 text-2xl font-bold">Stáhnout data</h1>

{#if browser}
	<div style="position: relative; min-height: 400px;">
		{#if isLoading}
			<div
				style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;"
			>
				<div transition:fade={{ duration: 200 }}>
					<div
						style="display: flex; align-items: center; gap: 12px; padding: 32px; background: #f9fafb; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"
					>
						<span
							style="display: inline-block; width: 24px; height: 24px; border: 2px solid #3b82f6; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"
						></span>
						<span style="font-size: 1.125rem;">Načítání...</span>
					</div>
				</div>
			</div>
		{:else}
			<div transition:fade={{ duration: 200 }}>
				<DownloadSessionTable {sessionsWithFirstRecord} />
			</div>
		{/if}
	</div>
{:else}
	<p style="padding: 16px;">Chyba! Aplikace není dostupná mimo prohlížeč.</p>
{/if}

<Button href="/">Zpět</Button>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
