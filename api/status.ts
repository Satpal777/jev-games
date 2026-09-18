import { handleStatusRequest } from '../server/api';

export async function GET(): Promise<Response> {
  return handleStatusRequest();
}
