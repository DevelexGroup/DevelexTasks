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

interface ApiClientOptions extends RequestInit {
	params?: Record<string, string | number | boolean>;
}

export async function apiClient<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...options?.headers
	};

	const token = getAuthToken();
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

	const { params, ...fetchOptions } = options || {};

	const response = await fetch(url, {
		headers,
		...fetchOptions
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new ApiError(response.status, response.statusText, errorBody);
	}

	// Handle empty responses (e.g., 204 No Content)
	if (response.status === 204) {
		return undefined as T;
	}

	return response.json();
}
