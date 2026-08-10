import { apiClient } from './client';
import type {
	AddMemberRequest,
	GroupCreateRequest,
	GroupDTO,
	GroupMemberDTO,
	UserCreateRequest,
	UserDTO
} from '$lib/types/api.types';

export async function getAllGroups(): Promise<GroupDTO[]> {
	return apiClient<GroupDTO[]>('/groups');
}

export async function getMyGroups(): Promise<GroupDTO[]> {
	return apiClient<GroupDTO[]>('/groups/mine');
}

export async function getMyGroupMembers(): Promise<UserDTO[]> {
	return apiClient<UserDTO[]>('/groups/mine/members');
}

export async function createGroup(data: GroupCreateRequest): Promise<GroupDTO> {
	return apiClient<GroupDTO>('/groups', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function updateGroup(groupId: string, data: GroupCreateRequest): Promise<GroupDTO> {
	return apiClient<GroupDTO>(`/groups/${groupId}`, {
		method: 'PUT',
		body: JSON.stringify(data)
	});
}

export async function deleteGroup(groupId: string): Promise<void> {
	return apiClient<void>(`/groups/${groupId}`, {
		method: 'DELETE'
	});
}

export async function getGroupMembers(groupId: string): Promise<GroupMemberDTO[]> {
	return apiClient<GroupMemberDTO[]>(`/groups/${groupId}/members`);
}

export async function addMemberByUsername(
	groupId: string,
	data: AddMemberRequest
): Promise<GroupMemberDTO> {
	return apiClient<GroupMemberDTO>(`/groups/${groupId}/members`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function removeMember(groupId: string, userUuid: string): Promise<void> {
	return apiClient<void>(`/groups/${groupId}/members/${userUuid}`, {
		method: 'DELETE'
	});
}

export async function createStudentInGroup(
	groupId: string,
	data: Omit<UserCreateRequest, 'userRole'>
): Promise<UserDTO> {
	return apiClient<UserDTO>(`/groups/${groupId}/students`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}
