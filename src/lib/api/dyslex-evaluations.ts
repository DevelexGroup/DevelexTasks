import { apiClient } from './client';

export type DyslexEvaluationStatus =
	| 'SUBMITTING'
	| 'QUEUED'
	| 'PROCESSING'
	| 'CLASSIFYING'
	| 'COMPLETED'
	| 'FAILED';

export interface DyslexPreprocessingSettings {
	frequencyHz: number;
	screenWidthCm: number;
	screenHeightCm: number;
	screenDistanceCm: number;
	screenWidthPx: number;
	screenHeightPx: number;
}

export interface DyslexCandidateSession {
	sessionId: string;
	testType: string;
	sessionStartTime: string;
	available: boolean;
	issues: string[];
}

export interface DyslexTaskCandidates {
	key: DyslexTaskKey;
	label: string;
	requiredSlides: number[];
	sessions: DyslexCandidateSession[];
}

export interface DyslexCandidatesResponse {
	userId: string;
	username: string;
	displayName: string;
	tasks: DyslexTaskCandidates[];
}

export type DyslexTaskKey = 'syllables' | 'meantext' | 'pseudotext' | 'visdiff';

export interface DyslexSourceSession {
	key: DyslexTaskKey;
	label: string;
	sessionId: string | null;
	folderName: string;
}

export interface DyslexVoteSummary {
	outcome: 'DYSLEXIC' | 'INTACT' | 'INCONCLUSIVE';
	dyslexicVotes: number;
	intactVotes: number;
	totalVotes: number;
}

export interface DyslexModelResult {
	label: 'D' | 'I';
	probabilities: { D: number; I: number };
}

export interface DyslexTaskResult {
	models: Record<string, DyslexModelResult>;
}

export interface DyslexPipelineResult {
	job_id: string;
	status: string;
	tasks: Record<string, DyslexTaskResult>;
}

export interface DyslexEvaluation {
	id: string;
	subjectUserId: string | null;
	subjectUsername: string;
	requestedByUsername: string;
	status: DyslexEvaluationStatus;
	currentTask: string | null;
	completedTasks: number;
	totalTasks: number;
	createdAt: string;
	startedAt: string | null;
	completedAt: string | null;
	lastSyncedAt: string | null;
	lastSyncError: string | null;
	errorMessage: string | null;
	preprocessingSettings: DyslexPreprocessingSettings;
	sources: DyslexSourceSession[];
	summary: DyslexVoteSummary | null;
	result: DyslexPipelineResult | null;
}

export interface CreateDyslexEvaluationRequest {
	userId: string;
	syllablesSessionId: string;
	meantextSessionId: string;
	pseudotextSessionId: string;
	visdiffSessionId: string;
	preprocessingSettings: DyslexPreprocessingSettings;
}

export const getDyslexCandidates = (userId: string): Promise<DyslexCandidatesResponse> =>
	apiClient('/dyslex-evaluations/candidates', { params: { userId } });

export const createDyslexEvaluation = (
	request: CreateDyslexEvaluationRequest
): Promise<DyslexEvaluation> =>
	apiClient('/dyslex-evaluations', { method: 'POST', body: JSON.stringify(request) });

export const getDyslexEvaluations = (userId: string): Promise<DyslexEvaluation[]> =>
	apiClient('/dyslex-evaluations', { params: { userId } });

export const getDyslexEvaluation = (evaluationId: string): Promise<DyslexEvaluation> =>
	apiClient(`/dyslex-evaluations/${evaluationId}`);

export const downloadDyslexResult = (evaluationId: string): Promise<Blob> =>
	apiClient(`/dyslex-evaluations/${evaluationId}/result`, { responseType: 'blob' });
