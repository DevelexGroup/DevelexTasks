<script lang="ts">
	import JSZip from 'jszip';
	import pkg from 'file-saver';
	const { saveAs } = pkg;
	import { db } from '$lib/database/database';
	import type { Session } from '$lib/database/models/Session';

	// Receive data via props instead of loading it
	export let sessionsWithFirstRecord: (Session & { firstRecordDate: string })[] = [];

	const downloadAllDataAsZip = async (sessionId: string) => {
		const zip = new JSZip();

		// Fetch data from each table
		const userEvents = await db.userEvents.where('sessionId').equals(sessionId).toArray();
		const stateEvents = await db.stateEvents.where('sessionId').equals(sessionId).toArray();
		const fixations = await db.fixations.where('sessionId').equals(sessionId).toArray();
		const saccades = await db.saccades.where('sessionId').equals(sessionId).toArray();
		const intersects = await db.intersects.where('sessionId').equals(sessionId).toArray();
		const dwells = await db.dwells.where('sessionId').equals(sessionId).toArray();

		// Convert data to CSV and add to ZIP
		zip.file('userEvents.csv', convertToCSV(userEvents));
		zip.file('stateEvents.csv', convertToCSV(stateEvents));
		zip.file('fixations.csv', convertToCSV(fixations));
		zip.file('saccades.csv', convertToCSV(saccades));
		zip.file('intersects.csv', convertToCSV(intersects));
		zip.file('dwells.csv', convertToCSV(dwells));

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

	function replacer(key: string, value: any): any {
		return value === null ? '' : value;
	}
</script>

<div style="width: 100%; max-width: 1200px; padding: 24px;">
	<div
		style="max-height: 70vh; overflow: auto; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
	>
		<table style="width: 100%; border-collapse: collapse;">
			<thead style="position: sticky; top: 0; background: #f8fafc; z-index: 10;">
				<tr>
					<th
						style="padding: 16px; text-align: left; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;"
						>ID relace</th
					>
					<th
						style="padding: 16px; text-align: left; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;"
						>Název úrovně</th
					>
					<th
						style="padding: 16px; text-align: left; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;"
						>Uživatelské jméno</th
					>
					<th
						style="padding: 16px; text-align: left; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;"
						>Datum prvního záznamu</th
					>
					<th
						style="padding: 16px; text-align: left; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;"
						>Akce</th
					>
				</tr>
			</thead>
			<tbody>
				{#each sessionsWithFirstRecord as session, i}
					<tr style="background: {i % 2 === 1 ? '#f8fafc' : 'white'};">
						<td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #475569;"
							>{session.id}</td
						>
						<td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #475569;"
							>{session.name}</td
						>
						<td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #475569;"
							>{session.userName}</td
						>
						<td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #475569;"
							>{session.firstRecordDate}</td
						>
						<td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
							<button
								style="padding: 8px 16px; background: #0071bc; color: white; border-radius: 4px; font-weight: 500; transition: background-color 0.2s;"
								on:mouseover={(e) => (e.currentTarget.style.backgroundColor = '#30c0f2')}
								on:mouseout={(e) => (e.currentTarget.style.backgroundColor = '#0071bc')}
								on:click={() => downloadAllDataAsZip(session.id)}
							>
								Stáhnout vše jako ZIP
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
