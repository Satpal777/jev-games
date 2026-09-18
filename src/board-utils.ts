import { WINNING_PATTERNS, type WinningPattern } from './constants';
import type { BoardState, PlayerSymbol, WinningLine } from './types';

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
