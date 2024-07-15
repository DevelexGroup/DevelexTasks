<script lang="ts">
	export let errorMessages: string[] = [];
</script>

<p>Sad hoot. I am sorry, but I encountered some errors.</p>
{#if errorMessages.length > 0}
	<ul>
		{#each errorMessages as errorMessage}
			<li>{errorMessage}</li>
		{/each}
	</ul>
{/if}
