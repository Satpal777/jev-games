import { serve } from 'bun';
import { handleAIMoveRequest, handleStatusRequest } from './server/api';
import { serveBundle } from './server/bundle';
import { serveStaticFile } from './server/static';

const PORT = Number(process.env.PORT) || 3000;

const server = serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);

    if (pathname === '/api/status' && req.method === 'GET') {
      return handleStatusRequest();
    }

    if (pathname === '/api/ai-move' && req.method === 'POST') {
      return handleAIMoveRequest(req);
    }

    if (pathname === '/bundle.js') {
      return serveBundle();
    }

    const staticResponse = await serveStaticFile(pathname);
    if (staticResponse) {
      return staticResponse;
    }

    return new Response('404 Not Found', { status: 404 });
  },
});

console.log(`Tic-Tac-Toe running on http://localhost:${server.port}`);
