<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		audioSrc: string;
		width?: number;
		height?: number;
	}

	let {
		width = 200,
		height = 180,
		audioSrc
	}: Props = $props();

	let isPlaying = $state(false);
	let audioElement = $state<HTMLAudioElement | null>(null);

	onMount(() => {
		audioElement = new Audio(audioSrc);

		audioElement.addEventListener('ended', () => {
			isPlaying = false;
		});

		return () => {
			if (audioElement) {
				audioElement.pause();
				audioElement = null;
			}
		};
	});

	function handleClick() {
		if (!audioElement) return;

		if (isPlaying) {
			audioElement.pause();
			audioElement.currentTime = 0;
			isPlaying = false;
		} else {
			audioElement.currentTime = 0;
			audioElement.play();
			isPlaying = true;
		}
	}
</script>

<button
	class="audio-hint"
	style={`width: ${width}px; height: ${height}px;`}
	onclick={handleClick}
	type="button"
	aria-label="Play audio hint"
	aria-pressed={isPlaying}
>
	<img src="/images/common/audio-player-inactive.svg" alt="Audio player" class="audio-icon" class:hidden={isPlaying} />
	<img src="/images/common/audio-player-active.svg" alt="Audio player playing" class="audio-icon" class:hidden={!isPlaying} />
</button>

<style>
	.audio-hint {
		position: relative;
		border: none;
		background: transparent;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.audio-icon {
		position: absolute;
		width: 100%;
		height: 100%;
		object-fit: contain;
		transition: opacity 0.3s ease-in-out;
		opacity: 1;
	}

	.audio-icon.hidden {
		opacity: 0;
		pointer-events: none;
	}
</style>
