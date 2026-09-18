import { handleAIMoveRequest } from '../server/api';

export async function POST(request: Request): Promise<Response> {
  return handleAIMoveRequest(request);
}
