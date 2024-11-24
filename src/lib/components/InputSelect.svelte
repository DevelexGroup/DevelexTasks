<script lang="ts">

	// Dispatch event when value changes
	const handleChange = (event: Event) => {
		const select = event.target as HTMLSelectElement;
		selectedValue = select.value;
		// Dispatch a custom event to parent with the selected value
		dispatch('change', { value: selectedValue });
	};

	import { createEventDispatcher } from 'svelte';
	interface Props {
		label?: string;
		options?: { value: string; label: string }[];
		selectedValue?: string;
		id?: string;
	}

	let {
		label = '',
		options = [],
		selectedValue = $bindable(''),
		id = 'select'
	}: Props = $props();
	const dispatch = createEventDispatcher();
</script>

<label for={id} class="mb-2 block text-sm font-medium text-gray-900">
	{label}
</label>

<select
	{id}
	class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
	onchange={handleChange}
	bind:value={selectedValue}
>
	<option value="" disabled selected>Select an option</option>
	{#each options as option}
		<option value={option.value}>{option.label}</option>
	{/each}
</select>
