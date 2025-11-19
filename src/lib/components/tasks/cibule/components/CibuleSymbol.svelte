<script lang="ts">
	interface Props {
		symbol: string;
	}

	let {
		symbol
	}: Props = $props();
</script>

<div>
	<span class="font-serif text-4xl font-bold text-gray-800">{symbol}</span>
</div>