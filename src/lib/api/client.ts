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

export async function apiClient<T>(
	endpoint: string,
	options?: RequestInit
): Promise<T> {
	const response = await fetch(`${BASE_URL}${endpoint}`, {
		headers: {
			'Content-Type': 'application/json',
			...options?.headers
		},
		...options
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
