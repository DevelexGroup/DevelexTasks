export type ValidationPoint = {
	id?: number;
	sessionId: string;
	timestamp: string; // ISO string
	where: 'topleft' | 'middle' | 'bottomright' | 'topright' | 'topmiddle';
	accuracy: number;
	precision: number;
	gazePointCount: number;
	gazePointIds: string; // Comma-separated IDs of gaze points
};
