import * as A from 'fp-ts/lib/Array';
import { flow, pipe } from 'fp-ts/lib/function';
import type * as t from './type';

export const Game = {
	create,
	reveal,
	toggleFlagged,
};

function create(size: number, mineCount: number): t.Game {
	return {
		state: 'playing',
		size,
		cells: createCells(size * size),
		mined: false,
		mineCount,
	};
}

function reveal(game: t.Game, id: t.CellId): t.Game {
	if (game.state !== 'playing') {
		return game;
	}
	if (cellById(game, id).revealed) {
		return game;
	}

	return pipe(
		game,
		updateCell(id, (cell) => ({ ...cell, revealed: true })),
		placeMines,
		floodReveal(id),
		updateState
	);
}

function toggleFlagged(game: t.Game, id: t.CellId): t.Game {
	if (game.state !== 'playing') {
		return game;
	}
	if (cellById(game, id).revealed) {
		return game;
	}
	if (!cellById(game, id).flagged && allFlagsUsed(game)) {
		return game;
	}

	return pipe(
		game,
		updateCell(id, (cell) => ({ ...cell, flagged: !cell.flagged })),
		placeMines,
		updateState
	);
}

function adjacentCells(game: t.Game, id: t.CellId): t.Cell[] {
	return game.cells.filter((cell) => isAdjacent(game, id, cell.id));
}

function allCellsRevealed({ cells }: t.Game): boolean {
	return cells.filter((cell) => !cell.mined).every((cell) => cell.revealed);
}

function allFlagsUsed({ cells, mineCount }: t.Game): boolean {
	return cells.filter((cell) => cell.flagged).length === mineCount;
}

function allMinesFlagged({ cells }: t.Game): boolean {
	return cells.filter((cell) => cell.mined).every((cell) => cell.flagged);
}

function cellById(game: t.Game, id: t.CellId): t.Cell {
	return game.cells[cellIdToIdx(id)];
}

function cellIdToIdx(id: t.CellId): number {
	return id - 1;
}

function cellIdToPos({ size }: t.Game, id: t.CellId): [number, number] {
	const idx = cellIdToIdx(id);

	return [idx % size, Math.floor(idx / size)];
}

function createCell(id: t.CellId): t.Cell {
	return {
		id,
		mined: false,
		flagged: false,
		revealed: false,
		adjacentMineCount: 0,
	};
}

function createCells(count: number): t.Cell[] {
	return A.makeBy(count, flow(idxToCellId, createCell));
}

function floodReveal(id: t.CellId) {
	return (game: t.Game): t.Game => {
		if (cellById(game, id).adjacentMineCount) {
			return game;
		}
		const adjacentCellIds = new Set(
			adjacentCells(game, id)
				.filter((cell) => !cell.revealed && !cell.mined)
				.map((cell) => cell.id)
		);
		if (!adjacentCellIds.size) {
			return game;
		}

		return [...adjacentCellIds].reduce(
			(game, id) => {
				return floodReveal(id)(game);
			},
			{
				...game,
				cells: game.cells.map((cell) => ({
					...cell,
					revealed: cell.revealed || adjacentCellIds.has(cell.id),
				})),
			}
		);
	};
}

function idxToCellId(idx: number): number {
	return idx + 1;
}

function isAdjacent(game: t.Game, a: t.CellId, b: t.CellId): boolean {
	if (a === b) {
		return false;
	}
	const [x1, y1] = cellIdToPos(game, a);
	const [x2, y2] = cellIdToPos(game, b);

	return Math.abs(x1 - x2) < 2 && Math.abs(y1 - y2) < 2;
}

function mineRevealed(game: t.Game): boolean {
	return game.cells.some((cell) => cell.mined && cell.revealed);
}

function placeMines(game: t.Game): t.Game {
	if (game.mined) {
		return game;
	}
	const cellIds = new Set(
		game.cells
			.filter((cell) => !cell.revealed)
			.map((cell) => cell.id)
			.sort(() => Math.random() - Math.random())
			.slice(0, game.mineCount)
	);

	return updateAdjacentMineCounts({
		...game,
		mined: true,
		cells: game.cells.map((cell) => ({ ...cell, mined: cellIds.has(cell.id) })),
	});
}

function updateAdjacentMineCounts(game: t.Game): t.Game {
	return {
		...game,
		cells: game.cells.map((cell) => {
			const adjacentMineCount = adjacentCells(game, cell.id).filter((cell) => cell.mined).length;

			return { ...cell, adjacentMineCount };
		}),
	};
}

function updateCell(id: t.CellId, fn: (cell: t.Cell) => t.Cell) {
	return (game: t.Game): t.Game => ({
		...game,
		cells: game.cells.map((cell) => (id === cell.id ? fn(cell) : cell)),
	});
}

function updateState(game: t.Game): t.Game {
	if (mineRevealed(game)) {
		return {
			...game,
			state: 'lost',
			cells: game.cells.map((cell) => ({ ...cell, revealed: true })),
		};
	}
	if (allCellsRevealed(game) || allMinesFlagged(game)) {
		return {
			...game,
			state: 'won',
			cells: game.cells.map((cell) => ({ ...cell, revealed: true })),
		};
	}

	return game;
}
