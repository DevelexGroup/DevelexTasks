export const getSize = (size: string | number | undefined) => {
	if (!size) {
		return 80;
	}

	if (typeof size === 'number') {
		return size;
	}

	const parsedSize = parseInt(size);

	return isNaN(parsedSize) ? 80 : parsedSize;
};
