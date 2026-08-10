<script lang="ts">
	import { authUser } from '$lib/stores/auth';
	import { hasCapability } from '$lib/utils/capabilityGuard';
	import type { Capability } from '$lib/types/api.types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	interface Props {
		caps: Capability[];
		redirectTo?: string;
		showError?: boolean;
		unauthorizedMessage?: string;
		children?: Snippet;
	}

	let {
		caps,
		redirectTo,
		showError = false,
		unauthorizedMessage = 'Tato stránka vyžaduje vyšší oprávnění.',
		children
	}: Props = $props();

	let isAuthorized = $derived(hasCapability($authUser, ...caps));
	let isLoading = $state(true);

	onMount(() => {
		isLoading = false;

		if (!isAuthorized && redirectTo) {
			// @ts-expect-error - redirectTo is a user-provided URL
			goto(resolve(redirectTo));
		}
	});
</script>

{#if isLoading}
	<div class="capability-guard-loading">
		<p>Načítání...</p>
	</div>
{:else if isAuthorized}
	{@render children?.()}
{:else if showError}
	<div class="capability-guard-error">
		<h1>Přístup odepřen</h1>
		<p>{unauthorizedMessage}</p>
		<a href={resolve('/login')}>Přejít na přihlášení</a>
	</div>
{/if}

<style>
	.capability-guard-loading,
	.capability-guard-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		padding: 2rem;
		text-align: center;
	}

	.capability-guard-error h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
		color: #ef4444;
	}

	.capability-guard-error p {
		font-size: 1.125rem;
		margin-bottom: 1.5rem;
		color: #6b7280;
	}

	.capability-guard-error a {
		padding: 0.5rem 1rem;
		background-color: #3b82f6;
		color: white;
		text-decoration: none;
		border-radius: 0.375rem;
		transition: background-color 0.2s;
	}

	.capability-guard-error a:hover {
		background-color: #2563eb;
	}
</style>
