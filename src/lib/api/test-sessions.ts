import {
	type Page,
	SortBy,
	SortDirection,
	type TestSessionDTO,
	type TestSessionPartDTO,
	TestSessionStatus
} from '$lib/types/api.types';
import { apiClient } from '$lib/api/client';

export async function createTestSession(testType: string): Promise<TestSessionDTO> {
	return apiClient<TestSessionDTO>('/test-sessions', {
		method: 'POST',
		params: { testType }
	});
}

export async function getTestSession(sessionId: string): Promise<TestSessionDTO> {
	return apiClient<TestSessionDTO>(`/test-sessions/${sessionId}`);
}

export async function deleteTestSession(sessionId: string): Promise<void> {
	return apiClient<void>(`/test-sessions/${sessionId}`, {
		method: 'DELETE'
	});
}

export async function getTestSessions(
	page?: number,
	limit?: number,
	sortBy?: SortBy,
	sortDirection?: SortDirection,
	userId?: string,
	testType?: string,
	status?: TestSessionStatus,
	fromDate?: Date,
	toDate?: Date
): Promise<Page<TestSessionDTO>> {
	const params: Record<string, string | number | boolean> = {};
	if (page !== undefined) params.page = page;
	if (limit !== undefined) params.limit = limit;
	if (sortBy) params.sortBy = sortBy;
	if (sortDirection) params.sortDirection = sortDirection;
	if (userId) params.userId = userId;
	if (testType) params.testType = testType;
	if (status) params.status = status;
	if (fromDate) params.fromDate = fromDate.toISOString();
	if (toDate) params.toDate = toDate.toISOString();

	return apiClient<Page<TestSessionDTO>>('/test-sessions', {
		params
	});
}

export async function completeTestSession(sessionId: string): Promise<TestSessionDTO> {
	return apiClient<TestSessionDTO>(`/test-sessions/${sessionId}/complete`, {
		method: 'PUT'
	});
}

export async function abortTestSession(sessionId: string): Promise<TestSessionDTO> {
	return apiClient<TestSessionDTO>(`/test-sessions/${sessionId}/abort`, {
		method: 'PUT'
	});
}

export async function addTestSessionPart(
	sessionId: string,
	partNumber: number
): Promise<TestSessionPartDTO> {
	return apiClient<TestSessionPartDTO>(`/test-sessions/${sessionId}/parts`, {
		method: 'POST',
		params: { partNumber }
	});
}

export async function getTestSessionParts(sessionId: string): Promise<TestSessionPartDTO[]> {
	return apiClient<TestSessionPartDTO[]>(`/test-sessions/${sessionId}/parts`);
}

export async function getTestSessionPart(
	sessionId: string,
	partId: string
): Promise<TestSessionPartDTO> {
	return apiClient<TestSessionPartDTO>(`/test-sessions/${sessionId}/parts/${partId}`);
}

// Files are sent as org.springframework.web.multipart MultipartFile[]
export async function addFileToTestSessionPart(
	sessionId: string,
	partId: string,
	file: File
): Promise<void> {
	const formData = new FormData();
	formData.append('file', file);

	await apiClient<void>(`/test-sessions/${sessionId}/parts/${partId}/files`, {
		method: 'POST',
		body: formData
	});
}

export async function downloadTestSessionFile(
	sessionId: string,
	fileId: string
): Promise<Blob> {
	return apiClient<Blob>(`/test-sessions/${sessionId}/files/${fileId}/download`, {
		responseType: 'blob'
	});
}

export async function streamTestSessionFile(
	sessionId: string,
	fileId: string
): Promise<Response> {
	return apiClient<Response>(`/test-sessions/${sessionId}/files/${fileId}/stream`, {
		responseType: 'stream'
	});
}
