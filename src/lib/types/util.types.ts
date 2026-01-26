export type PartialArrayable<T> = {
	[K in keyof T]?: T[K] | T[K][];
};
