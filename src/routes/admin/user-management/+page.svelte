<script lang="ts">

import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>User Management</title>
	<meta name="description" content="User management admin page for Develex Tasks" />
</svelte:head>

<div class="fixed flex gap-1 bottom-4 left-4">
	<button
		class="px-3 py-1.5 bg-gray-300 text-gray-800 rounded-md"
		onclick={() => goto(resolve(`/`))}
	>
		Zpět
	</button>
</div>

<style>

</style>

