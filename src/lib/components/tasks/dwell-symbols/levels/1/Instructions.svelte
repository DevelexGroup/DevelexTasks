<script lang="ts">
	import Instructions from '$lib/components/common/Instructions.svelte';
	import { label } from '../../index';
	import { id } from './index';

	interface Props {
		levelLabel?: string | null;
	}

	let { levelLabel = null }: Props = $props();
</script>

<Instructions {label} level={id} {levelLabel} />
