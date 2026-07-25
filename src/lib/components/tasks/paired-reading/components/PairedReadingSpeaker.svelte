<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';

	interface Props {
		ready?: boolean;
	}

	let { ready = false }: Props = $props();
</script>

<div
	class={`flex h-25 w-25 items-center justify-center rounded-full border-4 bg-white transition-[border-color,box-shadow] duration-200 ${
		ready ? 'border-[#50c878] shadow-[0_0_0_0.35rem_rgb(80_200_120/18%)]' : 'border-gray-400'
	}`}
	aria-label="Přehrát slovo"
>
	<img class="h-auto w-17" src={resolveAny('/images/common/audio-player-inactive.svg')} alt="" />
</div>
