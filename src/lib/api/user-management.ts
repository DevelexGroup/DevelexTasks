import { apiClient } from './client';
import type {
	UserDTO,
	UserCreateRequest,
	UserEditRequest,
	UserActionResponse,
	UserRole,
	UserStatus,
	UserSessionsDTO
} from '$lib/types/api.types';

export async function createUser(user: UserCreateRequest): Promise<{ uuid: string }> {
	return apiClient<{ uuid: string }>('/user', {
		method: 'POST',
		body: JSON.stringify(user)
	});
}

export async function updateUser(uuid: string, userData: UserEditRequest): Promise<UserDTO> {
	return apiClient<UserDTO>(`/user/${uuid}`, {
		method: 'PUT',
		body: JSON.stringify(userData)
	});
}

export async function deleteUser(uuid: string): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}`, {
		method: 'DELETE'
	});
}

export async function getBasicInfo(): Promise<UserDTO> {
	return apiClient<UserDTO>('/user/basicInfo');
}

export async function getAllUsers(status?: UserStatus, role?: UserRole): Promise<UserDTO[]> {
	const params: Record<string, string> = {};
	if (status) params.status = status;
	if (role) params.role = role;

	return apiClient<UserDTO[]>('/user', {
		params: Object.keys(params).length > 0 ? params : undefined
	});
}

export async function getUsersByStatus(status: UserStatus): Promise<UserDTO[]> {
	return apiClient<UserDTO[]>(`/user/by-status/${status}`);
}

export async function getUsersByRole(role: UserRole): Promise<UserDTO[]> {
	return apiClient<UserDTO[]>(`/user/by-role/${role}`);
}

export async function enableUser(uuid: string): Promise<void> {
	return apiClient<void>(`/user/${uuid}/enable`);
}

export async function activateUser(uuid: string): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}/activate`, {
		method: 'POST'
	});
}

export async function deactivateUser(uuid: string): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}/deactivate`, {
		method: 'POST'
	});
}

export async function lockUser(uuid: string): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}/lock`, {
		method: 'POST'
	});
}

export async function unlockUser(uuid: string): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}/unlock`, {
		method: 'POST'
	});
}

export async function setUserStatus(
	uuid: string,
	status: UserStatus
): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}/status`, {
		method: 'PUT',
		body: JSON.stringify({ status })
	});
}

export async function setUserRole(
	uuid: string,
	userRole: UserRole
): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}/role`, {
		method: 'PUT',
		body: JSON.stringify({ userRole })
	});
}

export async function resetPassword(
	uuid: string,
	newPassword: string
): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}/reset-password`, {
		method: 'POST',
		body: JSON.stringify({ newPassword })
	});
}

export async function checkUserExists(email: string): Promise<boolean> {
	return apiClient<boolean>('/user/checkUserExists', {
		params: { email }
	});
}

export async function getUserSessions(uuid: string): Promise<UserSessionsDTO> {
	return apiClient<UserSessionsDTO>(`/user/${uuid}/sessions`);
}

export async function expireUserTokens(uuid: string): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}/expire-tokens`, {
		method: 'POST'
	});
}

