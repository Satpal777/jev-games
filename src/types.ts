export type PlayerSymbol = 'X' | 'O';

export type CellValue = PlayerSymbol | null;

export interface CellPosition {
  readonly index: number;
  readonly row: number;
  readonly col: number;
  readonly algebraic: string;
  readonly label: string;
}

export type BoardState = ReadonlyArray<CellValue>;

export type GameStatus =
  | 'IDLE'
  | 'IN_PROGRESS'
  | 'WON'
  | 'DRAW'
  | 'AI_AWAITING_IMPLEMENTATION';

export interface WinningLine {
  readonly player: PlayerSymbol;
  readonly indices: readonly [number, number, number];
  readonly description: string;
}

export interface MoveRecord {
  readonly moveNumber: number;
  readonly player: PlayerSymbol;
  readonly position: CellPosition;
  readonly timestamp: number;
}

export interface ScoreState {
  readonly humanWins: number;
  readonly aiWins: number;
  readonly draws: number;
}

export type ValidationErrorCode =
  | 'CELL_ALREADY_OCCUPIED'
  | 'INDEX_OUT_OF_BOUNDS'
  | 'GAME_ALREADY_FINISHED'
  | 'NOT_PLAYERS_TURN'
  | 'AI_RETURNED_EMPTY'
  | 'AI_RETURNED_INVALID_CELL'
  | 'AI_EXECUTION_ERROR';

export type ValidationResult =
  | { readonly valid: true }
  | {
      readonly valid: false;
      readonly code: ValidationErrorCode;
      readonly message: string;
      readonly details?: unknown;
    };

export type MoveResult =
  | {
      readonly success: true;
      readonly player: PlayerSymbol;
      readonly position: CellPosition;
      readonly status: GameStatus;
      readonly winner: PlayerSymbol | null;
      readonly winningLine: WinningLine | null;
    }
  | {
      readonly success: false;
      readonly code: ValidationErrorCode;
      readonly message: string;
      readonly error?: unknown;
    };

export interface AIMoveContext {
  readonly availableBoxes: readonly CellPosition[];
  readonly board: BoardState;
  readonly aiSymbol: PlayerSymbol;
  readonly humanSymbol: PlayerSymbol;
}

export interface DecisionDetails {
  readonly chosenIndex: number;
  readonly chosenPosition: CellPosition;
  readonly confidence: number;
  readonly probabilities: Record<string, number>;
  readonly assessment: string;
  readonly model: string;
}

export interface AIMoveResponse {
  readonly move: CellPosition | number | null | undefined;
  readonly decision?: DecisionDetails;
}

export type AIFunction = (
  context: AIMoveContext
) =>
  | CellPosition
  | number
  | null
  | undefined
  | AIMoveResponse
  | Promise<CellPosition | number | null | undefined | AIMoveResponse>;
