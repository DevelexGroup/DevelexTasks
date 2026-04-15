<script lang="ts">
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';

	interface Props {
		instructionVideo?: string;
		label: string;
		level?: string | number;
		levelLabel?: string | null;
	}

	const { instructionVideo, label, level, levelLabel }: Props = $props();
</script>

<div
	class="relative flex min-h-screen w-full overflow-hidden bg-gray-100 px-4 py-10 sm:px-6 lg:px-8"
>
	<div class="max-w-8xl relative mx-auto flex w-full items-center justify-center">
		<div
			class="w-full max-w-348 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-300/50"
		>
			<div class="grid gap-0 lg:grid-cols-[1.15fr_0.95fr]">
				<section class="flex items-center bg-indigo-50 px-2 py-3 sm:px-4 sm:py-5 lg:px-7 lg:py-8">
					<div
						class="w-full rounded-md border border-white bg-gray-900 p-5 shadow-lg shadow-gray-400/30 sm:p-6"
					>
						<div class="overflow-hidden rounded-[1.1rem] bg-black">
							{#if instructionVideo}
								<video class="aspect-video w-full object-cover" controls playsinline>
									<source src={instructionVideo} type="video/webm" />
									<track kind="captions" />

									Váš prohlížeč nepodporuje přehrávání videa.
								</video>
							{:else}
								<div
									class="flex aspect-video items-center justify-center bg-gray-900 px-6 text-center text-sm leading-6 text-gray-300"
								>
									Instrukční video není k dispozici.
								</div>
							{/if}
						</div>
					</div>
				</section>

				<section
					class="flex flex-col justify-center gap-7 bg-white px-7 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-16"
				>
					<div
						class="mb-4 inline-flex w-fit items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-2 text-base font-semibold tracking-wide text-blue-700"
					>
						<span class="h-2.5 w-2.5 rounded-full bg-blue-500"></span>

						{label}
						{levelLabel ? `- ${levelLabel}` : level ? `- úroveň ${level}` : ''}
					</div>

					<div class="space-y-5">
						<h2
							class="max-w-2xl text-4xl font-black tracking-tight text-gray-800 sm:text-[2.85rem]"
						>
							Instrukce
						</h2>

						<p class="max-w-2xl text-xl leading-8 text-gray-600 sm:text-lg">
							Nejprve se podívej na instrukce a poté přejdi k zácviku.
						</p>
					</div>

					<div class="flex flex-col gap-3 pt-3 sm:flex-row">
						<button
							type="button"
							class="inline-flex min-w-36 items-center justify-center rounded-md bg-gray-300 px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-400 focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 focus-visible:outline-none"
							onclick={() => taskStage.set(TaskStage.Practice)}
						>
							Zácvik
						</button>

						<button
							type="button"
							class="inline-flex min-w-36 items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-gray-50 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none"
							onclick={() => taskStage.set(TaskStage.Task)}
						>
							Začít úkol
						</button>
					</div>
				</section>
			</div>
		</div>
	</div>
</div>

<style>
	h2 {
		text-wrap: balance;
	}
</style>
