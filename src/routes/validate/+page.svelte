<script>
	import GazeValidate from '$lib/components/validation/GazeValidate.svelte';
	import { GazeManager } from '@473783/develex-core';

	const gazeManager = new GazeManager();
	function handleValidatedPoint(result) {
		console.log(result);
	}
	function handleValidated() {
		console.log('validated');
	}
</script>

<GazeValidate {gazeManager} onValidatedPoint={handleValidatedPoint} onValidated={handleValidated} />
