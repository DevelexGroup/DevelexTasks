import { writable } from 'svelte/store';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';

export type DialogOption = {
	label: string;
	callback: () => void;
	variant?: ButtonVariant;
	closeOnClick?: boolean;
};

export type DialogState = {
	open: boolean;
	title: string;
	description: string;
	options: DialogOption[];
	closeOnOutsideClick?: boolean;
};

const initialState: DialogState = {
	open: false,
	title: '',
	description: '',
	options: [],
	closeOnOutsideClick: true
};

const { subscribe, set, update } = writable<DialogState>(initialState);

export type ShowDialogOptions = {
	title: string;
	description: string;
	options: DialogOption[];
	closeOnOutsideClick?: boolean;
};

export function showDialog(config: ShowDialogOptions) {
	set({
		open: true,
		title: config.title,
		description: config.description,
		options: config.options,
		closeOnOutsideClick: config.closeOnOutsideClick ?? true
	});
}

export function closeDialog() {
	update((state) => ({ ...state, open: false }));
}

export const dialog = { subscribe, set, update };
