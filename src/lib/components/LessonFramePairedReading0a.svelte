<script lang="ts">
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';

	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;

	/**
	 * gazeFixationEmitter.register(element, settings) to register an element as an AOI.
	 * you can either set callback in register method...
	 * or catch the event with gazeFixationEmitter.on('fixationSet' | 'fixationSetStart' | 'fixationSetEnd', (event) => {})
	 */
</script>
