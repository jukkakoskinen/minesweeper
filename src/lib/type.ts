export type Cell = Readonly<{
	id: CellId;
	mined: boolean;
	flagged: boolean;
	revealed: boolean;
	adjacentMineCount: number;
}>;

export type CellId = number;

export type Game = Readonly<{
	state: 'playing' | 'won' | 'lost';
	size: number;
	cells: Cell[];
	mined: boolean;
	mineCount: number;
}>;
