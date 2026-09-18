import type {
  AIFunction,
  BoardState,
  CellPosition,
  DecisionDetails,
  GameStatus,
  MoveRecord,
  MoveResult,
  PlayerSymbol,
  WinningLine,
} from './types';
import {
  AI_PLAYER,
  CELL_POSITIONS,
  HUMAN_PLAYER,
  TOTAL_CELLS,
  getCellPositionByIndex,
} from './constants';
import { findBoardWinner } from './board-utils';
import { computeAIMoveFromContext, normalizeAIMoveOutput } from './ai';
import { validateAIOutput, validateMove } from './validation';

export class TicTacToeGame {
  private board: (PlayerSymbol | null)[] = Array(TOTAL_CELLS).fill(null);
  private currentTurn: PlayerSymbol = HUMAN_PLAYER;
  private status: GameStatus = 'IDLE';
  private winningLine: WinningLine | null = null;
  private moveHistory: MoveRecord[] = [];
  private lastDecision: DecisionDetails | null = null;
  private scores = {
    humanWins: 0,
    aiWins: 0,
    draws: 0,
  };

  constructor() {
    this.resetRound();
  }

  public getBoard(): BoardState {
    return [...this.board];
  }

  public getCurrentTurn(): PlayerSymbol {
    return this.currentTurn;
  }

  public getStatus(): GameStatus {
    return this.status;
  }

  public getWinningLine(): WinningLine | null {
    return this.winningLine;
  }

  public getMoveHistory(): readonly MoveRecord[] {
    return [...this.moveHistory];
  }

  public getScores() {
    return { ...this.scores };
  }

  public getLastDecision(): DecisionDetails | null {
    return this.lastDecision;
  }

  public getRemainingBoxes(): CellPosition[] {
    return CELL_POSITIONS.filter((cell) => this.board[cell.index] === null);
  }

  public resetRound(): void {
    this.board = Array(TOTAL_CELLS).fill(null);
    this.currentTurn = HUMAN_PLAYER;
    this.status = 'IN_PROGRESS';
    this.winningLine = null;
    this.moveHistory = [];
    this.lastDecision = null;
  }

  public resetAll(): void {
    this.resetRound();
    this.scores = {
      humanWins: 0,
      aiWins: 0,
      draws: 0,
    };
  }

  public makeHumanMove(positionOrIndex: CellPosition | number): MoveResult {
    const targetIndex =
      typeof positionOrIndex === 'number' ? positionOrIndex : positionOrIndex.index;

    const validation = validateMove(
      targetIndex,
      this.board,
      this.currentTurn,
      HUMAN_PLAYER,
      this.status
    );

    if (!validation.valid) {
      return {
        success: false,
        code: validation.code,
        message: validation.message,
      };
    }

    const cellPosition = getCellPositionByIndex(targetIndex);
    if (!cellPosition) {
      return {
        success: false,
        code: 'INDEX_OUT_OF_BOUNDS',
        message: `Cell index ${targetIndex} does not exist.`,
      };
    }

    this.board[targetIndex] = HUMAN_PLAYER;
    return this.finalizeMove(HUMAN_PLAYER, cellPosition);
  }

  public async makeAIMove(customAIFn?: AIFunction): Promise<MoveResult> {
    if (this.status === 'WON' || this.status === 'DRAW') {
      return {
        success: false,
        code: 'GAME_ALREADY_FINISHED',
        message: 'Cannot make AI move: Game is already finished.',
      };
    }

    if (this.currentTurn !== AI_PLAYER) {
      return {
        success: false,
        code: 'NOT_PLAYERS_TURN',
        message: `Cannot execute AI move: It is currently ${this.currentTurn}'s turn.`,
      };
    }

    const availableBoxes = this.getRemainingBoxes();
    if (availableBoxes.length === 0) {
      this.status = 'DRAW';
      return {
        success: false,
        code: 'GAME_ALREADY_FINISHED',
        message: 'No remaining boxes available.',
      };
    }

    const aiContext = {
      availableBoxes,
      board: this.getBoard(),
      aiSymbol: AI_PLAYER,
      humanSymbol: HUMAN_PLAYER,
    };

    let aiOutput: ReturnType<typeof normalizeAIMoveOutput>;
    try {
      const rawOutput = customAIFn
        ? await customAIFn(aiContext)
        : await computeAIMoveFromContext(aiContext);
      aiOutput = normalizeAIMoveOutput(rawOutput);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.status = 'AI_AWAITING_IMPLEMENTATION';
      return {
        success: false,
        code: 'AI_EXECUTION_ERROR',
        message: `AI execution threw an error: ${errorMessage}.`,
        error: err,
      };
    }

    if (aiOutput.decision) {
      this.lastDecision = aiOutput.decision;
    }

    const validation = validateAIOutput(aiOutput.move, availableBoxes, this.board);
    if (!validation.valid) {
      if (validation.code === 'AI_RETURNED_EMPTY') {
        this.status = 'AI_AWAITING_IMPLEMENTATION';
      }
      return {
        success: false,
        code: validation.code,
        message: validation.message,
      };
    }

    const chosenPosition = validation.position;
    this.board[chosenPosition.index] = AI_PLAYER;
    return this.finalizeMove(AI_PLAYER, chosenPosition);
  }

  private finalizeMove(player: PlayerSymbol, position: CellPosition): MoveResult {
    this.recordMove(player, position);

    const winResult = this.checkWinner();
    if (winResult) {
      this.winningLine = winResult;
      this.status = 'WON';
      if (player === HUMAN_PLAYER) {
        this.scores = { ...this.scores, humanWins: this.scores.humanWins + 1 };
      } else {
        this.scores = { ...this.scores, aiWins: this.scores.aiWins + 1 };
      }

      return {
        success: true,
        player,
        position,
        status: this.status,
        winner: player,
        winningLine: this.winningLine,
      };
    }

    if (this.getRemainingBoxes().length === 0) {
      this.status = 'DRAW';
      this.scores = { ...this.scores, draws: this.scores.draws + 1 };
      return {
        success: true,
        player,
        position,
        status: this.status,
        winner: null,
        winningLine: null,
      };
    }

    this.currentTurn = player === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;
    this.status = 'IN_PROGRESS';

    return {
      success: true,
      player,
      position,
      status: this.status,
      winner: null,
      winningLine: null,
    };
  }

  private checkWinner(): WinningLine | null {
    return findBoardWinner(this.board);
  }

  private recordMove(player: PlayerSymbol, position: CellPosition): void {
    const move: MoveRecord = {
      moveNumber: this.moveHistory.length + 1,
      player,
      position,
      timestamp: Date.now(),
    };
    this.moveHistory.push(move);
  }
}
