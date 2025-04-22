import xstateEventsRepository from '$lib/database/repositories/xstateEvents.repository';

export const handleLog = (
	sessionId: string,
	event: string,
	status: string,
	task: string,
	timestamp: string | null = null
) => {
	const xstateEvent = xstateEventsRepository.createFromInspectionEvent(
		sessionId,
		event,
		status,
		{},
		timestamp == null ? new Date().toISOString() : timestamp,
		task
	);

	xstateEventsRepository.create(xstateEvent).catch((error) => {
		console.error('Failed to store XState event:', error);
	});
};
