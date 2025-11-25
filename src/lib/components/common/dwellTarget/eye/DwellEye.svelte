<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import DwellEyePupil from '$lib/components/common/dwellTarget/eye/DwellEyePupil.svelte';

	interface Props {
		eyeWidth?: number;
		eyeHeight?: number;
		pupilColor?: string;
		gemStyle?: 'diamond' | 'emerald',
		colorTransitionDuration?: number;
		pupilProportion?: number;
		reflectionOpacity?: number;
		pulseEnabled?: boolean;
	}

	let {
		eyeWidth = 250,
		eyeHeight = 150,
		pupilColor = '#50C878',
		gemStyle = 'diamond',
		colorTransitionDuration = 0.8,
		pupilProportion = 1,
		reflectionOpacity = 0.6,
		pulseEnabled = true
	}: Props = $props();

	const eyeCenterX = $derived(eyeWidth / 2);
	const eyeCenterY = $derived(eyeHeight / 2);

	const EYELID_MARGIN = 6;

	const eyeShapePath = $derived(`
		M ${EYELID_MARGIN} ${eyeHeight / 2}
		Q ${eyeWidth / 4} ${EYELID_MARGIN}, ${eyeWidth / 2} ${EYELID_MARGIN}
		Q ${(eyeWidth / 4) * 3} ${EYELID_MARGIN}, ${eyeWidth - EYELID_MARGIN} ${eyeHeight / 2}
		Q ${(eyeWidth / 4) * 3} ${eyeHeight - EYELID_MARGIN}, ${eyeWidth / 2} ${eyeHeight - EYELID_MARGIN}
		Q ${eyeWidth / 4} ${eyeHeight - EYELID_MARGIN}, ${EYELID_MARGIN} ${eyeHeight / 2}
		Z
	`);

	const targetPupilSize = $derived(
		Math.min(eyeHeight * pupilProportion, eyeWidth * pupilProportion)
	);

	const pupilSizeTween = new Tween(targetPupilSize, {
		duration: colorTransitionDuration * 1000,
		easing: cubicOut
	});

	$effect(() => {
		pupilSizeTween.set(targetPupilSize);
	});

	const pupilX = $derived(eyeCenterX - pupilSizeTween.current / 2);
	const pupilY = $derived(eyeCenterY - pupilSizeTween.current / 2);
</script>

<div class="eye-container" style="--transition-duration: {colorTransitionDuration}s;">
	<svg
		width="100%"
		height="100%"
		viewBox={`0 0 ${eyeWidth} ${eyeHeight}`}
		preserveAspectRatio="xMidYMid meet"
	>
		<defs>
			<!-- Eye white gradient -->
			<radialGradient id="eyeWhiteGradient" cx="50%" cy="50%" r="70%" fx="45%" fy="45%">
				<stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
				<stop offset="85%" stop-color="#F8F8F8" stop-opacity="1" />
				<stop offset="100%" stop-color="#F0F0F0" stop-opacity="1" />
			</radialGradient>

			<!-- Subtle depth filter -->
			<filter id="eyeShadow" x="-10%" y="-10%" width="120%" height="120%">
				<feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#00000022" />
			</filter>

			<!-- Inner shadow filter -->
			<filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
				<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
				<feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
				<feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
			</filter>

			<!-- Create clip path -->
			<clipPath id="eyeClip">
				<path d={eyeShapePath} />
			</clipPath>
		</defs>

		<!-- Eye glow effect (outer) -->
		<path d={eyeShapePath} fill="none" stroke="#33333322" stroke-width="6" filter="blur(5px)" />

		<!-- Eye white base with gradient -->
		<path
			d={eyeShapePath}
			fill="url(#eyeWhiteGradient)"
			stroke="#444"
			stroke-width="1.5"
			filter="url(#eyeShadow)"
			class="eye-base"
		/>

		<!-- Subtle inner shadow -->
		<path d={eyeShapePath} fill="rgba(0,0,0,0.03)" filter="url(#innerShadow)" />

		<!-- Subtle iris texture hint -->
		<g clip-path="url(#eyeClip)" opacity="0.07">
			{#each Array(12) as _, i (i)}
				<line
					x1={eyeCenterX}
					y1={eyeCenterY}
					x2={eyeCenterX + Math.cos((i / 12) * Math.PI * 2) * eyeHeight * 0.7}
					y2={eyeCenterY + Math.sin((i / 12) * Math.PI * 2) * eyeHeight * 0.4}
					stroke="#444"
					stroke-width="0.5"
				/>
			{/each}
		</g>

		<!-- Fine details along edge -->
		<path
			d={eyeShapePath}
			fill="none"
			stroke="#FFFFFF"
			stroke-width="0.7"
			stroke-opacity="0.5"
			stroke-dasharray="1,2"
		/>

		<!-- Pupil properly positioned and clipped -->
		<g clip-path="url(#eyeClip)">
			<DwellEyePupil
				primaryColor={pupilColor}
				{reflectionOpacity}
				{gemStyle}
				{pulseEnabled}
				{colorTransitionDuration}
				width={pupilSizeTween.current}
				height={pupilSizeTween.current}
				x={pupilX}
				y={pupilY}
			/>

			<!-- Highlight reflection spot -->
			<ellipse
				cx={eyeCenterX * 0.85}
				cy={eyeCenterY * 0.7}
				rx={eyeWidth * 0.1}
				ry={eyeHeight * 0.07}
				fill="white"
				opacity="0.25"
				transform="rotate(-15, {eyeCenterX}, {eyeCenterY})"
			/>
		</g>
	</svg>
</div>

<style>
	.eye-container {
		position: relative;
		filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.15));
		width: 100%;
		height: 100%;
		display: block;
	}

	.eye-base {
		transition:
			fill var(--transition-duration) ease,
			stroke var(--transition-duration) ease;
	}
</style>