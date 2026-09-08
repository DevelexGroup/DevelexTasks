import {
	processSessionPostProcessor,
	type PostProcessingPreviewRow,
	type PostProcessingProcessResult
} from '$lib/api/test-sessions';
import { sessionLabel } from '$lib/utils/sessionRecalc/runner.svelte';

export type PostProcessStatus = PostProcessingProcessResult['status'];

export interface PostProcessOutcome {
	sessionId: string;
	label: string;
	status: PostProcessStatus;
	message: string | null;
}

export const POST_PROCESS_STATUS_LABELS: Record<PostProcessStatus, string> = {
	PROCESSED: 'zpracováno',
	NO_OUTPUT: 'bez výstupu',
	SESSION_NOT_FOUND: 'sezení nenalezeno',
	SESSION_IN_PROGRESS: 'sezení probíhá',
	ALREADY_PROCESSED: 'již zpracováno',
	NO_INPUT: 'bez vstupních souborů',
	ALREADY_QUEUED: 'již ve frontě',
	FAILED: 'selhalo'
};

/**
 * Runs one post-processor session by session on the server and collects the
 * outcomes. Stopping finishes the in-flight session and halts.
 */
export class PostProcessRunner {
	running = $state(false);
	stopping = $state(false);
	processed = $state(0);
	total = $state(0);
	currentLabel = $state('');
	outcomes = $state<PostProcessOutcome[]>([]);

	stop(): void {
		if (this.running) this.stopping = true;
	}

	static sessionNeedsWork(row: PostProcessingPreviewRow, replaceExisting: boolean): boolean {
		return row.hasInput && (!row.hasOutput || replaceExisting);
	}

	async run(
		rows: PostProcessingPreviewRow[],
		processor: string,
		parameters: Record<string, unknown>,
		replaceExisting: boolean
	): Promise<void> {
		if (this.running) return;
		const pending = rows.filter((row) => PostProcessRunner.sessionNeedsWork(row, replaceExisting));

		this.running = true;
		this.stopping = false;
		this.processed = 0;
		this.total = pending.length;
		this.outcomes = [];

		try {
			for (const row of pending) {
				if (this.stopping) break;
				const label = sessionLabel(row);
				this.currentLabel = label;
				let outcome: PostProcessOutcome;
				try {
					const result = await processSessionPostProcessor(
						row.sessionId,
						processor,
						parameters,
						replaceExisting
					);
					outcome = {
						sessionId: row.sessionId,
						label,
						status: result.status,
						message: result.message
					};
				} catch (err) {
					outcome = {
						sessionId: row.sessionId,
						label,
						status: 'FAILED',
						message: err instanceof Error ? err.message : String(err)
					};
				}
				this.outcomes = [...this.outcomes, outcome];
				this.processed++;
			}
		} finally {
			this.running = false;
			this.stopping = false;
			this.currentLabel = '';
		}
	}
}
