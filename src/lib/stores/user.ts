import { persisted } from '../utils/persistedStore';

export interface User {
	id: string;
}

const DEFAULT_USER: User = {
	id: 'Host'
};

export const userStore = persisted<User>('user', DEFAULT_USER);
