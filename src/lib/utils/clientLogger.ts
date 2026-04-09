type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LogEntry {
	timestamp: number;
	level: LogLevel;
	message: string;
}

/**
 * A lightweight logger that buffers entries for later export as a file.
 *
 * **Capture-only** – does NOT call `console.*`, so DevTools stack traces
 * are never affected.  Use `console.log` directly when you also need
 * DevTools output.
 *
 * Usage:
 *   import { clientLog } from '$lib/utils/clientLogger';
 *   clientLog.log('session created', id);   // captured for the log file
 *   console.log('session created', id);     // (optional) DevTools with correct stack trace
 *
 * Buffering is only active between `start()` and `stop()` calls.
 * Use `exportAsFile()` to get all buffered entries as a plain-text File.
 */
class ClientLogger {
	private logs: LogEntry[] = [];
	private _active = false;

	/** Enable buffering and clear previous entries. */
	start(): void {
		this._active = true;
		this.logs = [];
	}

	/** Disable buffering (entries are kept until `clear()` or next `start()`). */
	stop(): void {
		this._active = false;
	}

	get active(): boolean {
		return this._active;
	}

	log(...args: unknown[]): void {
		this.capture('log', args);
	}

	warn(...args: unknown[]): void {
		this.capture('warn', args);
	}

	error(...args: unknown[]): void {
		this.capture('error', args);
	}

	info(...args: unknown[]): void {
		this.capture('info', args);
	}

	debug(...args: unknown[]): void {
		this.capture('debug', args);
	}

	/** Returns all buffered entries as a plain-text File suitable for upload. */
	exportAsFile(fileName = 'clientLogs.log'): File {
		const content = this.logs
			.map((entry) => {
				const time = new Date(entry.timestamp).toISOString();
				return `[${time}] [${entry.level.toUpperCase().padEnd(5)}] ${entry.message}`;
			})
			.join('\n');

		return new File([content], fileName, { type: 'text/plain' });
	}

	clear(): void {
		this.logs = [];
	}

	private capture(level: LogLevel, args: unknown[]): void {
		if (!this._active) return;
		this.logs.push({
			timestamp: Date.now(),
			level,
			message: args.map(formatArg).join(' ')
		});
	}
}

function formatArg(arg: unknown): string {
	if (typeof arg === 'string') return arg;
	if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack ?? ''}`;
	try {
		return JSON.stringify(arg, null, 2);
	} catch {
		return String(arg);
	}
}

/** Singleton – import this throughout the app. */
export const clientLog = new ClientLogger();
