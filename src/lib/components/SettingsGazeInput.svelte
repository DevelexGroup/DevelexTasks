<script lang="ts">
	import type { GazeInputConfig } from '@473783/develex-core';
	import { createEventDispatcher } from 'svelte';
	import InputSelect from './InputSelect.svelte';

	const dispatch = createEventDispatcher<{
		gazeInputSetup: GazeInputConfig; // TODO Switch to GazeInputConfigWithFixations
	}>();

	let gazeInputType: string = 'gazepointBase';
	let form: HTMLFormElement;

	const gazepointBase: GazeInputConfig = {
		tracker: 'opengaze',
		uri: 'ws://localhost:13892',
		fixationDetection: 'device'
	};

	const gazepointIdt: GazeInputConfig = {
		tracker: 'opengaze',
		uri: 'ws://localhost:13892',
		fixationDetection: 'idt'
	};

	const mouseIdt: GazeInputConfig = {
		tracker: 'dummy',
		fixationDetection: 'idt',
		frequency: 60,
		precisionMinimalError: 0.5,
		precisionDecayRate: 0.1,
		precisionMaximumError: 1.5
	};

	const handleSubmit = () => {
		let gazeInputConfig: GazeInputConfig;

		switch (gazeInputType) {
			case 'gazepointBase':
				gazeInputConfig = gazepointBase;
				break;
			case 'gazepointIdt':
				gazeInputConfig = gazepointIdt;
				break;
			case 'mouseIdt':
				gazeInputConfig = mouseIdt;
				break;
			default:
				throw new Error('Invalid gaze input type');
		}

		dispatch('gazeInputSetup', gazeInputConfig);
	};
</script>

<form bind:this={form} class="max-w-sm space-y-4" on:change|preventDefault={handleSubmit}>
	<div class="mb-8 text-sm text-gray-600">
		<InputSelect
			label="Gaze input type"
			options={[
				{ value: 'gazepointBase', label: 'GazePoint (Device fixation)' },
				{ value: 'gazepointIdt', label: 'GazePoint (IDT)' },
				{ value: 'mouseIdt', label: 'Mouse (IDT)' }
			]}
			bind:selectedValue={gazeInputType}
		/>
	</div>
</form>
