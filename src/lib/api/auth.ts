import { apiClient } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, UserDTO, UserBasicDTO } from '$lib/types/api.types';
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
			role: response.role
		},
		new Date(response.expiresIn)
	);

	console.log('Logged in user:', response.username);

	return response;
}

export async function logout(): Promise<void> {
	try {
		await fetch('/api/auth/logout', { method: 'POST' });
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
 * This performs a server-side sanity check to ensure the token is still valid.
 * If the token is invalid, the apiClient will automatically handle the 401 response
 * and redirect to the login page.
 * @returns true if the session is valid, false if there's no session or validation fails
 */
export async function validateAuthStatus(): Promise<boolean> {
	// Check if there's a session first
	const session = get(authSession);
	if (!session) {
		return false;
	}

	try {
		// Make a lightweight API call to validate the token on the server
		await apiClient<UserDTO>('/auth/me');
		return true;
	} catch {
		// If the call fails (including 401), the apiClient handles the redirect
		// We just return false here
		return false;
	}
}

