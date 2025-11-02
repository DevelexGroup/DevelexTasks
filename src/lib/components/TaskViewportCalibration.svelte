<script lang="ts">
	import { getContext } from 'svelte';
	import type { GazeManager } from 'develex-js-sdk';

	interface Props {
		onCalibrated: () => void;
	}

	let { onCalibrated }: Props = $props();

	const gazeManager = getContext<GazeManager>('gazeManager');

	const load = async (e: MouseEvent) => {
		e.preventDefault();

		if (!window) {
			return;
		}

		const windowScreen = {
			screen: {
				width: window.screen.width,
				height: window.screen.height
			}
		};

		await gazeManager.setWindowCalibration(e, windowScreen);

		onCalibrated();
	};
</script>

<button
	class="fixed inset-0 top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center gap-4 bg-neutral-200 font-sans text-xl text-gray-800"
	onclick={load}
	aria-label="Viewport Calibration"
>
	Klikni na mě
</button>
