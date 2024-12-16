export const extractErrorMessage = (
	error: unknown,
	baseOfMessage: string,
	unknownMessage: string
) => {
	if (typeof error === 'string') {
		return `${baseOfMessage}: ${error}`;
	} else if (error instanceof Error) {
		return `${baseOfMessage}: ${error.message}`;
	} else {
		return `${baseOfMessage}: ${unknownMessage}`;
	}
};
