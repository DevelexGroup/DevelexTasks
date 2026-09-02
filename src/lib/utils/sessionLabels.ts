export type SessionMode = 'reeducation' | 'evaluation' | 'intervention';

export function sessionMode(testType: string): SessionMode {
	if (testType.endsWith('-evaluation')) return 'evaluation';
	if (testType.endsWith('-intervention')) return 'intervention';
	return 'reeducation';
}

export function taskLabel(testType: string): string {
	return testType.replace(/-(evaluation|intervention)$/, '');
}

export const modeLabels: Record<SessionMode, string> = {
	reeducation: 'Reedukace',
	evaluation: 'Evaluace',
	intervention: 'Intervence'
};

export const modeColors: Record<SessionMode, string> = {
	reeducation: 'bg-indigo-100 text-indigo-700',
	evaluation: 'bg-amber-100 text-amber-700',
	intervention: 'bg-cyan-100 text-cyan-700'
};

export function getStatusColor(status: string): string {
	switch (status) {
		case 'COMPLETED':
			return 'bg-green-100 text-green-700';
		case 'IN_PROGRESS':
			return 'bg-blue-100 text-blue-700';
		case 'ABANDONED':
			return 'bg-amber-100 text-amber-700';
		case 'ERROR':
			return 'bg-red-100 text-red-700';
		default:
			return 'bg-gray-100 text-gray-700';
	}
}

export function getStatusLabel(status: string): string {
	switch (status) {
		case 'COMPLETED':
			return 'Dokončeno';
		case 'IN_PROGRESS':
			return 'Probíhá';
		case 'ABANDONED':
			return 'Opuštěno';
		case 'ABORTED':
			return 'Přerušeno';
		case 'ERROR':
			return 'Chyba';
		default:
			return status;
	}
}

export function formatDate(date: Date | string): string {
	return new Date(date).toLocaleString('cs-CZ', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatTime(date: Date | string): string {
	return new Date(date).toLocaleTimeString('cs-CZ', {
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatDayHeading(date: Date | string): string {
	const label = new Date(date).toLocaleDateString('cs-CZ', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
	return label.charAt(0).toUpperCase() + label.slice(1);
}

export function userDisplayName(user: {
	username: string;
	firstName?: string | null;
	lastName?: string | null;
}): string {
	const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
	return name || user.username;
}
