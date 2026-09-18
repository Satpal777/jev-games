import type {
  BoardState,
  CellPosition,
  GameStatus,
  PlayerSymbol,
  ValidationResult,
} from './types';
import { getCellPositionByIndex } from './constants';

export function validateMove(
  index: number,
  board: BoardState,
  currentTurn: PlayerSymbol,
  attemptingPlayer: PlayerSymbol,
  status: GameStatus
): ValidationResult {
  if (status === 'WON' || status === 'DRAW') {
    return {
      valid: false,
      code: 'GAME_ALREADY_FINISHED',
      message: 'Cannot make a move: the game has already concluded.',
    };
  }

  if (attemptingPlayer !== currentTurn) {
    return {
      valid: false,
      code: 'NOT_PLAYERS_TURN',
      message: `It is currently player ${currentTurn}'s turn, not ${attemptingPlayer}'s.`,
    };
  }

  const cellPos = getCellPositionByIndex(index);
  if (!cellPos) {
    return {
      valid: false,
      code: 'INDEX_OUT_OF_BOUNDS',
      message: `Invalid cell index ${index}. Must be an integer between 0 and 8.`,
    };
  }

  // Prevent overriding occupied cells
  const existingValue = board[index];
  if (existingValue !== null && existingValue !== undefined) {
    return {
      valid: false,
      code: 'CELL_ALREADY_OCCUPIED',
      message: `Override forbidden: Box #${index} (${cellPos.label}) is already occupied by '${existingValue}'.`,
      details: {
        index,
        position: cellPos,
        occupiedBy: existingValue,
      },
    };
  }

  return { valid: true };
}

export function validateAIOutput(
  output: CellPosition | number | null | undefined,
  availableBoxes: readonly CellPosition[],
  board: BoardState
): { valid: true; position: CellPosition } | { valid: false; code: 'AI_RETURNED_EMPTY' | 'AI_RETURNED_INVALID_CELL' | 'CELL_ALREADY_OCCUPIED'; message: string } {
  if (output === null || output === undefined) {
    return {
      valid: false,
      code: 'AI_RETURNED_EMPTY',
      message: 'AI decision function returned empty (null/undefined). Awaiting custom AI implementation in src/ai.ts.',
    };
  }

  let targetIndex: number;
  if (typeof output === 'number') {
    targetIndex = output;
  } else if (typeof output === 'object' && typeof output.index === 'number') {
    targetIndex = output.index;
  } else {
    return {
      valid: false,
      code: 'AI_RETURNED_INVALID_CELL',
      message: `AI returned an unrecognized output format: ${String(output)}.`,
    };
  }

  const cellPos = getCellPositionByIndex(targetIndex);
  if (!cellPos) {
    return {
      valid: false,
      code: 'AI_RETURNED_INVALID_CELL',
      message: `AI returned out-of-bounds index: ${targetIndex}. Must be 0 to 8.`,
    };
  }

  const occupiedBy = board[targetIndex];
  if (occupiedBy !== null && occupiedBy !== undefined) {
    return {
      valid: false,
      code: 'CELL_ALREADY_OCCUPIED',
      message: `AI attempted to override already occupied box #${targetIndex} (${cellPos.label}, held by '${occupiedBy}').`,
    };
  }

  const isAvailable = availableBoxes.some((b) => b.index === targetIndex);
  if (!isAvailable) {
    return {
      valid: false,
      code: 'AI_RETURNED_INVALID_CELL',
      message: `AI picked box #${targetIndex} which is not in the remaining available boxes list.`,
    };
  }

  return { valid: true, position: cellPos };
}
