<script lang="ts">
	import JSZip from 'jszip';
	import pkg from 'file-saver';
	const { saveAs } = pkg;
	import sessionRepository from '$lib/database/repositories/session.repository';
	import { onMount } from 'svelte';
	import { db } from '$lib/database/database';

	let sessions = [];

	onMount(async () => {
		sessions = await sessionRepository.getAll();
	});

	const downloadAllDataAsZip = async (sessionId: string) => {
		const zip = new JSZip();

		// Fetch data from each table
		const userEvents = await db.userEvents.where('sessionId').equals(sessionId).toArray();
		const stateEvents = await db.stateEvents.where('sessionId').equals(sessionId).toArray();
		const fixations = await db.fixations.where('sessionId').equals(sessionId).toArray();
		const saccades = await db.saccades.where('sessionId').equals(sessionId).toArray();
		const intersects = await db.intersects.where('sessionId').equals(sessionId).toArray();

		// Convert data to CSV and add to ZIP
		zip.file('userEvents.csv', convertToCSV(userEvents));
		zip.file('stateEvents.csv', convertToCSV(stateEvents));
		zip.file('fixations.csv', convertToCSV(fixations));
		zip.file('saccades.csv', convertToCSV(saccades));
		zip.file('intersects.csv', convertToCSV(intersects));

		// Generate the ZIP file and trigger download
		const content = await zip.generateAsync({ type: 'blob' });
		saveAs(content, `session-${sessionId}.zip`);
	};

	function convertToCSV(data: any[]): string {
		if (data.length === 0) return '';

		// Define column order with id and sessionId first
		let keys = Object.keys(data[0]);
		keys = [
			// Ensure these columns come first if they exist
			...keys.filter((k) => k === 'id'),
			...keys.filter((k) => k === 'sessionId'),
			// Then add all other columns
			...keys.filter((k) => k !== 'id' && k !== 'sessionId')
		];

		// Properly escape and format values
		const csvRows = data.map((row) =>
			keys
				.map((key) => {
					const value = row[key];
					if (value === null || value === undefined) return '';

					// Handle objects and arrays by stringifying them with quotes
					if (typeof value === 'object') {
						return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
					}

					// Handle strings with special characters
					if (typeof value === 'string') {
						return `"${value.replace(/"/g, '""')}"`;
					}

					return value;
				})
				.join(',')
		);

		return [keys.join(','), ...csvRows].join('\n');
	}

	function replacer(key, value) {
		return value === null ? '' : value;
	}
</script>

<div class="w-full max-w-screen-lg p-6">
	<table
		class="w-full"
		style="border-collapse: collapse; border-spacing: 0; border: 1px solid #e0e0e0;"
	>
		<thead>
			<tr class="border-b border-gray-200 bg-gray-100 text-left font-bold">
				<th class="px-4 py-2">Session ID</th>
				<th class="px-4 py-2">Level Name</th>
				<th class="px-4 py-2">Username</th>
				<th class="px-4 py-2">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each sessions as session, i}
				<tr class="border-b border-gray-200 py-2 last:border-b-0 {i % 2 === 1 ? 'bg-gray-50' : ''}">
					<td class="px-4 py-2">{session.id}</td>
					<td class="px-4 py-2">{session.name}</td>
					<td class="px-4 py-2">{session.userName}</td>
					<td class="px-4 py-2">
						<button
							class="rounded bg-[#0071bc] px-2 py-1 font-semibold text-white no-underline hover:bg-[#30c0f2]"
							on:click={() => downloadAllDataAsZip(session.id)}>Download All as ZIP</button
						>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
