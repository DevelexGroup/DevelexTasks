<script lang="ts">
	import LessonError from '$lib/components/LessonError.svelte';
	import LessonLoad from '$lib/components/LessonLoad.svelte';
	import type { LessonConfig } from '$lib/types/lesson';
	import { fly } from 'svelte/transition';
	import LessonFrame from './LessonFrame.svelte';
	import { onDestroy, getContext } from 'svelte';
	import LessonDebug from './LessonDebug.svelte';
	import type {
		GazeInteractionObjectFixationEvent,
		GazeInteractionObjectIntersectEvent,
		GazeInteractionObjectSaccadeEvent,
		GazeManager
	} from '@473783/develex-core';
	import { onMount } from 'svelte';
	import sessionRepository from '$lib/database/repositories/session.repository';
	import { writable } from 'svelte/store';
	import stateEventsRepository from '$lib/database/repositories/stateEvents.repository';
	import userEventsRepository from '$lib/database/repositories/userEvents.repository';
	import saccadeRepository from '$lib/database/repositories/saccade.repository';
	import fixationRepository from '$lib/database/repositories/fixation.repository';
	import intersectionRepository from '$lib/database/repositories/intersect.repository';
	import { browser } from '$app/environment';

	interface Props {
		/**
		 * The lesson component that will be displayed as a lesson.
		 * It should accept a gazeFixationEmitter prop that will be used to register elements for fixation detection.
		 */
		getLessonConfig: () => Promise<LessonConfig['setup']>;
		/**
		 * @type {boolean}
		 * Indicates if the application is in debug mode. If so, the LessonDebug component will be displayed.
		 */
		isDebug: boolean;
		lessonName: string;
		backgroundColor?: string;
	}

	let { getLessonConfig, isDebug, lessonName, backgroundColor = 'transparent' }: Props = $props();

	let lessonConfig: LessonConfig['setup'] | null = $state(null);

	const handleError = (event: Event) => {
		console.log(event);
		const error = event instanceof ErrorEvent ? event.error : event;
		const message = error instanceof Error ? error.message : error.toString();
		errorMessages = [...errorMessages, message];
	};

	let errorMessages: string[] = $state([]);

	const lessonState = writable<'loading' | 'lessonFrame' | 'error'>('loading');

	const flyIn = { y: '100%', duration: 750, opacity: 0, delay: 500 };
	const flyOut = { duration: 200, opacity: 0 };

	const gazeManager = getContext<GazeManager>('gazeManager');

	const handleLoad = (obtainedLessonConfig: LessonConfig['setup']) => {
		if (!browser) return;
		lessonState.set('lessonFrame');
		lessonConfig = obtainedLessonConfig;
	};

	// Function to generate a unique ID
	const generateUniqueId = () => `session-${Date.now()}`;
	const sessionId = generateUniqueId();
	const userName = 'NoSpecificUser';

	onMount(async () => {
		if (!browser) return;

		await sessionRepository.create({
			id: sessionId,
			name: lessonName,
			userName: userName
		});
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('click', handleClick);
		gazeManager.on('saccadeObjectFrom', handleSaccade);
		gazeManager.on('saccadeObjectTo', handleSaccade);
		gazeManager.on('fixationObjectEnd', handleFixation);
		gazeManager.on('intersect', handleIntersection);
	});

	onDestroy(() => {
		if (!browser) return;
		if (gazeManager.input) {
			gazeManager.stop();
			gazeManager.disconnect();
			gazeManager.close();
		}
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mousedown', handleMouseDown);
		window.removeEventListener('mouseup', handleMouseUp);
		window.removeEventListener('click', handleClick);
		gazeManager.off('saccadeObjectFrom', handleSaccade);
		gazeManager.off('saccadeObjectTo', handleSaccade);
		gazeManager.off('fixationObjectEnd', handleFixation);
		gazeManager.off('intersect', handleIntersection);
	});

	// Subscribe to changes in lessonState and log them as stateEvents
	lessonState.subscribe(async (newState) => {
		console.log(`State changed to ${newState} in session ${sessionId} (lesson ${lessonName})`);
		await stateEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: newState,
			data: ''
		});
	});

	// Event handlers for mouse events
	const handleMouseMove = async (event: MouseEvent) => {
		console.log(`Mouse moved to: (${event.clientX}, ${event.clientY})`);
		await userEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: 'mousemove',
			data: `(${event.clientX}, ${event.clientY})`
		});
	};

	const handleMouseDown = async (event: MouseEvent) => {
		await userEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: 'mousedown',
			data: `(${event.clientX}, ${event.clientY})`
		});
	};

	const handleMouseUp = async (event: MouseEvent) => {
		await userEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: 'mouseup',
			data: `(${event.clientX}, ${event.clientY})`
		});
	};

	const handleClick = async (event: MouseEvent) => {
		await userEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: 'click',
			data: `(${event.clientX}, ${event.clientY})`
		});
	};

	const transformAoiFromTargets = (targets: Element[]) => {
		return targets
			.map((target) => {
				return target.id;
			})
			.join(';');
	};

	const handleSaccade = async (saccade: GazeInteractionObjectSaccadeEvent) => {
		// get aoi from targets id, diveded by ;
		const aoi = transformAoiFromTargets(saccade.target);
		await saccadeRepository.create({
			sessionId,
			timestamp: saccade.timestamp.toString(),
			type: saccade.type,
			aoi,
			duration: saccade.duration,
			distance: saccade.distance,
			angleToScreen: saccade.angleToScreen,
			gazeData: saccade.gazeData,
			originGazeData: saccade.originGazeData
		});
	};

	const handleFixation = async (fixation: GazeInteractionObjectFixationEvent) => {
		const aoi = transformAoiFromTargets(fixation.target);
		await fixationRepository.create({
			sessionId,
			timestamp: fixation.timestamp.toString(),
			type: fixation.type,
			aoi,
			duration: fixation.duration,
			gazeData: fixation.gazeData,
			fixationId: fixation.fixationId
		});
	};

	const handleIntersection = async (intersection: GazeInteractionObjectIntersectEvent) => {
		const aoi = transformAoiFromTargets(intersection.target);
		await intersectionRepository.create({
			sessionId,
			timestamp: intersection.timestamp.toString(),
			type: intersection.type,
			aoi,
			gazeData: intersection.gazeData
		});
	};

	const handleLessonStateTransition = async (newState: string) => {
		// log as stateEvent
		await stateEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: 'lessonFrameTransition',
			data: newState
		});
	};
</script>

<svelte:window onerror={handleError} />

<div class="relative flex h-screen w-screen items-center justify-center overflow-hidden">
	{#if !lessonConfig}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<LessonLoad onLoad={handleLoad} {getLessonConfig} />
		</div>
	{:else if $lessonState === 'error'}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<LessonError {errorMessages} />
		</div>
	{:else if $lessonState === 'lessonFrame'}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<LessonFrame
				{backgroundColor}
				{lessonConfig}
				onLessonStateTransition={handleLessonStateTransition}
			/>
		</div>
	{/if}
	{#if isDebug}
		<LessonDebug />
	{/if}
</div>
