<script lang="ts">
	import { goto } from '$app/navigation';
	import { GazeManager } from 'develex-js-sdk';
	import { getContext } from 'svelte';

	interface Props {
		href: string;
		children?: import('svelte').Snippet;
	}

	let { href, children }: Props = $props();
	const gazeManager = getContext<GazeManager>('gazeManager');
	const processClick = (event: MouseEvent) => {
		gazeManager.setWindowCalibration(event, window);
		goto(href);
	};
</script>

<button
	onclick={processClick}
	class="rounded bg-[#0071bc] px-4 py-2 font-bold text-white no-underline hover:bg-[#30c0f2]"
>
	{@render children?.()}
</button>
