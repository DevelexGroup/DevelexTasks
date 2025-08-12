<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { GazeInteractionObjectValidationSettings } from 'develex-js-sdk';
	import type { GazeInteractionObjectValidationEvent } from 'develex-js-sdk';
	import type { GazeManager } from 'develex-js-sdk';

	interface Props {
		validationSettings: Partial<GazeInteractionObjectValidationSettings> & {
			validationDuration: number;
		};
		gazeManager: GazeManager;
		aoi: string;
		animation?: 'smaller' | 'bigger' | 'pulse';
		color?: string;
	}

	const {
		validationSettings,
		gazeManager,
		aoi,
		animation = 'smaller',
		color = 'red'
	}: Props = $props();

	let element: HTMLElement;
	let validationCircleElement: HTMLElement | null = null;

	const originalOnValidation = validationSettings.onValidation;

	validationSettings.onValidation = (result: GazeInteractionObjectValidationEvent) => {
		if (originalOnValidation) {
			originalOnValidation(result);
		}
		if (validationCircleElement) {
			validationCircleElement.remove();
			validationCircleElement = null;
		}
	};

	const handleClick = (e: MouseEvent) => {
		// Remove existing circle if any
		if (validationCircleElement) {
			validationCircleElement.remove();
		}

		// center coordinates of the button
		const centerCoordinates = {
			x: element.getBoundingClientRect().left + element.offsetWidth / 2,
			y: element.getBoundingClientRect().top + element.offsetHeight / 2
		};

		// Create and style the validation circle
		validationCircleElement = document.createElement('div');
		validationCircleElement.className = `validation-circle ${animation}`;
		validationCircleElement.style.left = `${centerCoordinates.x}px`;
		validationCircleElement.style.top = `${centerCoordinates.y}px`;
		validationCircleElement.style.backgroundColor = color;

		// Add the circle to the document
		document.body.appendChild(validationCircleElement);

		// Register with gaze manager
		gazeManager.register({
			interaction: 'validation',
			element: validationCircleElement,
			settings: validationSettings
		});
	};

	onDestroy(() => {
		if (validationCircleElement) {
			gazeManager.unregister({
				interaction: 'validation',
				element: validationCircleElement
			});
			validationCircleElement.remove();
		}
	});
</script>

<button
	id={aoi}
	class="relative"
	onclick={handleClick}
	aria-label="Validation Area"
	bind:this={element}
>
	<svg
		width="100"
		height="100"
		viewBox="0 0 100 100"
		xmlns="http://www.w3.org/2000/svg"
		class="text-neutral-500"
	>
		<!-- Outer Circle -->
		<circle cx="50" cy="50" r="20" stroke="currentColor" stroke-width="2" fill="none" />
		<!-- Vertical Line -->
		<line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" stroke-width="2" />
		<!-- Horizontal Line -->
		<line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" stroke-width="2" />
	</svg>
</button>

<style>
	:global(.validation-circle) {
		position: absolute;
		left: 50%;
		top: 50%;
		aspect-ratio: 1;
		transform: translate(-50%, -50%) scale(0);
		width: 120px;
		height: 120px;
		background-color: red;
		opacity: 0.25;
		border-radius: 50%;
		animation: circle-smaller 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	:global(.validation-circle.pulse) {
		animation: circle-pulse 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	:global(.validation-circle.bigger) {
		animation: circle-bigger 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	@keyframes circle-pulse {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			opacity: 0.75;
			transform: translate(-50%, -50%) scale(0.25);
		}
		75% {
			opacity: 0.5;
			transform: translate(-50%, -50%) scale(0.5);
		}
		100% {
			opacity: 0.25;
			transform: translate(-50%, -50%) scale(0);
		}
	}

	@keyframes circle-smaller {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(1);
		}
		100% {
			opacity: 0.75;
			transform: translate(-50%, -50%) scale(0);
		}
	}

	@keyframes circle-bigger {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0);
		}
		100% {
			opacity: 0.75;
			transform: translate(-50%, -50%) scale(1);
		}
	}
</style>
