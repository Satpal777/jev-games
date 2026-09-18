import { describe, expect, it } from 'bun:test';
import { CELL_POSITIONS } from './constants';
import { findImmediateWinMoves, selectForcedMove } from './board-utils';
import type { BoardState } from './types';

describe('selectForcedMove', () => {
  it('takes an immediate AI win when available', () => {
    const board: BoardState = ['O', 'O', null, 'X', 'X', null, null, null, null];
    const available = CELL_POSITIONS.filter((_, i) => board[i] === null);

    const forced = selectForcedMove(board, available, 'O', 'X');
    expect(forced?.reason).toBe('immediate_win');
    expect(forced?.position.index).toBe(2);
  });

  it('blocks when the human can win next turn', () => {
    const board: BoardState = ['X', 'X', null, 'O', null, null, null, null, null];
    const available = CELL_POSITIONS.filter((_, i) => board[i] === null);

    const forced = selectForcedMove(board, available, 'O', 'X');
    expect(forced?.reason).toBe('critical_block');
    expect(forced?.position.index).toBe(2);
  });

  it('prefers winning over blocking when both exist', () => {
    const board: BoardState = ['O', 'O', null, 'X', 'X', null, null, null, null];
    const available = CELL_POSITIONS.filter((_, i) => board[i] === null);

    const forced = selectForcedMove(board, available, 'O', 'X');
    expect(forced?.reason).toBe('immediate_win');
    expect(forced?.position.index).toBe(2);
  });

  it('blocks instead of taking a non-winning positional move', () => {
    // Human threatens top row (X at 0,1); AI could play center (4) for "development"
    const board: BoardState = ['X', 'X', null, null, null, null, 'O', null, null];
    const available = CELL_POSITIONS.filter((_, i) => board[i] === null);

    const forced = selectForcedMove(board, available, 'O', 'X');
    expect(forced?.reason).toBe('critical_block');
    expect(forced?.position.index).toBe(2);

    const aiWins = findImmediateWinMoves(board, 'O', available);
    expect(aiWins).toHaveLength(0);
  });

  it('returns undefined when no forced win or block exists', () => {
    const board: BoardState = ['X', null, null, null, 'O', null, null, null, null];
    const available = CELL_POSITIONS.filter((_, i) => board[i] === null);

    expect(selectForcedMove(board, available, 'O', 'X')).toBeUndefined();
  });
});
