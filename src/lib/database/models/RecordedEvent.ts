export type RecordedEvent = {
	id?: number;
	sessionId: string;
	timestamp: number; // timestamp in milliseconds for this ONE...
	type: string;
	data: string;
};
