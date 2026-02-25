<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { authSession, isTokenExpired, getTimeUntilExpiry, clearAuthSession } from '$lib/stores/auth';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let expiryTimeout: ReturnType<typeof setTimeout> | null = null;

	function clearAuthCookie(): void {
		if (typeof document !== 'undefined') {
			document.cookie =
				'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
		}
	}

	function handleExpiredSession(): void {
		clearAuthSession();
		clearAuthCookie();

		if (browser) {
			const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
			window.location.href = `/login?expired=true&returnUrl=${returnUrl}`;
		}
	}

	function scheduleExpiryCheck(): void {
		// Clear any existing timeout
		if (expiryTimeout) {
			clearTimeout(expiryTimeout);
			expiryTimeout = null;
		}

		// Only schedule if user is logged in
		if ($authSession === null) {
			return;
		}

		const timeUntilExpiry = getTimeUntilExpiry();

		if (timeUntilExpiry > 0) {
			// Schedule check slightly before actual expiry
			const checkTime = Math.max(timeUntilExpiry - 10000, 1000); // 10 seconds before expiry, minimum 1 second
			expiryTimeout = setTimeout(() => {
				if (isTokenExpired() && $authSession !== null) {
					handleExpiredSession();
				} else if ($authSession !== null) {
					// Token not yet expired, reschedule
					scheduleExpiryCheck();
				}
			}, checkTime);
		} else {
			// Already expired and user was logged in
			handleExpiredSession();
		}
	}

	onMount(() => {
		// Only handle expiry if user is logged in
		if ($authSession === null) {
			return;
		}

		// Check immediately on mount if token is expired
		if (isTokenExpired()) {
			handleExpiredSession();
			return;
		}

		// Schedule future expiry check
		scheduleExpiryCheck();

		// Re-check when user returns to the tab
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible' && $authSession !== null) {
				if (isTokenExpired()) {
					handleExpiredSession();
				} else {
					scheduleExpiryCheck();
				}
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	onDestroy(() => {
		if (expiryTimeout) {
			clearTimeout(expiryTimeout);
		}
	});
</script>

{@render children()}



