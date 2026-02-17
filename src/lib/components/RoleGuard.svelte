<script lang="ts">
	import { authUser } from '$lib/stores/auth';
	import { hasRolePermission, getUnauthorizedMessage, type RoleGuardConfig } from '$lib/utils/roleGuard';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	interface Props {
		config: RoleGuardConfig;
		redirectTo?: string;
		showError?: boolean;
		unauthorizedMessage?: string;
		children?: Snippet;
	}

	let {
		config,
		redirectTo,
		showError = false,
		unauthorizedMessage,
		children
	}: Props = $props();

	let isAuthorized = $derived(hasRolePermission($authUser, config));
	let errorMessage = $derived(unauthorizedMessage || getUnauthorizedMessage(config));
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
	<div class="role-guard-loading">
		<p>Loading...</p>
	</div>
{:else if isAuthorized}
	{@render children?.()}
{:else if showError}
	<div class="role-guard-error">
		<h1>Access Denied</h1>
		<p>{errorMessage}</p>
		<!-- @ts-ignore - login is a valid route -->
		<a href={resolve('/login')}>Go to Login</a>
	</div>
{/if}

<style>
	.role-guard-loading,
	.role-guard-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		padding: 2rem;
		text-align: center;
	}

	.role-guard-error h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
		color: #ef4444;
	}

	.role-guard-error p {
		font-size: 1.125rem;
		margin-bottom: 1.5rem;
		color: #6b7280;
	}

	.role-guard-error a {
		padding: 0.5rem 1rem;
		background-color: #3b82f6;
		color: white;
		text-decoration: none;
		border-radius: 0.375rem;
		transition: background-color 0.2s;
	}

	.role-guard-error a:hover {
		background-color: #2563eb;
	}
</style>
