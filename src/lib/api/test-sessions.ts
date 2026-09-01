import {
	type Page,
	PartType,
	SortBy,
	SortDirection,
	type TestSessionDTO,
	type TestSessionDetailDTO,
	type TestSessionPartDTO,
	TestSessionStatus
} from '$lib/types/api.types';
import { apiClient, BASE_URL } from '$lib/api/client';

export async function createTestSession(testType: string): Promise<TestSessionDTO> {
	return apiClient<TestSessionDTO>('/test-sessions', {
		method: 'POST',
		params: { testType }
	});
}

export async function getTestSession(sessionId: string): Promise<TestSessionDTO> {
	return apiClient<TestSessionDTO>(`/test-sessions/${sessionId}`);
}

export async function getTestSessionDetail(sessionId: string): Promise<TestSessionDetailDTO> {
	return apiClient<TestSessionDetailDTO>(`/test-sessions/${sessionId}/detail`);
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
	partNumber: number,
	partType: PartType = PartType.Slide
): Promise<TestSessionPartDTO> {
	return apiClient<TestSessionPartDTO>(`/test-sessions/${sessionId}/parts`, {
		method: 'POST',
		params: { partNumber, partType }
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
export async function addFilesToTestSessionPart(
	sessionId: string,
	partId: string,
	files: File[]
): Promise<void> {
	const formData = new FormData();
	for (const file of files) {
		formData.append('files', file);
	}

	await apiClient<void>(`/test-sessions/${sessionId}/parts/${partId}/files`, {
		method: 'POST',
		body: formData
	});
}

export async function downloadTestSessionFile(sessionId: string, fileId: string): Promise<Blob> {
	return apiClient<Blob>(`/test-sessions/${sessionId}/files/${fileId}/download`, {
		responseType: 'blob'
	});
}

export interface SessionExportRequest {
	sessionIds?: string[];
	userIds?: string[];
	fileName?: string;
}

export interface PreparedSessionExport {
	token: string;
	fileName: string;
}

export async function prepareSessionExport(
	request: SessionExportRequest
): Promise<PreparedSessionExport> {
	return apiClient<PreparedSessionExport>('/test-sessions/export/prepare', {
		method: 'POST',
		body: JSON.stringify(request)
	});
}

export function getExportDownloadUrl(token: string): string {
	return `${BASE_URL}/public/export/${token}`;
}

export async function getSessionCountsPerUser(): Promise<Record<string, number>> {
	return apiClient<Record<string, number>>('/test-sessions/counts');
}

export interface I2mcRecalculationRequest {
	sessionIds?: string[];
	userIds?: string[];
}

export interface I2mcRecalculationResult {
	queued: number;
	alreadyProcessed: number;
	skipped: number;
}

/** Queues server-side I2MC fixation detection; empty request targets all sessions. */
export async function recalculateI2mcFixations(
	request: I2mcRecalculationRequest
): Promise<I2mcRecalculationResult> {
	return apiClient<I2mcRecalculationResult>('/test-sessions/post-processing/i2mc/recalculate', {
		method: 'POST',
		body: JSON.stringify(request)
	});
}

export async function streamTestSessionFile(sessionId: string, fileId: string): Promise<Response> {
	return apiClient<Response>(`/test-sessions/${sessionId}/files/${fileId}/stream`, {
		responseType: 'stream'
	});
}
