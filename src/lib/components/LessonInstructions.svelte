<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import { onMount } from 'svelte';

	interface Props {
		handleInsturctionsContinue: () => void;
		audioPath: string;
	}

	let { handleInsturctionsContinue, audioPath }: Props = $props();

	const audio = new Audio(resolveAny(audioPath));

	const handlePlayAudio = () => {
		audio.pause();
		audio.currentTime = 0;
		audio.play();
	};

	onMount(() => {
		setTimeout(() => {
			handlePlayAudio();
		}, 500);

		return () => {
			audio.pause();
		};
	});
</script>

<div class="flex flex-col items-center justify-center gap-8">
	<button
		onclick={handlePlayAudio}
		class="rounded-md p-4 transition duration-200 hover:bg-gray-200"
	>
		<img src={resolveAny('/icons/earhear.svg')} class="h-36" alt="Poslouchej" />
	</button>

	<h2 class="text-2xl font-medium text-gray-800">Poslouchej instrukce</h2>

	<button
		onclick={handleInsturctionsContinue}
		class="rounded-md bg-blue-500 px-4 py-2 text-lg font-semibold text-gray-50 hover:bg-blue-600"
		>Pokračovat na úlohu</button
	>
</div>
