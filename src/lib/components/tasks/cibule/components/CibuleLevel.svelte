<script lang="ts">
	import DwellTarget from '$lib/components/dwellTarget/DwellTarget.svelte';
	import type { CibuleTaskProps } from '$lib/components/tasks/cibule/cibule.types';

	const props: CibuleTaskProps = $props();

	const id = 'Cibule_Practice_1';
	let dwelled = $state<boolean>(false);
</script>

<div class="flex h-screen w-full items-center justify-center">
	<div {id}>
		<DwellTarget {id}
								 dwellTimeMs={500}
								 bufferSize={50}
								 onDwellComplete={() => {
				dwelled = true;
				setTimeout(() => props.onCompleted?.(), 1000);
			}}
		/>
	</div>

	{#if dwelled}
		<div class="mt-20">
			<p>Dwell detected!</p>
		</div>
	{/if}
</div>
