import { join } from 'path';

const ROOT_DIR = join(import.meta.dir, '..');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
};

async function serveFileIfExists(
  filePath: string,
  contentType: string,
  cacheControl?: string
): Promise<Response | null> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) return null;

  const headers: Record<string, string> = { 'Content-Type': contentType };
  if (cacheControl) headers['Cache-Control'] = cacheControl;

  return new Response(file, { headers });
}

export async function serveStaticFile(pathname: string): Promise<Response | null> {
  if (pathname === '/' || pathname === '/index.html') {
    const built = await serveFileIfExists(
      join(ROOT_DIR, 'public', 'index.html'),
      MIME_TYPES['.html']
    );
    if (built) return built;

    return serveFileIfExists(join(ROOT_DIR, 'index.html'), MIME_TYPES['.html']);
  }

  if (pathname === '/styles.css' || pathname === '/public/styles.css') {
    return serveFileIfExists(join(ROOT_DIR, 'public', 'styles.css'), MIME_TYPES['.css']);
  }

  if (pathname === '/bundle.js') {
    const built = await serveFileIfExists(
      join(ROOT_DIR, 'public', 'bundle.js'),
      MIME_TYPES['.js'],
      'public, max-age=31536000, immutable'
    );
    if (built) return built;

    return serveFileIfExists(
      join(ROOT_DIR, 'dist', 'bundle.js'),
      MIME_TYPES['.js'],
      'public, max-age=31536000, immutable'
    );
  }

  if (pathname.startsWith('/public/')) {
    return serveFileIfExists(join(ROOT_DIR, pathname), MIME_TYPES['.css'] ?? 'application/octet-stream');
  }

  return null;
}
