<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import Button from './Button.svelte';
</script>

<div class="flex h-full w-full flex-col items-center justify-center space-y-4 bg-red-50">
	<p class="text-gray-700">Task byl failnut/ukončen!</p>
	<Button href={resolveAny('/')}>Zpět na tasky</Button>
</div>
