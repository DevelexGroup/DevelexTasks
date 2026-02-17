import { apiClient } from './client';
import type {
	UserBasicDTO,
	UserDetailDTO,
	UserCreateRequest,
	UserEditRequest,
	UserActionResponse,
	UserRole,
	UserStatus
} from '$lib/types/api.types';

export async function createUser(user: UserCreateRequest): Promise<{ uuid: string }> {
	return apiClient<{ uuid: string }>('/user', {
		method: 'POST',
		body: JSON.stringify(user)
	});
}

export async function updateUser(uuid: string, userData: UserEditRequest): Promise<UserBasicDTO> {
	return apiClient<UserBasicDTO>(`/user/${uuid}`, {
		method: 'PUT',
		body: JSON.stringify(userData)
	});
}

export async function deleteUser(uuid: string): Promise<UserActionResponse> {
	return apiClient<UserActionResponse>(`/user/${uuid}`, {
		method: 'DELETE'
	});
}

export async function getBasicInfo(): Promise<UserBasicDTO> {
	return apiClient<UserBasicDTO>('/user/basicInfo');
}

export async function getAllUsers(
	status?: UserStatus,
	role?: UserRole
): Promise<UserBasicDTO[]> {
	const params: Record<string, string> = {};
	if (status) params.status = status;
	if (role) params.role = role;

	return apiClient<UserBasicDTO[]>('/user', {
		params: Object.keys(params).length > 0 ? params : undefined
	});
}

export async function getUserDetails(uuid: string): Promise<UserDetailDTO> {
	return apiClient<UserDetailDTO>(`/user/${uuid}/details`);
}

export async function getUsersByStatus(status: UserStatus): Promise<UserBasicDTO[]> {
	return apiClient<UserBasicDTO[]>(`/user/by-status/${status}`);
}

export async function getUsersByRole(role: UserRole): Promise<UserBasicDTO[]> {
	return apiClient<UserBasicDTO[]>(`/user/by-role/${role}`);
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
