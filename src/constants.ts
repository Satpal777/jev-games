import type { CellPosition, PlayerSymbol } from './types';

export const HUMAN_PLAYER: PlayerSymbol = 'X';
export const AI_PLAYER: PlayerSymbol = 'O';

export const TOTAL_CELLS = 9;

export const CELL_POSITIONS: readonly CellPosition[] = Object.freeze([
  { index: 0, row: 0, col: 0, algebraic: 'A1', label: 'Top-Left' },
  { index: 1, row: 0, col: 1, algebraic: 'A2', label: 'Top-Center' },
  { index: 2, row: 0, col: 2, algebraic: 'A3', label: 'Top-Right' },
  { index: 3, row: 1, col: 0, algebraic: 'B1', label: 'Middle-Left' },
  { index: 4, row: 1, col: 1, algebraic: 'B2', label: 'Center' },
  { index: 5, row: 1, col: 2, algebraic: 'B3', label: 'Middle-Right' },
  { index: 6, row: 2, col: 0, algebraic: 'C1', label: 'Bottom-Left' },
  { index: 7, row: 2, col: 1, algebraic: 'C2', label: 'Bottom-Center' },
  { index: 8, row: 2, col: 2, algebraic: 'C3', label: 'Bottom-Right' },
]);

export interface WinningPattern {
  readonly indices: readonly [number, number, number];
  readonly description: string;
}

export const WINNING_PATTERNS: readonly WinningPattern[] = Object.freeze([
  { indices: [0, 1, 2], description: 'Top Row' },
  { indices: [3, 4, 5], description: 'Middle Row' },
  { indices: [6, 7, 8], description: 'Bottom Row' },
  { indices: [0, 3, 6], description: 'Left Column' },
  { indices: [1, 4, 7], description: 'Center Column' },
  { indices: [2, 5, 8], description: 'Right Column' },
  { indices: [0, 4, 8], description: 'Diagonal (Top-Left to Bottom-Right)' },
  { indices: [2, 4, 6], description: 'Diagonal (Top-Right to Bottom-Left)' },
]);

export function getCellPositionByIndex(index: number): CellPosition | undefined {
  if (index < 0 || index >= TOTAL_CELLS || !Number.isInteger(index)) {
    return undefined;
  }
  return CELL_POSITIONS[index];
}
