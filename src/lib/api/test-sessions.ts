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
	files: File[],
	replaceExisting = false
): Promise<void> {
	const formData = new FormData();
	for (const file of files) {
		formData.append('files', file);
	}

	await apiClient<void>(`/test-sessions/${sessionId}/parts/${partId}/files`, {
		method: 'POST',
		body: formData,
		...(replaceExisting ? { params: { replaceExisting: true } } : {})
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

export interface I2mcParameters {
	xres: number;
	yres: number;
	/** Sampling rate in Hz; 0 = estimate from device timestamps. */
	freq: number;
	eyes: 'both' | 'average';
	gapSplitMs: number;
	minFixDur: number;
	/** Screen size [widthCm, heightCm]; omitted = 24" 16:9 monitor (53.13 × 29.89 cm). */
	scrSz?: [number, number];
	dist: number;
}

/** Mirrors the server script's COMMON_RATES. */
export const I2MC_COMMON_RATES = [30, 60, 75, 90, 120, 150, 200, 250, 300, 500, 600, 1000, 1200];

/** Snaps a measured sampling rate to a common tracker rate within 5 %, like the server script. */
export function snapToCommonRate(freq: number): number {
	for (const rate of I2MC_COMMON_RATES) {
		if (Math.abs(freq - rate) / rate <= 0.05) return rate;
	}
	return Math.max(1, Math.round(freq));
}

/** Mirrors the server script defaults: 24" 1920×1080 monitor at 65 cm, canonical I2MC 40 ms. */
export const I2MC_DEFAULT_PARAMETERS: I2mcParameters = {
	xres: 1920,
	yres: 1080,
	freq: 0,
	eyes: 'both',
	gapSplitMs: 200,
	minFixDur: 40,
	dist: 65
};

export interface RecalculationScope {
	sessionIds?: string[];
	userIds?: string[];
}

export interface RecalculationPreviewRow {
	sessionId: string;
	hasRawData: boolean;
	missingI2mc: boolean;
	missingMeta: boolean;
	missingAoiGeometry: boolean;
	misplacedLogs: boolean;
}

/** Per-session breakdown of missing recalculable artifacts; empty scope targets all sessions. */
export async function previewRecalculation(
	scope: RecalculationScope
): Promise<RecalculationPreviewRow[]> {
	const result = await apiClient<{ sessions: RecalculationPreviewRow[] }>(
		'/test-sessions/post-processing/recalculate/preview',
		{ method: 'POST', body: JSON.stringify(scope) }
	);
	return result.sessions;
}

export interface PostProcessingProcessResult {
	status:
		| 'PROCESSED'
		| 'NO_OUTPUT'
		| 'SESSION_NOT_FOUND'
		| 'SESSION_IN_PROGRESS'
		| 'ALREADY_PROCESSED'
		| 'NO_INPUT'
		| 'ALREADY_QUEUED'
		| 'FAILED';
	message: string | null;
}

/** Runs one post-processor for one session on the server and waits for the outcome. */
export async function processSessionPostProcessor(
	sessionId: string,
	processor: string,
	parameters: Record<string, unknown>,
	replaceExisting = false
): Promise<PostProcessingProcessResult> {
	return apiClient<PostProcessingProcessResult>(
		`/test-sessions/${sessionId}/post-processing/${processor}/process`,
		{
			method: 'POST',
			params: { replaceExisting },
			body: JSON.stringify(parameters)
		}
	);
}

/** Moves clientLogs/bridgeLogs from slide parts into the META part; returns the moved count. */
export async function relocateSessionLogs(sessionId: string): Promise<number> {
	const result = await apiClient<{ moved: number }>(`/test-sessions/${sessionId}/relocate-logs`, {
		method: 'POST'
	});
	return result.moved;
}

export interface PostProcessingOutputFile {
	fileName: string;
	content: string;
}

/** Runs I2MC over the given rawGazeData CSVs (plus optional aoiGeometry JSONs) and returns the fixation CSVs without storing anything. */
export async function runI2mcHeadless(
	inputFiles: { name: string; content: string }[],
	parameters: I2mcParameters
): Promise<PostProcessingOutputFile[]> {
	const formData = new FormData();
	for (const file of inputFiles) {
		const type = file.name.toLowerCase().endsWith('.json') ? 'application/json' : 'text/csv';
		formData.append('files', new File([file.content], file.name, { type }));
	}
	formData.append(
		'parameters',
		new Blob([JSON.stringify(parameters)], { type: 'application/json' })
	);
	const result = await apiClient<{ files: PostProcessingOutputFile[] }>(
		'/test-sessions/post-processing/i2mc/run',
		{ method: 'POST', body: formData }
	);
	return result.files;
}

export async function streamTestSessionFile(sessionId: string, fileId: string): Promise<Response> {
	return apiClient<Response>(`/test-sessions/${sessionId}/files/${fileId}/stream`, {
		responseType: 'stream'
	});
}
