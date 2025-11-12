<script lang="ts">
	import DwellTarget from '$lib/components/dwellTarget/DwellTarget.svelte';

	const id = 'testik';
	let dwelled = $state<boolean>(false);
</script>

<div class="flex h-screen w-full items-center justify-center">
	<div {id}>
		<DwellTarget {id}
			dwellTimeMs={500}
			bufferSize={50}
			onDwellComplete={() => {
				dwelled = true;
			}}
		/>
	</div>

	{#if dwelled}
		<div class="mt-20">
			<p>Dwell detected!</p>
		</div>
	{/if}
</div>
