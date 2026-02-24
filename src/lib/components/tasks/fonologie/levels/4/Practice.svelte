<script lang="ts">
	import FonologieLevel from '$lib/components/tasks/fonologie/components/FonologieLevel.svelte';
	import { id, rawData } from './index';
</script>

<FonologieLevel {id} {rawData} isPractice={true} useCategories={false} />
