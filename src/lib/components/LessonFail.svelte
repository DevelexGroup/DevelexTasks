<script lang="ts">
	import Button from './Button.svelte';
</script>

<div class="flex h-full w-full flex-col items-center justify-center space-y-4 bg-red-50">
	<img src="/img/fail.png" alt="Fail" class="h-32 w-32 object-contain object-center" />
	<p class="text-gray-700">You failed, Pepíčku!</p>
	<Button href="/">Zpět na tasky</Button>
</div>
