import { describe, expect, it } from 'bun:test';
import { TicTacToeGame } from './game';
import type { AIMoveContext, AIFunction } from './types';

describe('TicTacToeGame', () => {
  it('blocks overriding an occupied cell', async () => {
    const game = new TicTacToeGame();
    game.makeHumanMove(0);
    await game.makeAIMove(async () => 1);

    const result = game.makeHumanMove(0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('CELL_ALREADY_OCCUPIED');
    }
  });

  it('enforces turn order for human moves', () => {
    const game = new TicTacToeGame();
    game.makeHumanMove(0);

    const result = game.makeHumanMove(1);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('NOT_PLAYERS_TURN');
    }
  });

  it('handles an empty AI response without crashing', async () => {
    const game = new TicTacToeGame();
    game.makeHumanMove(0);

    const emptyAI: AIFunction = async () => undefined;
    const result = await game.makeAIMove(emptyAI);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('AI_RETURNED_EMPTY');
    }
    expect(game.getStatus()).toBe('AI_AWAITING_IMPLEMENTATION');
  });

  it('catches AI execution errors safely', async () => {
    const game = new TicTacToeGame();
    game.makeHumanMove(0);

    const throwingAI: AIFunction = async () => {
      throw new Error('boom');
    };
    const result = await game.makeAIMove(throwingAI);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('AI_EXECUTION_ERROR');
    }
  });

  it('stores AI decision details on the game instance', async () => {
    const game = new TicTacToeGame();
    game.makeHumanMove(0);

    const decisionAI: AIFunction = async (context: AIMoveContext) => ({
      move: context.availableBoxes[0],
      decision: {
        chosenIndex: context.availableBoxes[0]!.index,
        chosenPosition: context.availableBoxes[0]!,
        confidence: 0.9,
        probabilities: { [context.availableBoxes[0]!.algebraic]: 0.9 },
        assessment: 'positional_advantage',
        model: 'test-model',
      },
    });

    const result = await game.makeAIMove(decisionAI);
    expect(result.success).toBe(true);
    expect(game.getLastDecision()?.model).toBe('test-model');
  });
});
