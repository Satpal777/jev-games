import { join } from 'path';

const ROOT_DIR = join(import.meta.dir, '..');

let cachedBundle: Response | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL_MS = 5_000;

export async function serveBundle(): Promise<Response> {
  const now = Date.now();
  if (cachedBundle && now - cacheBuiltAt < CACHE_TTL_MS) {
    return cachedBundle.clone();
  }

  try {
    const buildResult = await Bun.build({
      entrypoints: [join(ROOT_DIR, 'src', 'main.ts')],
      target: 'browser',
      sourcemap: 'inline',
      minify: false,
    });

    if (!buildResult.success) {
      const errors = buildResult.logs.map((log) => log.message).join('\n');
      return new Response(`console.error(${JSON.stringify(errors)});`, {
        status: 500,
        headers: { 'Content-Type': 'application/javascript' },
      });
    }

    const artifact = buildResult.outputs[0];
    if (!artifact) {
      return new Response('No bundle output', { status: 500 });
    }

    const body = await artifact.text();
    cachedBundle = new Response(body, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
    cacheBuiltAt = now;
    return cachedBundle.clone();
  } catch (err) {
    return new Response(`console.error("Build failed: ${String(err)}");`, {
      status: 500,
      headers: { 'Content-Type': 'application/javascript' },
    });
  }
}
