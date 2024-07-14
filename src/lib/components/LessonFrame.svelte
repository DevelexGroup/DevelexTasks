<script lang="ts">
	export let gazeInput: string;
</script>

<main class="flex h-screen w-screen flex-col items-center justify-center">
	<slot {gazeInput} />
</main>
