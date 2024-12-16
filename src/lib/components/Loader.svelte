<script lang="ts">
	let {
		size = '2rem', // default 2rem (32px)
		thickness = '4px', // default 4px border
		color = 'border-gray-200' // default to gray
	} = $props();
</script>

<div class="flex items-center justify-center">
	<div
		class={`inline-block animate-spin rounded-full border-solid ${color} border-b-transparent border-l-transparent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`}
		role="status"
		style:width={size}
		style:height={size}
		style:border-width={thickness}
	>
		<span
			class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
			>Loading...</span
		>
	</div>
</div>
