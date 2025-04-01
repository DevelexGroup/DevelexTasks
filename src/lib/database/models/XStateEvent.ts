export type XStateEvent = {
	id?: number;
	sessionId: string;
	timestamp: string;
	event: string;
	status: string;
	context: string; // We'll store the JSON stringified context here
};
