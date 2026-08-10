import { apiClient, BASE_URL, getAuthToken } from './client';
import type {
	CurrentUserResponse,
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	UserDTO
} from '$lib/types/api.types';
import { setAuthSession, clearAuthSession, authSession } from '$lib/stores/auth';
import { get } from 'svelte/store';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
	const response = await apiClient<LoginResponse>('/auth/login', {
		method: 'POST',
		body: JSON.stringify(credentials)
	});

	if (typeof document !== 'undefined') {
		const expires = new Date(response.expiresIn).toUTCString();
		document.cookie = `auth_token=${response.token}; path=/; expires=${expires}; secure; samesite=strict`;
	}

	setAuthSession(
		{
			userId: response.userId,
			username: response.username,
			firstName: response.firstName,
			lastName: response.lastName,
			role: response.role,
			capabilities: response.capabilities ?? [],
			groups: response.groups ?? []
		},
		new Date(response.expiresIn)
	);

	console.log('Logged in user:', response.username);

	return response;
}

export async function logout(): Promise<void> {
	try {
		const token = getAuthToken();
		await fetch(`${BASE_URL}/auth/logout`, {
			method: 'POST',
			headers: token ? { Authorization: `Bearer ${token}` } : {}
		});
	} catch {
		// Ignore errors - we still want to clear local state
	}

	clearAuthSession();

	if (typeof document !== 'undefined') {
		document.cookie =
			'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
	}

	console.log('User logged out');
}

export async function register(data: RegisterRequest): Promise<UserDTO> {
	const response = await apiClient<UserDTO>('/auth/register', {
		method: 'POST',
		body: JSON.stringify(data)
	});

	console.log('Registered new user:', response);

	return response;
}

/**
 * Validate the current auth session by making a lightweight API call.
 * Refreshes the locally stored user info, capabilities and groups on success.
 * If the token is invalid, the apiClient will automatically handle the 401 response
 * and redirect to the login page.
 * @returns true if the session is valid, false if there's no session or validation fails
 */
export async function validateAuthStatus(): Promise<boolean> {
	const session = get(authSession);
	if (!session) {
		return false;
	}

	try {
		const me = await apiClient<CurrentUserResponse>('/auth/me');
		authSession.set({
			user: {
				userId: me.user.id,
				username: me.user.username,
				firstName: me.user.firstName,
				lastName: me.user.lastName,
				role: me.user.role,
				capabilities: me.capabilities ?? [],
				groups: me.groups ?? []
			},
			expiresAt: session.expiresAt
		});
		return true;
	} catch {
		return false;
	}
}
