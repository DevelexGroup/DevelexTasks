import { resolve } from '$app/paths';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolveAny = (path: string): string => resolve(path as any);
