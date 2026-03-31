<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { isDiagnosisMode, checkDiagnosisPassword } from '$lib/stores/diagnosis';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		onClose: () => void;
		cancelText?: string;
	}

	let { open, onOpenChange, onClose, cancelText = 'Zrušit' }: Props = $props();

	let passwordInput = $state('');
	let error = $state(false);

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (checkDiagnosisPassword(passwordInput)) {
			$isDiagnosisMode = true;
			error = false;
			passwordInput = '';
			onOpenChange(false);
		} else {
			error = true;
			passwordInput = '';
		}
	}

	function focusElement(node: HTMLElement) {
		setTimeout(() => node.focus(), 10);
	}

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			passwordInput = '';
			error = false;
		}
	});
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Diagnostický režim</Dialog.Title>
			<Dialog.Description>
				Zadejte heslo pro přístup k diagnostice.
			</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<input
					type="password"
					bind:value={passwordInput}
					placeholder="Zadejte heslo"
					class={`flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
					use:focusElement
				/>
				{#if error}
					<p class="mt-1 text-sm text-red-500">Nesprávné heslo.</p>
				{/if}
			</div>
			<Dialog.Footer class="flex gap-2">
				<button
					type="button"
					onclick={onClose}
					class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
				>
					{cancelText}
				</button>
				<button
					type="submit"
					class="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-gray-50 transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Potvrdit
				</button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

