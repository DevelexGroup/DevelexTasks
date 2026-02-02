import type { UserRole } from '$lib/types/api.types';
import { persistedNullable } from '../utils/persistedStore';

export interface AuthUser {
	userId: string;
	username: string;
	firstName: string;
	lastName: string;
	role: UserRole;
}

export const authUser = persistedNullable<AuthUser>('auth_user');
