<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { onMount } from 'svelte';

	let { data, form } = $props();
	let { matches } = $derived(data);

	let durationInput = $state('');
	let isSerialConnected = $state(false);
	let reader: ReadableStreamDefaultReader | null = null;

	// Web Serial API Handler
	async function connectSerial() {
		if (!('serial' in navigator)) {
			alert('Web Serial API not supported in this browser.');
			return;
		}

		try {
			const port = await (navigator as any).serial.requestPort();
			await port.open({ baudRate: 115200 });

			const textDecoder = new TextDecoderStream();
			const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
			const streamReader = textDecoder.readable.getReader();
			reader = streamReader;

			isSerialConnected = true;

			// Read loop
			readLoop();
		} catch (err) {
			console.error('Serial Connection Error:', err);
			alert('Failed to connect to device.');
		}
	}

	let serialBuffer = '';

	async function readLoop() {
		if (!reader) return;
		try {
			while (true) {
				const { value, done } = await reader.read();
				if (done) {
					reader.releaseLock();
					break;
				}
				if (value) {
					serialBuffer += value;
					const lines = serialBuffer.split('\n');
					// The last element is either an empty string (if the last char was \n)
					// or an incomplete line. We keep it in the buffer.
					serialBuffer = lines.pop() ?? '';

					for (const line of lines) {
						const trimmed = line.trim();
						if (trimmed && !isNaN(Number(trimmed))) {
							durationInput = trimmed;
							// Optional: Auto-submit here if needed
						}
					}
				}
			}
		} catch (error) {
			console.error('Read error:', error);
		}
	}
</script>

<div class="min-h-screen bg-gray-900 p-6 text-white">
	<header class="mb-8 flex items-center justify-between">
		<h1
			class="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-3xl font-bold text-transparent"
		>
			Game Controller & Admin
		</h1>
		<div class="text-sm text-gray-400">
			{data.session?.user.email}
		</div>
	</header>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<!-- Left: Controls -->
		<div class="space-y-8">
			<!-- Input Card -->
			<div class="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
				<h2 class="mb-4 text-xl font-semibold text-blue-300">New Match Entry</h2>

				<div class="mb-6">
					<button
						onclick={connectSerial}
						disabled={isSerialConnected}
						class="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors
						{isSerialConnected
							? 'cursor-default border border-green-700 bg-green-900/50 text-green-300'
							: 'border border-gray-600 bg-gray-700 text-white hover:bg-gray-600'}"
					>
						{#if isSerialConnected}
							<span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
							Device Connected
						{:else}
							<span>🔌 Connect Serial Device</span>
						{/if}
					</button>
				</div>

				<form method="POST" action="?/createMatch" use:enhance class="space-y-4">
					<div>
						<label for="duration_ms" class="mb-1 block text-sm font-medium text-gray-400"
							>Duration (ms)</label
						>
						<div class="flex gap-2">
							<input
								type="number"
								id="duration_ms"
								name="duration_ms"
								bind:value={durationInput}
								placeholder="e.g. 45000"
								required
								class="flex-1 rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
							<button
								type="submit"
								class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-500"
							>
								Generate QR
							</button>
						</div>
					</div>
				</form>

				{#if form?.error}
					<div class="mt-4 rounded border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
						{form.error}
					</div>
				{/if}
			</div>

			<!-- QR Display -->
			{#if form?.success && form?.qrCodeDataUrl}
				<div
					class="flex flex-col items-center rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg"
				>
					<h2 class="mb-4 text-xl font-semibold text-purple-300">Scan to Claim Score</h2>
					<div class="rounded-lg bg-white p-4">
						<img src={form.qrCodeDataUrl} alt="Claim QR Code" class="h-64 w-64" />
					</div>
					<p class="mt-4 font-mono text-2xl font-bold tracking-wider text-white">
						{(form.match.duration_ms / 1000).toFixed(2)}s
					</p>
					<div class="mt-2 max-w-sm text-center text-xs break-all text-gray-500">
						{form.claimUrl}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right: Recent Matches -->
		<div class="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-semibold text-gray-300">Recent Matches</h2>
			<div class="overflow-hidden rounded-lg border border-gray-700">
				<table class="w-full text-left text-sm text-gray-400">
					<thead class="bg-gray-900 text-gray-200">
						<tr>
							<th class="px-4 py-3">Time</th>
							<th class="px-4 py-3">Duration</th>
							<th class="px-4 py-3">Player</th>
							<th class="px-4 py-3">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-700 bg-gray-800">
						{#each matches as match}
							<tr class="hover:bg-gray-750 transition-colors">
								<td class="px-4 py-3 whitespace-nowrap">
									{new Date(match.created_at).toLocaleTimeString()}
								</td>
								<td class="px-4 py-3 font-mono text-white">
									{(match.duration_ms / 1000).toFixed(2)}s
								</td>
								<td class="px-4 py-3">
									{#if match.players}
										<span class="font-medium text-green-400">{match.players.nickname}</span>
									{:else}
										<span class="text-gray-500 italic">Unclaimed</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									{#if match.players}
										<span
											class="inline-flex items-center rounded bg-green-900 px-2 py-0.5 text-xs font-medium text-green-300"
										>
											Done
										</span>
									{:else}
										<span
											class="inline-flex items-center rounded bg-yellow-900 px-2 py-0.5 text-xs font-medium text-yellow-300"
										>
											Pending
										</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
