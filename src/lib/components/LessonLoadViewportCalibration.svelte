<script lang="ts">
	import { getContext } from 'svelte';
	import { waitForTimeout } from '$lib/utils/waitForCondition';
	import type { GazeManager } from '@473783/develex-core';

	interface Props {
		onCalibrated: () => void;
	}

	let { onCalibrated }: Props = $props();

	const gazeManager = getContext<GazeManager>('gazeManager');

	const load = async (e: MouseEvent) => {
		e.preventDefault();
		if (!window) return;
		const windowScreen = {
			screen: {
				width: window.screen.width,
				height: window.screen.height
			}
		};
		gazeManager.setWindowCalibration(e, windowScreen);
		await waitForTimeout(500);
		onCalibrated();
	};
</script>

<button
	class="absolute inset-0 left-0 top-0 flex h-full w-full flex-col items-center justify-center gap-4"
	onclick={load}
	aria-label="Viewport Calibration"
></button>
