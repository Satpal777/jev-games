import { describe, expect, it, mock, afterEach } from 'bun:test';
import { CELL_POSITIONS } from './constants';
import {
  computeAIMove,
  fallbackRandomAIMove,
  fallbackRandomAIMoveFromContext,
  normalizeAIMoveOutput,
} from './ai';
import type { BoardState } from './types';

const emptyBoard: BoardState = Array(9).fill(null);

describe('computeAIMove', () => {
  afterEach(() => {
    mock.restore();
  });

  it('returns undefined for an empty available list', async () => {
    const board: BoardState = Array(9).fill('X');
    const chosen = await computeAIMove([], board, 'O', 'X');
    expect(chosen).toBeUndefined();
  });

  it('returns undefined when the server responds with an error', async () => {
    globalThis.fetch = mock(async () => new Response('fail', { status: 500 })) as typeof fetch;

    const chosen = await computeAIMove(CELL_POSITIONS, emptyBoard, 'O', 'X');
    expect(chosen).toBeUndefined();
  });

  it('returns undefined when the server responds without a decision', async () => {
    globalThis.fetch = mock(
      async () => Response.json({ success: false, message: 'No key' })
    ) as typeof fetch;

    const chosen = await computeAIMove(CELL_POSITIONS, emptyBoard, 'O', 'X');
    expect(chosen).toBeUndefined();
  });
});

describe('normalizeAIMoveOutput', () => {
  it('unwraps AIMoveResponse objects', () => {
    const position = CELL_POSITIONS[4]!;
    const normalized = normalizeAIMoveOutput({
      move: position,
      decision: {
        chosenIndex: 4,
        chosenPosition: position,
        confidence: 1,
        probabilities: { B2: 1 },
        assessment: 'immediate_win',
        model: 'jev-latest',
      },
    });

    expect(normalized.move).toEqual(position);
    expect(normalized.decision?.model).toBe('jev-latest');
  });
});

describe('fallbackRandomAIMove', () => {
  it('picks a valid box from the list', () => {
    const available = [CELL_POSITIONS[0]!, CELL_POSITIONS[4]!];
    const chosen = fallbackRandomAIMove(available);
    expect(chosen).toBeDefined();
    expect(available.includes(chosen!)).toBe(true);
  });

  it('returns undefined for an empty list', () => {
    expect(fallbackRandomAIMove([])).toBeUndefined();
  });

  it('works through the AIMoveContext adapter', () => {
    const available = [CELL_POSITIONS[2]!];
    const chosen = fallbackRandomAIMoveFromContext({
      availableBoxes: available,
      board: emptyBoard,
      aiSymbol: 'O',
      humanSymbol: 'X',
    });
    expect(chosen?.index).toBe(2);
  });
});
