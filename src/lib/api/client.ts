import { browser } from '$app/environment';
import { authSession, clearAuthSession } from '$lib/stores/auth';
import { get } from 'svelte/store';

const BASE_URL = import.meta.env.VITE_API_ENDPOINT || '/api';

export class ApiError extends Error {
	constructor(
		public status: number,
		public statusText: string,
		message?: string
	) {
		super(message || `${status} ${statusText}`);
		this.name = 'ApiError';
	}
}

function getAuthToken(): string | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
	return match ? decodeURIComponent(match[1]) : null;
}

function clearAuthCookie(): void {
	if (typeof document !== 'undefined') {
		document.cookie =
			'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
	}
}

/**
 * Handle unauthorized response by clearing auth state and redirecting to login.
 * Only redirects if the user was previously logged in (had a session).
 */
function handleUnauthorized(hadSession: boolean): void {
	clearAuthSession();
	clearAuthCookie();

	// Only redirect if the user was previously logged in
	if (browser && hadSession) {
		const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
		window.location.href = `/login?expired=true&returnUrl=${returnUrl}`;
	}
}

interface ApiClientOptions extends RequestInit {
	params?: Record<string, string | number | boolean>;
	responseType?: 'json' | 'blob' | 'stream';
}

export async function apiClient<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
	const headers: HeadersInit = {
		...options?.headers
	};

	if (!(options?.body instanceof FormData)) {
		(headers as Record<string, string>)['Content-Type'] = 'application/json';
	}

	const token = getAuthToken();
	// Check if user has a session BEFORE making the request
	const hadSession = get(authSession) !== null;

	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	// Build URL with query parameters
	let url = `${BASE_URL}${endpoint}`;
	if (options?.params) {
		const searchParams = new URLSearchParams();
		Object.entries(options.params).forEach(([key, value]) => {
			searchParams.append(key, String(value));
		});
		url += `?${searchParams.toString()}`;
	}

	const { params, responseType, ...fetchOptions } = options || {};

	const response = await fetch(url, {
		headers,
		...fetchOptions
	});

	if (!response.ok) {
		// Handle 401 Unauthorized - token expired or invalid
		if (response.status === 401) {
			handleUnauthorized(hadSession);
			throw new ApiError(response.status, response.statusText, 'Session expired. Please log in again.');
		}

		const errorBody = await response.text();
		throw new ApiError(response.status, response.statusText, errorBody);
	}

	// Handle empty responses (e.g., 204 No Content)
	if (response.status === 204) {
		return undefined as T;
	}

	// Handle different response types
	if (responseType === 'blob') {
		return (await response.blob()) as T;
	}

	if (responseType === 'stream') {
		return response as unknown as T;
	}

	return response.json();
}
