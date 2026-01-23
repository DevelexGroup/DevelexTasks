<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';

	let microphoneImg = resolveAny('/images/common/microphone.svg');
</script>
<div>
	<img src={microphoneImg} alt="Microphone" class="inline mr-2" />
</div>

<style>
	img {
		width: 100px;
		height: 100px;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 0.5;
		}
		50% {
			transform: scale(1.1);
			opacity: 1;
		}
	}
</style>