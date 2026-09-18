import { choice, TypeSafeClient } from '@typesafe-ai/sdk';
import { wouldWinAt } from './board-utils';
import type { BoardState, CellPosition, DecisionDetails, PlayerSymbol } from './types';

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
    return `Immediate WIN completing the ${winningMove.description}`;
  }

  const blockingMove = wouldWinAt(board, cellIndex, humanSymbol);
  if (blockingMove) {
    return `BLOCK preventing opponent from winning on the ${blockingMove.description}`;
  }

  if (cellIndex === 4) return 'Center cell — controls 4 winning lines';
  if ([0, 2, 6, 8].includes(cellIndex)) return 'Corner cell — controls 3 winning lines';
  return 'Edge cell — controls 2 winning lines';
}

function buildPayload(
  availableBoxes: readonly CellPosition[],
  board: BoardState,
  aiSymbol: PlayerSymbol,
  humanSymbol: PlayerSymbol
) {
  const moveCriteria: Record<string, string> = {};
  for (const box of availableBoxes) {
    moveCriteria[`cell_${box.index}`] =
      `Box #${box.index} (${box.algebraic} – ${box.label}): ${describeCandidate(box.index, board, aiSymbol, humanSymbol)}`;
  }

  const state = {
    game: 'Tic-Tac-Toe (3×3 grid)',
    objective: `Pick the optimal move for Player ${aiSymbol}`,
    board_visual: renderAsciiBoard(board),
    active_player: aiSymbol,
    opponent_player: humanSymbol,
    board_state: {
      A1: board[0] ?? 'empty', A2: board[1] ?? 'empty', A3: board[2] ?? 'empty',
      B1: board[3] ?? 'empty', B2: board[4] ?? 'empty', B3: board[5] ?? 'empty',
      C1: board[6] ?? 'empty', C2: board[7] ?? 'empty', C3: board[8] ?? 'empty',
    },
    rules: [
      '3 identical marks in a row/column/diagonal wins.',
      `If a move completes 3-in-a-row for ${aiSymbol}, choose it immediately.`,
      `If ${humanSymbol} has 2 in a line, block that cell.`,
      'Otherwise prefer center (B2) then corners for fork potential.',
    ],
  };

  const questions = {
    next_step: choice(
      `Which cell should Player ${aiSymbol} select as their next move?`,
      moveCriteria
    ),
    strategic_assessment: choice(
      `What is the tactical situation for Player ${aiSymbol}?`,
      {
        immediate_win: `${aiSymbol} has an immediate winning move`,
        critical_block: `${aiSymbol} must block an opponent win threat`,
        positional_advantage: `${aiSymbol} is building board control`,
        neutral_or_contested: 'Balanced — both players contesting lines',
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
