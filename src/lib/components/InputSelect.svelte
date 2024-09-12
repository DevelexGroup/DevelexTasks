<script lang="ts">
	export let label: string = '';
	export let options: { value: string; label: string }[] = [];
	export let selectedValue: string = '';
	export let id: string = 'select';

	// Dispatch event when value changes
	const handleChange = (event: Event) => {
		const select = event.target as HTMLSelectElement;
		selectedValue = select.value;
		// Dispatch a custom event to parent with the selected value
		dispatch('change', { value: selectedValue });
	};

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<label for={id} class="mb-2 block text-sm font-medium text-gray-900">
	{label}
</label>

<select
	{id}
	class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
	on:change={handleChange}
	bind:value={selectedValue}
>
	<option value="" disabled selected>Select an option</option>
	{#each options as option}
		<option value={option.value}>{option.label}</option>
	{/each}
</select>
