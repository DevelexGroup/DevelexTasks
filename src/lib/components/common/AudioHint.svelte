<script lang="ts">
	interface Props {
		width: number;
		height: number;
	}

	let { width, height }: Props = $props();
</script>

<div style={`width: ${width}px; height: ${height}px;`}>

</div>