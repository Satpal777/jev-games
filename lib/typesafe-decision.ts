import { choice, TypeSafeClient } from '@typesafe-ai/sdk';
import {
  findImmediateWinMoves,
  selectForcedMove,
  wouldWinAt,
} from '../src/board-utils';
import type { BoardState, CellPosition, DecisionDetails, PlayerSymbol } from '../src/types';

function renderAsciiBoard(board: BoardState): string {
  const symbol = (value: PlayerSymbol | null | undefined): string => value ?? '.';
  return [
    ` A1: ${symbol(board[0])} | A2: ${symbol(board[1])} | A3: ${symbol(board[2])}`,
    `---------------------`,
    ` B1: ${symbol(board[3])} | B2: ${symbol(board[4])} | B3: ${symbol(board[5])}`,
    `---------------------`,
    ` C1: ${symbol(board[6])} | C2: ${symbol(board[7])} | C3: ${symbol(board[8])}`,
  ].join('\n');
}

function describeCandidate(
  cellIndex: number,
  board: BoardState,
  aiSymbol: PlayerSymbol,
  humanSymbol: PlayerSymbol
): string {
  const winningMove = wouldWinAt(board, cellIndex, aiSymbol);
  if (winningMove) {
    return `MANDATORY WIN — completes 3-in-a-row on the ${winningMove.description}`;
  }

  const blockingMove = wouldWinAt(board, cellIndex, humanSymbol);
  if (blockingMove) {
    return `MANDATORY BLOCK — ${humanSymbol} wins next turn on the ${blockingMove.description} if this cell stays empty`;
  }

  if (cellIndex === 4) return 'Positional — center cell controls 4 winning lines';
  if ([0, 2, 6, 8].includes(cellIndex)) return 'Positional — corner cell controls 3 winning lines';
  return 'Positional — edge cell controls 2 winning lines';
}

function buildForcedDecision(
  position: CellPosition,
  availableBoxes: readonly CellPosition[],
  assessment: 'immediate_win' | 'critical_block'
): DecisionDetails {
  const probabilities: Record<string, number> = {};
  for (const box of availableBoxes) {
    probabilities[box.algebraic] = box.index === position.index ? 1 : 0;
  }

  return {
    chosenIndex: position.index,
    chosenPosition: position,
    confidence: 1,
    probabilities,
    assessment,
    model: 'rules-engine',
  };
}

function buildPayload(
  availableBoxes: readonly CellPosition[],
  board: BoardState,
  aiSymbol: PlayerSymbol,
  humanSymbol: PlayerSymbol
) {
  const humanThreats = findImmediateWinMoves(board, humanSymbol, availableBoxes);
  const aiWins = findImmediateWinMoves(board, aiSymbol, availableBoxes);

  const moveCriteria: Record<string, string> = {};
  for (const box of availableBoxes) {
    moveCriteria[`cell_${box.index}`] =
      `Box #${box.index} (${box.algebraic} – ${box.label}): ${describeCandidate(box.index, board, aiSymbol, humanSymbol)}`;
  }

  const state = {
    game: 'Tic-Tac-Toe (3×3 grid)',
    objective: `Pick the best move for Player ${aiSymbol}`,
    board_visual: renderAsciiBoard(board),
    active_player: aiSymbol,
    opponent_player: humanSymbol,
    tactical_summary: {
      ai_immediate_win_cells: aiWins.map((c) => c.algebraic),
      opponent_immediate_win_cells: humanThreats.map((c) => c.algebraic),
      priority_order: [
        `1. If ai_immediate_win_cells is non-empty, pick one of those cells.`,
        `2. Else if opponent_immediate_win_cells is non-empty, pick one of those cells to block.`,
        `3. Else pick the strongest positional cell (center, then corners, then edges).`,
      ],
    },
    board_state: {
      A1: board[0] ?? 'empty', A2: board[1] ?? 'empty', A3: board[2] ?? 'empty',
      B1: board[3] ?? 'empty', B2: board[4] ?? 'empty', B3: board[5] ?? 'empty',
      C1: board[6] ?? 'empty', C2: board[7] ?? 'empty', C3: board[8] ?? 'empty',
    },
    rules: [
      'Three identical marks in a row, column, or diagonal wins.',
      'Never allow the opponent to complete three in a row on their next turn when you can block.',
      'Take your own winning move when available.',
    ],
  };

  const questions = {
    next_step: choice(
      `Which cell must Player ${aiSymbol} play? Follow tactical_summary.priority_order strictly. ` +
        `If any candidate is labeled MANDATORY BLOCK, prefer it over positional moves.`,
      moveCriteria
    ),
    strategic_assessment: choice(
      `What is the tactical situation for Player ${aiSymbol}?`,
      {
        immediate_win: `${aiSymbol} can win on this turn`,
        critical_block: `${humanSymbol} can win next turn unless ${aiSymbol} blocks`,
        positional_advantage: `${aiSymbol} is improving position with no immediate win or block`,
        neutral_or_contested: 'Balanced — no immediate win or block for either player',
      }
    ),
  };

  return { state, questions };
}

export async function evaluateWithTypeSafeAI(
  apiKey: string,
  availableBoxes: readonly CellPosition[],
  board: BoardState,
  aiSymbol: PlayerSymbol,
  humanSymbol: PlayerSymbol
): Promise<DecisionDetails> {
  const forced = selectForcedMove(board, availableBoxes, aiSymbol, humanSymbol);
  if (forced) {
    return buildForcedDecision(forced.position, availableBoxes, forced.reason);
  }

  const { state, questions } = buildPayload(availableBoxes, board, aiSymbol, humanSymbol);

  const client = new TypeSafeClient({ apiKey, defaultModel: 'jev-latest' });
  const response = await client.systemOne({ state, questions });

  const nextStep = response.answers.next_step;
  const assessment = response.answers.strategic_assessment;

  const chosenKey = nextStep.choice;
  const parsedIndex = parseInt(chosenKey.replace('cell_', ''), 10);
  const chosenPosition = availableBoxes.find((box) => box.index === parsedIndex) ?? availableBoxes[0]!;

  const probabilities: Record<string, number> = {};
  for (const box of availableBoxes) {
    probabilities[box.algebraic] = Number((nextStep.probabilities[`cell_${box.index}`] ?? 0).toFixed(4));
  }

  return {
    chosenIndex: chosenPosition.index,
    chosenPosition,
    confidence: Number((nextStep.confidence ?? 0).toFixed(4)),
    probabilities,
    assessment: assessment.choice,
    model: response.model ?? 'jev-latest',
  };
}
