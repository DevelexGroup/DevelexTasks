import { apiClient } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, UserDTO } from '$lib/types/api.types';
import { setAuthSession, clearAuthSession } from '$lib/stores/auth';

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
