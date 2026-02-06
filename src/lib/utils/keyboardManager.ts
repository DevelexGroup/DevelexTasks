export type KeyboardEventType = 'keydown' | 'keyup';

export type KeyIdentifier = { code: string } | { key: string };

export type KeyboardEventOptions = {
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	meta?: boolean;
	once?: boolean;
	preventDefault?: boolean;
	stopPropagation?: boolean;
	ignoreRepeat?: boolean;
};

export type KeyOptions = KeyIdentifier & KeyboardEventOptions;

export type KeyboardHandler = { dispose(): void };

export type KeyboardEventCallback = (e: KeyboardEvent) => void;

type KeyboardListener = {
	identifier: KeyIdentifier;
	callback: KeyboardEventCallback;
	options: KeyboardEventOptions;
	dispose: () => void;
};

export class KeyboardManager {
	private listeners = new Map<KeyboardEventType, Set<KeyboardListener>>();

	public onKeyDown(
		code: string,
		callback: KeyboardEventCallback,
		options?: KeyboardEventOptions
	): KeyboardHandler;
	public onKeyDown(callback: KeyboardEventCallback, options: KeyOptions): KeyboardHandler;
	public onKeyDown(
		first: string | KeyboardEventCallback,
		second?: KeyboardEventCallback | KeyOptions,
		third?: KeyboardEventOptions
	): KeyboardHandler {
		const args = this.normalizeArgs(first, second, third);
		return this.addListener('keydown', args.identifier, args.callback, args.options);
	}

	public onKeyUp(
		code: string,
		callback: KeyboardEventCallback,
		options?: KeyboardEventOptions
	): KeyboardHandler;
	public onKeyUp(callback: KeyboardEventCallback, options: KeyOptions): KeyboardHandler;
	public onKeyUp(
		first: string | KeyboardEventCallback,
		second?: KeyboardEventCallback | KeyOptions,
		third?: KeyboardEventOptions
	): KeyboardHandler {
		const args = this.normalizeArgs(first, second, third);
		return this.addListener('keyup', args.identifier, args.callback, args.options);
	}

	public disposeAll(): void {
		this.listeners.forEach((listeners) => {
			listeners.forEach((listener) => listener.dispose());
		});
		this.listeners.clear();
	}

	public readonly dispatchOnKeyDown = (e: KeyboardEvent): void => {
		this.dispatchEvent('keydown', e);
	};

	public readonly dispatchOnKeyUp = (e: KeyboardEvent): void => {
		this.dispatchEvent('keyup', e);
	};

	private shouldIgnoreEvent(e: KeyboardEvent): boolean {
		const target = e.target as HTMLElement;
		if (target.isContentEditable) {
			return true;
		}
		const tagName = target.tagName.toLowerCase();
		return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
	}

	private dispatchEvent(type: KeyboardEventType, e: KeyboardEvent): void {
		if (this.shouldIgnoreEvent(e)) {
			return;
		}
		const listenersOfType = this.listeners.get(type);
		if (listenersOfType) {
			for (const listener of Array.from(listenersOfType)) {
				if (this.matchesKey(e, listener.identifier) && this.matchesModifiers(e, listener.options)) {
					if (listener.options.preventDefault) {
						e.preventDefault();
					}
					if (listener.options.stopPropagation) {
						e.stopPropagation();
					}
					if (listener.options.ignoreRepeat && e.repeat) {
						continue;
					}
					listener.callback(e);
					if (listener.options.once) {
						listener.dispose();
					}
				}
			}
		}
	}

	private addListener(
		type: KeyboardEventType,
		identifier: KeyIdentifier,
		callback: KeyboardEventCallback,
		options: KeyboardEventOptions
	): KeyboardHandler {
		const defaultDispose = (type: KeyboardEventType, listener: KeyboardListener): void => {
			const listenersOfType = this.listeners.get(type);
			if (listenersOfType) {
				listenersOfType.delete(listener);
				if (listenersOfType.size === 0) {
					this.listeners.delete(type);
				}
			}
		};

		const listener: KeyboardListener = {
			identifier,
			callback,
			options,
			dispose: () => defaultDispose(type, listener)
		};

		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}

		this.listeners.get(type)!.add(listener);

		return { dispose: () => listener.dispose() };
	}

	private normalizeArgs(
		first: string | KeyboardEventCallback,
		second?: KeyboardEventCallback | KeyOptions,
		third?: KeyboardEventOptions
	): { identifier: KeyIdentifier; callback: KeyboardEventCallback; options: KeyboardEventOptions } {
		if (typeof first === 'string') {
			if (typeof second !== 'function') {
				throw new Error('A callback function is required as the second argument.');
			}
			return {
				identifier: { code: first },
				callback: second,
				options: third ?? {}
			};
		}

		const callback = first;
		const keyOptions = second as KeyOptions | undefined;
		if (!keyOptions || (!('code' in keyOptions) && !('key' in keyOptions))) {
			throw new Error('Key options must include either `code` or `key`.');
		}

		if ('code' in keyOptions) {
			const { code, ...rest } = keyOptions;
			return { identifier: { code }, callback, options: rest };
		}

		const { key, ...rest } = keyOptions;
		return { identifier: { key }, callback, options: rest };
	}

	private matchesKey(event: KeyboardEvent, identifier: KeyIdentifier): boolean {
		return 'code' in identifier ? event.code === identifier.code : event.key === identifier.key;
	}

	private matchesModifiers(event: KeyboardEvent, options: KeyboardEventOptions): boolean {
		if (options.ctrl !== undefined && event.ctrlKey !== options.ctrl) return false;
		if (options.shift !== undefined && event.shiftKey !== options.shift) return false;
		if (options.alt !== undefined && event.altKey !== options.alt) return false;
		if (options.meta !== undefined && event.metaKey !== options.meta) return false;
		return true;
	}
}
