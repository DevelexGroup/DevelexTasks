<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { resolveAny } from '$lib/utils/resolveAny';
	import GazeArea from '$lib/components/common/GazeArea.svelte';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';

	interface Props {
		audioSrc: string;
		playOnStart?: boolean;
		playOnStartDelay?: number;
		width?: number;
		height?: number;
		reportToAnalytics?: boolean;
	}

	let {
		width = 100,
		height = width * 0.9,
		playOnStart = false,
		playOnStartDelay = 0,
		reportToAnalytics = true,
		audioSrc,
	}: Props = $props();

	let isPlaying = $state(false);
	let audioElement = $state<HTMLAudioElement | null>(null);

	let inactiveSrc = resolveAny('/images/common/audio-player-inactive.svg');
	let activeSrc = resolveAny('/images/common/audio-player-active.svg');

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	onMount(() => {
		audioElement = new Audio(audioSrc);

		audioElement.addEventListener('ended', () => {
			isPlaying = false;
		});

		if (playOnStart) {
			setTimeout(() => {
				playAudio();
			}, playOnStartDelay);
		}

		return () => {
			if (audioElement) {
				audioElement.pause();
				audioElement = null;
			}
		};
	});

	function playAudio() {
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

	$effect(() => {
		if (reportToAnalytics) {
			analyticsManager.setSoundActive(audioSrc, isPlaying);
		}
	});
</script>

<GazeArea id="audio-hint">
	<button
		class="audio-hint"
		style={`width: ${width}px; height: ${height}px;`}
		onclick={playAudio}
		type="button"
		aria-label="Play audio hint"
		aria-pressed={isPlaying}
	>
		<img src={inactiveSrc} alt="Audio player" class="audio-icon" class:hidden={isPlaying} />
		<img src={activeSrc} alt="Audio player playing" class="audio-icon" class:hidden={!isPlaying} />
	</button>
</GazeArea>

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
