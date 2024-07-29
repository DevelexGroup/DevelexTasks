type CustomEventListener<T> = (data: T) => void;

export class CustomEventEmitter<T> {
	private listeners: CustomEventListener<T>[] = [];

	/**
	 * Register an event listener
	 * @param listener - The listener function to be called when the event is emitted
	 */
	on(listener: CustomEventListener<T>): void {
		this.listeners.push(listener);
	}

	/**
	 * Remove an event listener
	 * @param listener - The listener function to be removed
	 */
	off(listener: CustomEventListener<T>): void {
		this.listeners = this.listeners.filter((l) => l !== listener);
	}

	/**
	 * Emit an event, calling all registered listeners with the given data
	 * @param data - The data to pass to each listener
	 */
	emit(data: T): void {
		for (const listener of this.listeners) {
			listener(data);
		}
	}
}
