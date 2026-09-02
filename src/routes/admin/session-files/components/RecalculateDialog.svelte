<script lang="ts">
	import { untrack } from 'svelte';
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		checkSessionViewport,
		previewRecalculation,
		type RecalculationPreviewRow,
		type RecalculationScope
	} from '$lib/api/test-sessions';
	import { OUTSIDE_SHARE_WARNING } from '$lib/utils/sessionRecalc/sessionData';
	import type { AoiRect } from '$lib/utils/sessionSim/types';
	import type { ResolvedSlide } from '$lib/utils/sessionSim/taskResolver';
	import { RECALC_DEFAULT_VIEWPORT } from '$lib/utils/sessionRecalc/metaRebuild';
	import {
		RecalcRunner,
		sessionLabel,
		type RecalcItems,
		type Viewport
	} from '$lib/utils/sessionRecalc/runner.svelte';
	import OffscreenStimulusStage from '$lib/components/OffscreenStimulusStage.svelte';

	interface Props {
		open: boolean;
		scope: RecalculationScope;
		/** Called when the dialog closes after a run that changed data. */
		onFinished?: () => void;
	}

	let { open = $bindable(), scope, onFinished }: Props = $props();

	let phase = $state<'loading' | 'select' | 'verifying' | 'confirm' | 'running' | 'done'>(
		'loading'
	);
	let loadError = $state('');
	let rows = $state<RecalculationPreviewRow[]>([]);

	// ── Viewport verification before the run ──
	interface VerifyWarning {
		sessionId: string;
		label: string;
		message: string;
	}
	const VERIFY_CONCURRENCY = 4;
	let verifyProcessed = $state(0);
	let verifyTotal = $state(0);
	let verifyLabel = $state('');
	let verifyWarnings = $state<VerifyWarning[]>([]);
	// Bumping the token cancels an in-flight verification loop
	let verifyToken = 0;

	let items = $state<RecalcItems>({
		i2mc: false,
		forceI2mc: false,
		meta: false,
		aoiGeometry: false,
		logs: false
	});
	let viewportWidth = $state(RECALC_DEFAULT_VIEWPORT.width);
	let viewportHeight = $state(RECALC_DEFAULT_VIEWPORT.height);

	// ── Offscreen stimulus capture ──
	let stage = $state<OffscreenStimulusStage | null>(null);

	function captureSlide(resolved: ResolvedSlide, viewport: Viewport): Promise<AoiRect[]> {
		if (!stage) return Promise.reject(new Error('Stimul se nepodařilo vykreslit'));
		return stage.capture(resolved, viewport);
	}

	const runner = new RecalcRunner(captureSlide);

	// ── Preview counts ──
	const i2mcAll = $derived(rows.filter((r) => r.hasRawData).length);
	const i2mcMissing = $derived(rows.filter((r) => r.hasRawData && r.missingI2mc).length);
	const metaMissing = $derived(rows.filter((r) => r.missingMeta).length);
	const geometryMissing = $derived(rows.filter((r) => r.missingAoiGeometry).length);
	const logsMisplaced = $derived(rows.filter((r) => r.misplacedLogs).length);

	const selectedSessionCount = $derived(
		rows.filter((row) => RecalcRunner.sessionNeedsWork(row, items)).length
	);
	const needsViewport = $derived(items.aoiGeometry || items.meta);
	const viewportValid = $derived(viewportWidth > 0 && viewportHeight > 0);

	// ── Result summary ──
	const summary = $derived.by(() => {
		const outcomes = runner.outcomes;
		return {
			geometryUploaded: outcomes.reduce((sum, o) => sum + o.geometryUploaded, 0),
			geometrySkipped: outcomes.reduce((sum, o) => sum + o.geometrySkipped, 0),
			metasCreated: outcomes.filter((o) => o.metaCreated).length,
			ledgersUpdated: outcomes.filter((o) => o.ledgerUpdated).length,
			i2mcProcessed: outcomes.filter((o) => o.i2mcStatus === 'PROCESSED').length,
			logsMoved: outcomes.reduce((sum, o) => sum + o.logsMoved, 0),
			failed: outcomes.filter((o) => o.errors.length > 0)
		};
	});
	const anythingChanged = $derived(
		summary.geometryUploaded > 0 ||
			summary.metasCreated > 0 ||
			summary.ledgersUpdated > 0 ||
			summary.i2mcProcessed > 0 ||
			summary.logsMoved > 0
	);

	$effect(() => {
		if (!open) return;
		// The reopen forced by the close-while-running guard must not reset the run
		untrack(() => {
			if (!runner.running && phase !== 'running') loadPreview();
		});
	});

	// The offscreen stage must stay mounted while running; closing mid-run only requests a stop
	$effect(() => {
		if (!open && runner.running) {
			runner.stop();
			open = true;
		}
	});

	// Closing by any path cancels an in-flight verification loop
	$effect(() => {
		if (!open) verifyToken++;
	});

	async function loadPreview() {
		phase = 'loading';
		loadError = '';
		rows = [];
		try {
			rows = await previewRecalculation(scope);
			items = {
				i2mc: rows.some((r) => r.hasRawData && r.missingI2mc),
				forceI2mc: false,
				meta: rows.some((r) => r.missingMeta),
				aoiGeometry: rows.some((r) => r.missingAoiGeometry),
				logs: rows.some((r) => r.misplacedLogs)
			};
			phase = 'select';
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Nepodařilo se načíst přehled';
			phase = 'select';
		}
	}

	async function start() {
		if (selectedSessionCount === 0 || !viewportValid) return;
		const toVerify = rows.filter(
			(row) =>
				RecalcRunner.sessionNeedsWork(row, items) && RecalcRunner.sessionUsesViewport(row, items)
		);
		if (toVerify.length === 0) {
			await launch();
			return;
		}

		const token = ++verifyToken;
		phase = 'verifying';
		verifyProcessed = 0;
		verifyTotal = toVerify.length;
		verifyLabel = '';
		verifyWarnings = [];

		const warnings: (VerifyWarning | null)[] = toVerify.map(() => null);
		let next = 0;
		const worker = async () => {
			while (next < toVerify.length && token === verifyToken) {
				const index = next++;
				const warning = await verifySession(toVerify[index]);
				if (token !== verifyToken) return;
				warnings[index] = warning;
				verifyProcessed++;
			}
		};
		await Promise.all(Array.from({ length: VERIFY_CONCURRENCY }, worker));

		if (token !== verifyToken) return;
		verifyWarnings = warnings.filter((warning) => warning !== null);
		if (verifyWarnings.length > 0) phase = 'confirm';
		else await launch();
	}

	/** The server scans the session's raw gaze against the viewport the run would use. */
	async function verifySession(row: RecalculationPreviewRow): Promise<VerifyWarning | null> {
		try {
			const result = await checkSessionViewport(row.sessionId, {
				width: viewportWidth,
				height: viewportHeight
			});
			const label = sessionLabel(result);
			verifyLabel = label;
			if (result.outsideShare <= OUTSIDE_SHARE_WARNING) return null;
			return {
				sessionId: row.sessionId,
				label,
				message: `${Math.round(result.outsideShare * 100)} % pohledu mimo rozlišení ${result.viewport.width}×${result.viewport.height}`
			};
		} catch (err) {
			return {
				sessionId: row.sessionId,
				label: row.sessionId,
				message: `ověření selhalo: ${err instanceof Error ? err.message : String(err)}`
			};
		}
	}

	function cancelVerification() {
		verifyToken++;
		phase = 'select';
	}

	async function launch() {
		phase = 'running';
		try {
			await runner.run(rows, { ...items }, { width: viewportWidth, height: viewportHeight });
		} finally {
			phase = 'done';
		}
	}

	function close() {
		if (runner.running) return;
		const changed = phase === 'done' && anythingChanged;
		open = false;
		if (changed) onFinished?.();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[560px]">
		<Dialog.Header>
			<Dialog.Title>Doplnit chybějící soubory</Dialog.Title>
			<Dialog.Description>
				Dopočítá chybějící soubory sezení ze známých dat a označí je v meta.json jako
				rekonstruované.
			</Dialog.Description>
		</Dialog.Header>

		{#if phase === 'loading'}
			<div class="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
				<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
				Načítám přehled sezení…
			</div>
		{:else if phase === 'select'}
			{#if loadError}
				<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
					{loadError}
					<button class="ml-2 font-semibold hover:underline" onclick={loadPreview}>
						Zkusit znovu
					</button>
				</div>
			{:else}
				<div class="space-y-3 py-2">
					<p class="text-sm text-gray-500">
						V rozsahu je {rows.length} sezení. Vyberte, co se má doplnit:
					</p>

					<div class="rounded-lg border border-gray-200 p-3">
						<label class="flex items-start gap-3">
							<input
								type="checkbox"
								class="mt-0.5 h-4 w-4 accent-blue-600"
								bind:checked={items.i2mc}
								disabled={i2mcMissing === 0 && !items.forceI2mc}
							/>
							<span class="min-w-0 flex-1 text-sm">
								<span class="font-medium text-gray-800">I2MC fixace</span>
								<span class="ml-1 text-gray-400">chybí u {i2mcMissing} sezení</span>
							</span>
						</label>
						<label class="mt-1.5 ml-7 flex items-center gap-2 text-xs text-gray-500">
							<input
								type="checkbox"
								class="h-3.5 w-3.5 accent-blue-600"
								bind:checked={items.forceI2mc}
								disabled={i2mcAll === 0}
								onchange={() => {
									if (items.forceI2mc) items.i2mc = true;
								}}
							/>
							Přepočítat i existující ({i2mcAll} sezení s raw daty) – původní soubory zůstanou jako záloha
						</label>
					</div>

					<label class="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
						<input
							type="checkbox"
							class="mt-0.5 h-4 w-4 accent-blue-600"
							bind:checked={items.meta}
							disabled={metaMissing === 0}
						/>
						<span class="min-w-0 flex-1 text-sm">
							<span class="font-medium text-gray-800">meta.json</span>
							<span class="ml-1 text-gray-400">chybí u {metaMissing} sezení</span>
							<span class="mt-0.5 block text-xs text-gray-400">
								Identita a statistiky signálu z dat, prostředí nahradí výchozí hodnoty.
							</span>
						</span>
					</label>

					<label class="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
						<input
							type="checkbox"
							class="mt-0.5 h-4 w-4 accent-blue-600"
							bind:checked={items.aoiGeometry}
							disabled={geometryMissing === 0}
						/>
						<span class="min-w-0 flex-1 text-sm">
							<span class="font-medium text-gray-800">AOI geometrie</span>
							<span class="ml-1 text-gray-400">chybí u {geometryMissing} sezení</span>
							<span class="mt-0.5 block text-xs text-gray-400">
								Stimuly se vykreslí na pozadí a oblasti zájmu se z nich odečtou.
							</span>
						</span>
					</label>

					<label class="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
						<input
							type="checkbox"
							class="mt-0.5 h-4 w-4 accent-blue-600"
							bind:checked={items.logs}
							disabled={logsMisplaced === 0}
						/>
						<span class="min-w-0 flex-1 text-sm">
							<span class="font-medium text-gray-800">Přesun logů do meta části</span>
							<span class="ml-1 text-gray-400">{logsMisplaced} sezení</span>
						</span>
					</label>

					{#if needsViewport}
						<div class="rounded-lg border border-gray-200 p-3">
							<p class="text-sm font-medium text-gray-800">Rozlišení okna</p>
							<p class="mt-0.5 text-xs text-gray-400">
								Použije se jen u sezení bez zaznamenaného rozlišení.
							</p>
							<div class="mt-2 flex items-center gap-2 text-sm text-gray-700">
								<input
									type="number"
									class="w-24 rounded-md border border-gray-300 px-2 py-1"
									min="1"
									bind:value={viewportWidth}
								/>
								×
								<input
									type="number"
									class="w-24 rounded-md border border-gray-300 px-2 py-1"
									min="1"
									bind:value={viewportHeight}
								/>
								px
							</div>
						</div>
					{/if}
				</div>

				<Dialog.Footer>
					<button
						type="button"
						class="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
						onclick={close}
					>
						Zrušit
					</button>
					<button
						type="button"
						class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
						disabled={selectedSessionCount === 0 || !viewportValid}
						onclick={start}
					>
						Spustit ({selectedSessionCount} sezení)
					</button>
				</Dialog.Footer>
			{/if}
		{:else if phase === 'verifying'}
			<div class="space-y-4 py-4">
				<div>
					<div class="mb-1 flex justify-between text-sm text-gray-600">
						<span>Ověřuji rozlišení: {verifyProcessed} z {verifyTotal} sezení</span>
						<span>{verifyTotal > 0 ? Math.round((verifyProcessed / verifyTotal) * 100) : 0} %</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-gray-200">
						<div
							class="h-full rounded-full bg-blue-600 transition-all"
							style="width: {verifyTotal > 0 ? (verifyProcessed / verifyTotal) * 100 : 0}%"
						></div>
					</div>
				</div>
				<p class="truncate text-sm text-gray-500" title={verifyLabel}>{verifyLabel}</p>
			</div>

			<Dialog.Footer>
				<button
					type="button"
					class="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
					onclick={cancelVerification}
				>
					Zrušit
				</button>
			</Dialog.Footer>
		{:else if phase === 'confirm'}
			<div class="space-y-3 py-2">
				<div class="max-h-48 overflow-y-auto rounded-md border border-amber-200 bg-amber-50 p-3">
					<p class="mb-1 text-sm font-medium text-amber-800">
						Data mimo rozlišení ({verifyWarnings.length} sezení):
					</p>
					{#each verifyWarnings as warning (warning.sessionId)}
						<p class="text-xs text-amber-700">
							<span class="font-medium">{warning.label}:</span>
							{warning.message}
						</p>
					{/each}
				</div>
				<p class="text-sm text-gray-500">
					Můžete pokračovat, nebo se vrátit a upravit rozlišení okna.
				</p>
			</div>

			<Dialog.Footer>
				<button
					type="button"
					class="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
					onclick={() => (phase = 'select')}
				>
					Upravit
				</button>
				<button
					type="button"
					class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					onclick={launch}
				>
					Pokračovat
				</button>
			</Dialog.Footer>
		{:else if phase === 'running'}
			<div class="space-y-4 py-4">
				<div>
					<div class="mb-1 flex justify-between text-sm text-gray-600">
						<span>Zpracováno {runner.processed} z {runner.total} sezení</span>
						<span
							>{runner.total > 0 ? Math.round((runner.processed / runner.total) * 100) : 0} %</span
						>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-gray-200">
						<div
							class="h-full rounded-full bg-blue-600 transition-all"
							style="width: {runner.total > 0 ? (runner.processed / runner.total) * 100 : 0}%"
						></div>
					</div>
				</div>
				<p class="truncate text-sm text-gray-500" title={runner.currentLabel}>
					{runner.stopping ? 'Zastavuji po dokončení aktuální operace…' : runner.currentLabel}
				</p>
			</div>

			<Dialog.Footer>
				<button
					type="button"
					class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
					disabled={runner.stopping}
					onclick={() => runner.stop()}
				>
					Zastavit
				</button>
			</Dialog.Footer>
		{:else}
			<div class="space-y-3 py-2">
				<div class="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-gray-200 p-4 text-sm">
					<span class="text-gray-500">Soubory AOI geometrie</span>
					<span class="font-medium text-gray-800">
						{summary.geometryUploaded}{summary.geometrySkipped > 0
							? ` (${summary.geometrySkipped} slidů nelze vykreslit)`
							: ''}
					</span>
					<span class="text-gray-500">Vytvořené meta.json</span>
					<span class="font-medium text-gray-800">{summary.metasCreated}</span>
					<span class="text-gray-500">Aktualizované meta.json</span>
					<span class="font-medium text-gray-800">{summary.ledgersUpdated}</span>
					<span class="text-gray-500">I2MC přepočty</span>
					<span class="font-medium text-gray-800">{summary.i2mcProcessed}</span>
					<span class="text-gray-500">Přesunuté logy</span>
					<span class="font-medium text-gray-800">{summary.logsMoved}</span>
				</div>

				{#if runner.processed < runner.total}
					<p class="text-sm text-amber-600">
						Zpracování bylo zastaveno ({runner.processed} z {runner.total} sezení).
					</p>
				{/if}

				{#if summary.failed.length > 0}
					<div class="max-h-40 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3">
						<p class="mb-1 text-sm font-medium text-red-800">
							Chyby ({summary.failed.length} sezení):
						</p>
						{#each summary.failed as outcome (outcome.sessionId)}
							<p class="text-xs text-red-700">
								<span class="font-medium">{outcome.label}:</span>
								{outcome.errors.join('; ')}
							</p>
						{/each}
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<button
					type="button"
					class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					onclick={close}
				>
					Zavřít
				</button>
			</Dialog.Footer>
		{/if}

		<OffscreenStimulusStage bind:this={stage} />
	</Dialog.Content>
</Dialog.Root>
