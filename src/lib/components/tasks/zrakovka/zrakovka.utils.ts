export const getSize = (size: string | number | undefined) => {
	if (!size) {
		return 32;
	}

	if (typeof size === 'number') {
		return size;
	}

	const parsedSize = parseInt(size);

	return isNaN(parsedSize) ? 32 : parsedSize;
};
