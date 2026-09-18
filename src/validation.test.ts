import { describe, expect, it } from 'bun:test';
import { CELL_POSITIONS } from './constants';
import { validateAIOutput, validateMove } from './validation';
import type { BoardState } from './types';

const emptyBoard: BoardState = Array(9).fill(null);

describe('validateMove', () => {
  it('rejects occupied cells with CELL_ALREADY_OCCUPIED', () => {
    const board: BoardState = [...emptyBoard];
    board[0] = 'X';

    const result = validateMove(0, board, 'X', 'X', 'IN_PROGRESS');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('CELL_ALREADY_OCCUPIED');
    }
  });

  it('rejects moves when it is not the player turn', () => {
    const result = validateMove(0, emptyBoard, 'O', 'X', 'IN_PROGRESS');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('NOT_PLAYERS_TURN');
    }
  });

  it('rejects moves after the game has finished', () => {
    const result = validateMove(1, emptyBoard, 'X', 'X', 'WON');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('GAME_ALREADY_FINISHED');
    }
  });
});

describe('validateAIOutput', () => {
  it('accepts a numeric index for an available cell', () => {
    const result = validateAIOutput(4, CELL_POSITIONS, emptyBoard);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.position.index).toBe(4);
    }
  });

  it('returns AI_RETURNED_EMPTY for nullish output', () => {
    const result = validateAIOutput(undefined, CELL_POSITIONS, emptyBoard);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('AI_RETURNED_EMPTY');
    }
  });
});
