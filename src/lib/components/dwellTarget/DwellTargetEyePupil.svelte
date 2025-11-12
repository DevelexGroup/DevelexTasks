<script lang="ts">
	interface Props {
		primaryColor?: string;
		reflectionOpacity?: number;
		gemStyle?: 'diamond' | 'emerald';
		pulseEnabled?: boolean;
		colorTransitionDuration?: number;
		width?: number;
		height?: number;
		x?: number;
		y?: number;
	}

	let {
		primaryColor = '#50C878',
		reflectionOpacity = 0.6,
		gemStyle = 'diamond',
		pulseEnabled = true,
		colorTransitionDuration = 0.8,
		width = 100,
		height = 100,
		x = 0,
		y = 0
	}: Props = $props();

	function adjustColor(color: string, amount: number): string {
		return (
			'#' +
			color
				.replace(/^#/, '')
				.replace(/../g, (c) =>
					('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).slice(-2)
				)
		);
	}

	const shades = $derived.by(() => [
		adjustColor(primaryColor, 40),
		adjustColor(primaryColor, 20),
		primaryColor,
		adjustColor(primaryColor, -20),
		adjustColor(primaryColor, -40)
	]);
</script>

<svg
	viewBox="0 0 100 100"
	xmlns="http://www.w3.org/2000/svg"
	{width}
	{height}
	{x}
	{y}
	class="gem-iris"
	class:pulse={pulseEnabled}
	style="--color-transition-duration: {colorTransitionDuration}s;"
>
	<!-- Background circle -->
	<circle cx="50" cy="50" r="50" fill={shades[4]} class="color-transition" />

	<!-- Clipped content -->
	<g clip-path="url(#gemClip)">
		<!-- Central gradient -->
		<circle cx="50" cy="50" r="40" fill={shades[2]} class="color-transition" />

		<!-- Facet patterns -->
		{#if gemStyle === 'diamond'}
			<!-- Diamond pattern -->
			<rect
				x="25"
				y="25"
				width="50"
				height="50"
				fill="none"
				stroke={shades[1]}
				stroke-width="0.5"
				transform="rotate(45, 50, 50)"
				class="color-transition"
			/>

			<!-- Reflection lines -->
			<line
				x1="30"
				y1="30"
				x2="70"
				y2="70"
				stroke="white"
				stroke-width="1"
				opacity={reflectionOpacity * 0.8}
			/>
			<line
				x1="70"
				y1="30"
				x2="30"
				y2="70"
				stroke="white"
				stroke-width="1"
				opacity={reflectionOpacity * 0.8}
			/>
		{:else}
			<!-- Emerald pattern -->
			<rect
				x="30"
				y="30"
				width="40"
				height="40"
				fill="none"
				stroke="white"
				stroke-width="0.4"
				opacity="0.3"
			/>
		{/if}

		<!-- Center dark pupil -->
		<circle cx="50" cy="50" r="15" fill={shades[4]} class="color-transition" />

		<!-- Highlight -->
		<ellipse cx="35" cy="35" rx="15" ry="10" fill="white" opacity={reflectionOpacity} />

		<!-- Center sparkle -->
		<circle cx="50" cy="50" r="2" fill="white" opacity="0.7" />
	</g>

	<defs>
		<clipPath id="gemClip">
			<circle cx="50" cy="50" r="48" />
		</clipPath>
	</defs>
</svg>

<style>
	.color-transition {
		transition:
			fill var(--color-transition-duration) ease,
			stroke var(--color-transition-duration) ease;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.03);
		}
		100% {
			transform: scale(1);
		}
	}

	.pulse {
		animation: pulse 4s ease-in-out infinite;
		transform-origin: center;
	}
</style>
