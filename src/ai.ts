import type {
  AIMoveContext,
  AIMoveResponse,
  BoardState,
  CellPosition,
  PlayerSymbol,
} from './types';

function isAIMoveResponse(
  value: CellPosition | number | null | undefined | AIMoveResponse
): value is AIMoveResponse {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'move' in value
  );
}

export function normalizeAIMoveOutput(
  output: CellPosition | number | null | undefined | AIMoveResponse
): { move: CellPosition | number | null | undefined; decision?: import('./types').DecisionDetails } {
  if (isAIMoveResponse(output)) {
    return { move: output.move, decision: output.decision };
  }
  return { move: output };
}

/**
 * Calls the Bun server's /api/ai-move endpoint, which runs TypeSafe AI (Jev).
 * Returns undefined on empty input, network failure, or missing API key — never throws.
 */
export async function computeAIMove(
  availableBoxes: readonly CellPosition[],
  board: BoardState,
  aiSymbol: PlayerSymbol = 'O',
  humanSymbol: PlayerSymbol = 'X'
): Promise<CellPosition | number | null | undefined | AIMoveResponse> {
  if (availableBoxes.length === 0) return undefined;

  try {
    const userApiKey = localStorage.getItem('typesafe_api_key')?.trim() || undefined;

    const response = await fetch('/api/ai-move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        availableBoxes,
        board,
        aiSymbol,
        humanSymbol,
        apiKey: userApiKey,
      }),
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as {
      success: boolean;
      decision?: import('./types').DecisionDetails;
      message?: string;
    };

    if (!data.success || !data.decision) {
      return undefined;
    }

    return {
      move: data.decision.chosenPosition,
      decision: data.decision,
    };
  } catch {
    return undefined;
  }
}

export function computeAIMoveFromContext(
  context: AIMoveContext
): Promise<CellPosition | number | null | undefined | AIMoveResponse> {
  return computeAIMove(
    context.availableBoxes,
    context.board,
    context.aiSymbol,
    context.humanSymbol
  );
}

export function fallbackRandomAIMove(
  availableBoxes: readonly CellPosition[]
): CellPosition | undefined {
  if (availableBoxes.length === 0) return undefined;
  return availableBoxes[Math.floor(Math.random() * availableBoxes.length)];
}

export function fallbackRandomAIMoveFromContext(
  context: AIMoveContext
): CellPosition | undefined {
  return fallbackRandomAIMove(context.availableBoxes);
}
