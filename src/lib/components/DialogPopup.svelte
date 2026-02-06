<script lang="ts">
	import { dialog, closeDialog, type ButtonVariant } from '$lib/stores/dialog';
	import * as Dialog from '$lib/components/ui/dialog';

	const variantClasses: Record<ButtonVariant, string> = {
		default: 'bg-blue-500 text-gray-50 hover:bg-blue-600',
		destructive: 'bg-red-500 text-gray-50 hover:bg-red-600 disabled:bg-red-300',
		outline: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-100',
		secondary: 'bg-gray-300 text-gray-800 hover:bg-gray-400',
		ghost: 'text-gray-800 hover:bg-gray-100'
	};

	function handleOpenChange(open: boolean) {
		if (!open && $dialog.closeOnOutsideClick !== false) {
			closeDialog();
		}
	}

	function handleButtonClick(callback: () => void, closeOnClick?: boolean) {
		callback();
		if (closeOnClick !== false) {
			closeDialog();
		}
	}
</script>

<Dialog.Root open={$dialog.open} onOpenChange={handleOpenChange}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{$dialog.title}</Dialog.Title>
			<Dialog.Description>
				{$dialog.description}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			{#each $dialog.options as option, i (i)}
				<button
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {variantClasses[
						option.variant ?? 'default'
					]}"
					onclick={() => handleButtonClick(option.callback ?? (() => {}), option.closeOnClick)}
				>
					{option.label}
				</button>
			{/each}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
