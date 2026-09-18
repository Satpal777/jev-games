import { WINNING_PATTERNS, type WinningPattern } from './constants';
import type { BoardState, CellPosition, PlayerSymbol, WinningLine } from './types';

export function findWinningLine(
  board: BoardState,
  symbol: PlayerSymbol
): WinningLine | null {
  for (const pattern of WINNING_PATTERNS) {
    const [a, b, c] = pattern.indices;
    if (board[a] === symbol && board[b] === symbol && board[c] === symbol) {
      return {
        player: symbol,
        indices: pattern.indices,
        description: pattern.description,
      };
    }
  }
  return null;
}

export function findBoardWinner(board: BoardState): WinningLine | null {
  return findWinningLine(board, 'X') ?? findWinningLine(board, 'O');
}

export function wouldWinAt(
  board: BoardState,
  cellIndex: number,
  symbol: PlayerSymbol
): WinningPattern | undefined {
  const simulated = [...board];
  simulated[cellIndex] = symbol;

  for (const pattern of WINNING_PATTERNS) {
    const [a, b, c] = pattern.indices;
    if (
      simulated[a] === symbol &&
      simulated[b] === symbol &&
      simulated[c] === symbol
    ) {
      return pattern;
    }
  }

  return undefined;
}

/** Cells where placing `symbol` completes three in a row. */
export function findImmediateWinMoves(
  board: BoardState,
  symbol: PlayerSymbol,
  availableBoxes: readonly CellPosition[]
): CellPosition[] {
  return availableBoxes.filter((box) => wouldWinAt(board, box.index, symbol) !== undefined);
}

/**
 * Tic-tac-toe priority: win now, else block opponent's immediate win, else use AI.
 * Returns undefined when no forced tactical move exists.
 */
export function selectForcedMove(
  board: BoardState,
  availableBoxes: readonly CellPosition[],
  aiSymbol: PlayerSymbol,
  humanSymbol: PlayerSymbol
): { position: CellPosition; reason: 'immediate_win' | 'critical_block' } | undefined {
  const aiWins = findImmediateWinMoves(board, aiSymbol, availableBoxes);
  if (aiWins.length > 0) {
    return { position: aiWins[0]!, reason: 'immediate_win' };
  }

  const blocks = findImmediateWinMoves(board, humanSymbol, availableBoxes);
  if (blocks.length > 0) {
    return { position: blocks[0]!, reason: 'critical_block' };
  }

  return undefined;
}
