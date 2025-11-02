export const extractError = (error: unknown, prefix?: string): string => {
	prefix = prefix ? `${prefix}: ` : '';

	if (typeof error === 'string') {
		return `${prefix}${error}`;
	} else if (error instanceof Error) {
		return `${prefix}${error.message}`;
	} else {
		return `${prefix}An unknown error occurred`;
	}
};
