import { evaluateWithTypeSafeAI } from '../lib/typesafe-decision';
import type { BoardState, CellPosition, PlayerSymbol } from '../src/types';

export function handleStatusRequest(): Response {
  const hasEnvKey = Boolean(process.env.TYPESAFE_API_KEY?.trim());
  return Response.json({ hasEnvKey, model: 'jev-latest' });
}

export async function handleAIMoveRequest(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      availableBoxes: CellPosition[];
      board: BoardState;
      aiSymbol: PlayerSymbol;
      humanSymbol: PlayerSymbol;
      apiKey?: string;
    };

    const availableBoxes = body.availableBoxes ?? [];
    const board = body.board ?? [];
    const aiSymbol = body.aiSymbol ?? 'O';
    const humanSymbol = body.humanSymbol ?? 'X';

    if (availableBoxes.length === 0) {
      return Response.json(
        { success: false, message: 'No available boxes left.' },
        { status: 400 }
      );
    }

    const apiKey = body.apiKey?.trim() || process.env.TYPESAFE_API_KEY?.trim() || '';
    if (!apiKey) {
      return Response.json(
        {
          success: false,
          message:
            'No TYPESAFE_API_KEY configured. Set it in the environment or paste it in the UI.',
        },
        { status: 401 }
      );
    }

    const decision = await evaluateWithTypeSafeAI(
      apiKey,
      availableBoxes,
      board,
      aiSymbol,
      humanSymbol
    );

    return Response.json({ success: true, decision });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
