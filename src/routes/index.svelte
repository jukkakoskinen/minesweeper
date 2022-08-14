<script lang="ts">
	import * as A from 'fp-ts/lib/Array';
	import { fade } from 'svelte/transition';
	import { Game } from '$lib/game';
	import type * as t from '$lib/type';

	let game = Game.create(9, 10);

	$: view = A.chunksOf(game.size)(game.cells);

	function reveal(id: t.CellId): void {
		game = Game.reveal(game, id);
	}

	function toggleFlagged(id: t.CellId): void {
		game = Game.toggleFlagged(game, id);
	}
</script>

<svelte:head>
	<title>Minesweeper</title>
</svelte:head>

<div class="bg-black font-mono min-h-screen text-white">
	<div class="mx-auto max-w-xl p-4 md:p-12">
		<h1 class="mb-2 text-xl">Minesweeper</h1>
		<p class="mb-6 text-neutral-400">
			"Minesweeper is a logic puzzle video game generally played on personal computers."
			<span class="text-white"
				>—&nbsp;<a
					class="underline"
					href="https://en.wikipedia.org/wiki/Minesweeper_(video_game)"
					rel="noreferrer noopener"
					target="_blank">Wikipedia</a
				></span
			>
		</p>
		{#if game.state === 'won'}
			<a
				class="bg-transparent block border border-green-400 font-bold mb-4 p-2 text-center text-green-400 w-full"
				href="/"
				sveltekit:reload>You win! Play again?</a
			>
		{:else if game.state === 'lost'}
			<a
				class="bg-transparent block border border-red-400 font-bold mb-4 p-2 text-center text-red-400 w-full"
				href="/"
				sveltekit:reload>You lose! Try again?</a
			>
		{/if}
		<div
			class="border border-neutral-400 divide-neutral-600 divide-y flex flex-col mb-4 text-lg md:text-xl"
		>
			{#each view as row}
				<div class="divide-neutral-600 divide-x flex">
					{#each row as cell}
						<button
							class="aspect-square flex flex-1 items-center justify-center"
							on:click={() => reveal(cell.id)}
							on:contextmenu|preventDefault={() => toggleFlagged(cell.id)}
						>
							{#if cell.flagged}
								<span transition:fade|local class="text-purple-400">#</span>
							{:else if !cell.revealed}
								<span />
							{:else if cell.mined}
								<span transition:fade|local class="text-red-400">X</span>
							{:else}
								<span
									transition:fade|local
									class:text-neutral-600={cell.adjacentMineCount === 0}
									class:text-green-400={cell.adjacentMineCount === 1}
									class:text-cyan-400={cell.adjacentMineCount === 2}
									class:text-yellow-400={cell.adjacentMineCount >= 3}
								>
									{cell.adjacentMineCount || '.'}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			{/each}
		</div>
		<div class="text-neutral-400 text-sm md:fixed md:bottom-4 md:right-4">
			Made by <a class="text-white underline" href="https://www.jukkakoskinen.fi">Jukka Koskinen</a>
		</div>
	</div>
</div>
