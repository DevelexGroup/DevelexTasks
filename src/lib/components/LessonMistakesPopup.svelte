<script lang="ts">
	interface Props {
		handleContinueNextSlide: () => void;
		handleCancelLevel: () => void;
	}

	let { handleContinueNextSlide, handleCancelLevel }: Props = $props();
</script>

<div class="error-popup">
	<div class="error-popup-content">
		<h3>Pozor!</h3>
		<p>Udělal si moc chyb, chceš pokračovat na další úlohu nebo vyzkoušet jinou úroveň?</p>
		<button onclick={handleContinueNextSlide}>Pokračovat</button>
		<button onclick={handleCancelLevel}>Jít na seznam úrovní</button>
	</div>
</div>

<style>
	.error-popup {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.error-popup-content {
		background-color: white;
		padding: 20px;
		border-radius: 8px;
		max-width: 400px;
		text-align: center;
	}

	.error-popup-content button {
		padding: 8px 16px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 15px;
	}

	.error-popup-content button:hover {
		background-color: #0056b3;
	}
</style>
