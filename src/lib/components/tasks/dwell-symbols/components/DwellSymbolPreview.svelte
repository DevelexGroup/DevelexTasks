<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import { getShapeClass, type DwellSymbolCriterion } from '../dwell-symbols';

	interface Props {
		criterion: DwellSymbolCriterion;
		size?: number;
	}

	let { criterion, size = 260 }: Props = $props();

	const shapeClass = $derived(getShapeClass(criterion.shape));
</script>

<div
	class="flex items-center justify-center select-none"
	style:width="{size}px"
	style:height="{size}px"
	aria-label={`${criterion.image.alt} in a ${criterion.shape}`}
>
	<div class="flex items-center justify-center shadow-[0_14px_36px_rgb(15_23_42/16%)] {shapeClass}">
		<img
			class="pointer-events-none h-[58%] w-[58%] object-contain"
			src={resolveAny(`/images/tasks/zrakovka/${criterion.image.name}.webp`)}
			alt={criterion.image.alt}
			draggable="false"
		/>
	</div>
</div>
