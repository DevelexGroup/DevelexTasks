<script lang="ts">
	import { instructionVideo } from '$lib/components/tasks/zrakovka/levels/1/index';
	import { id } from '$lib/components/tasks/zrakovka/levels/3/index';
	import { label } from '$lib/components/tasks/zrakovka/index';
	import Instructions from '$lib/components/common/Instructions.svelte';
</script>

<Instructions {instructionVideo} {label} level={id} />
