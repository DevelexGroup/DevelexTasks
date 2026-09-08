<script lang="ts">
	import type { PostProcessorParameter } from '$lib/api/test-sessions';
	import type { ParameterDraft } from '$lib/utils/postProcessing/parameters';

	interface Props {
		parameters: PostProcessorParameter[];
		draft: ParameterDraft;
		errors: Record<string, string>;
	}

	let { parameters, draft = $bindable(), errors }: Props = $props();

	const inputClass = 'w-full rounded-md border border-gray-300 px-2 py-1 text-sm';
</script>

<div class="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
	{#each parameters as parameter (parameter.key)}
		{#if parameter.type === 'BOOLEAN'}
			<label class="col-span-2 flex items-start gap-2">
				<input
					type="checkbox"
					class="mt-0.5 h-4 w-4 accent-blue-600"
					checked={draft[parameter.key] === 'true'}
					onchange={(e) => (draft[parameter.key] = e.currentTarget.checked ? 'true' : 'false')}
				/>
				<span class="min-w-0 flex-1">
					<span class="text-gray-800">{parameter.label}</span>
					{#if parameter.description}
						<span class="block text-xs text-gray-400">{parameter.description}</span>
					{/if}
				</span>
			</label>
		{:else}
			<label class="space-y-1">
				<span class="text-xs text-gray-500">
					{parameter.label}{parameter.required ? '' : ' (volitelné)'}
				</span>
				{#if parameter.type === 'SELECT'}
					<select
						class={inputClass}
						value={draft[parameter.key]}
						onchange={(e) => (draft[parameter.key] = e.currentTarget.value)}
					>
						{#if !parameter.required}
							<option value="">–</option>
						{/if}
						{#each parameter.options ?? [] as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				{:else}
					<input
						type={parameter.type === 'STRING' ? 'text' : 'number'}
						class={inputClass}
						value={draft[parameter.key]}
						min={parameter.min ?? undefined}
						max={parameter.max ?? undefined}
						step={parameter.type === 'INTEGER' ? 1 : 'any'}
						oninput={(e) => (draft[parameter.key] = e.currentTarget.value)}
					/>
				{/if}
				{#if errors[parameter.key]}
					<span class="block text-xs text-red-600">{errors[parameter.key]}</span>
				{:else if parameter.description}
					<span class="block text-xs text-gray-400">{parameter.description}</span>
				{/if}
			</label>
		{/if}
	{/each}
</div>
