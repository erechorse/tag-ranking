<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { ActionData, PageData } from './$types';

	let { data, form } = $props();

	// If successfully registered (form response), save to localStorage and redirect
	$effect(() => {
		if (form?.success && form?.playerId) {
			localStorage.setItem('tag_game_player_id', form.playerId);
			localStorage.setItem('tag_game_nickname', form.nickname);
			// Small delay for effect
			setTimeout(() => {
				goto('/');
			}, 1000);
		}
	});
</script>

<div
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4 text-white"
>
	<!-- Background Effects -->
	<div class="absolute inset-0 z-0">
		<div class="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-purple-900/30 blur-3xl"></div>
		<div class="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-blue-900/30 blur-3xl"></div>
	</div>

	<div class="z-10 w-full max-w-lg">
		{#if !data.valid}
			<!-- Error State -->
			<div
				class="rounded-xl border border-red-500/50 bg-red-900/20 p-8 text-center backdrop-blur-sm"
			>
				<div class="mb-4 text-6xl">⚠️</div>
				<h1 class="mb-2 text-2xl font-bold text-red-400">Access Denied</h1>
				<p class="text-gray-300">{data.error}</p>
				<a href="/" class="mt-6 inline-block text-blue-400 underline hover:text-blue-300">
					Go to Leaderboard
				</a>
			</div>
		{:else if form?.success}
			<!-- Success State -->
			<div
				class="animate-pulse rounded-xl border border-green-500/50 bg-green-900/20 p-8 text-center backdrop-blur-sm"
			>
				<div class="mb-4 text-6xl">🎉</div>
				<h1 class="mb-2 text-3xl font-bold text-green-400">REGISTERED</h1>
				<p class="text-gray-300">Redirecting to Leaderboard...</p>
			</div>
		{:else}
			<!-- Registration Form -->
			<div
				class="rounded-2xl border border-gray-700 bg-gray-900/80 p-8 shadow-2xl backdrop-blur-md"
			>
				<div class="mb-8 text-center">
					<p class="mb-2 text-xs tracking-widest text-gray-400 uppercase">Your Time</p>
					<div
						class="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text font-mono text-6xl font-black text-transparent drop-shadow-lg filter"
					>
						{(data.time / 1000).toFixed(2)}<span class="text-2xl text-gray-500">s</span>
					</div>
				</div>

				<form method="POST" action="?/register" use:enhance class="space-y-6">
					<input type="hidden" name="token" value={data.token} />

					<div>
						<label
							for="nickname"
							class="mb-2 block text-sm font-bold tracking-wide text-gray-300 uppercase"
						>
							Codename (Nickname)
						</label>
						<input
							type="text"
							name="nickname"
							id="nickname"
							required
							maxlength="12"
							placeholder="ENTER NAME"
							class="w-full rounded-lg border border-gray-600 bg-black/50 px-4 py-3 font-mono text-xl text-white uppercase placeholder-gray-700 transition-all focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
						/>
					</div>



					<button
						type="submit"
						class="w-full transform rounded-lg bg-gradient-to-r from-cyan-600 to-blue-700 py-4 text-lg font-bold tracking-wider text-white shadow-lg shadow-cyan-900/50 transition-all hover:from-cyan-500 hover:to-blue-600 active:scale-95"
					>
						CLAIM RECORD
					</button>
				</form>
			</div>
		{/if}
	</div>
</div>
