import { handleAIMoveRequest } from '../server/handlers/ai-move';

export async function POST(request: Request): Promise<Response> {
  return handleAIMoveRequest(request);
}
