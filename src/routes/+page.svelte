<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { createBrowserClient } from '@supabase/ssr';

	let { data } = $props();
	type Match = {
		duration_ms: number;
		created_at: string;
		players: {
			id: string;
			nickname: string;
		};
	};

	// matches is reactive
	// Casting to any or specific type to avoid "property does not exist" on players array/object ambiguity
	let matches = $state(data.matches as unknown as Match[]);

	// Sync state with data prop when it changes (e.g. invalidation)
	$effect(() => {
		matches = data.matches as unknown as Match[];
	});

	let myPlayerId = $state<string | null>(null);

	onMount(() => {
		myPlayerId = localStorage.getItem('tag_game_player_id');

		// Supabase Realtime Subscription
		// We use the browser client from layout usually, but here we can just use the provided supabase client or create one if needed component-side?
		// Actually `data.supabase` comes from layout.

		// Listen to changes on 'matches' table
		const channel = data.supabase
			.channel('public:matches')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
				// Simply reloading the data is the easiest way to ensure consistency including joins
				// Or we can manually splice the array if playload contains enough info.
				// Payload for INSERT on 'matches' only has match info, not joined player nickname.
				// So we must fetch again.
				invalidateAll();
			})
			.subscribe();

		return () => {
			data.supabase.removeChannel(channel);
		};
	});
</script>

<div
	class="min-h-screen bg-gray-950 font-sans text-white selection:bg-cyan-500 selection:text-black"
>
	<!-- Hero Header -->
	<header class="relative overflow-hidden px-6 py-20 text-center">
		<div
			class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"
		></div>
		<div
			class="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-900/30 blur-[100px]"
		></div>

		<h1
			class="relative z-10 mb-4 text-5xl font-black tracking-tighter uppercase italic md:text-7xl"
		>
			<span class="bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">Tag</span
			>
			<span class="text-cyan-400">Master</span>
		</h1>
		<p class="relative z-10 text-lg tracking-widest text-gray-400 uppercase">Speed Ranking</p>
	</header>

	<!-- Leaderboard Table -->
	<main class="relative z-10 mx-auto max-w-4xl px-4 pb-20">
		<div
			class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 shadow-2xl backdrop-blur-xl"
		>
			{#if matches.length === 0}
				<div class="p-12 text-center text-gray-500">
					<p class="text-xl">No records yet. Be the first to play!</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead
							class="border-b border-gray-800 bg-black/40 text-xs font-semibold tracking-wider text-gray-400 uppercase"
						>
							<tr>
								<th class="w-16 px-6 py-4 text-center">#</th>
								<th class="px-6 py-4">Player</th>
								<th class="px-6 py-4 text-right">Time</th>
								<th class="hidden px-6 py-4 text-right sm:table-cell">Date</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each matches as match, index}
								{@const isMe = match.players.id === myPlayerId}
								<tr
									class="group transition-colors {isMe
										? 'bg-cyan-900/20 hover:bg-cyan-900/30'
										: 'hover:bg-white/5'}"
								>
									<td
										class="px-6 py-4 text-center font-mono text-gray-500 transition-colors group-hover:text-white"
									>
										{#if index < 3}
											<span
												class="inline-flex h-6 w-6 items-center justify-center rounded-full {index ===
												0
													? 'bg-yellow-500 text-black'
													: index === 1
														? 'bg-slate-300 text-black'
														: 'bg-amber-700 text-black'} font-bold"
											>
												{index + 1}
											</span>
										{:else}
											{index + 1}
										{/if}
									</td>
									<td class="px-6 py-4">
										<div class="flex flex-col">
											<span class="text-lg font-bold {isMe ? 'text-cyan-400' : 'text-gray-200'}">
												{match.players.nickname}
												{#if isMe}
													<span
														class="ml-2 rounded bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold text-black uppercase"
														>YOU</span
													>
												{/if}
											</span>
										</div>
									</td>
									<td
										class="px-6 py-4 text-right font-mono text-xl font-bold {index === 0
											? 'text-yellow-400'
											: 'text-white'}"
									>
										{(match.duration_ms / 1000).toFixed(2)}<span class="ml-1 text-sm text-gray-500"
											>s</span
										>
									</td>
									<td class="hidden px-6 py-4 text-right text-sm text-gray-500 sm:table-cell">
										{new Date(match.created_at).toLocaleDateString()}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</main>
</div>
