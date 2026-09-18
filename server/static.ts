import { join } from 'path';

const ROOT_DIR = join(import.meta.dir, '..');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
};

export async function serveStaticFile(pathname: string): Promise<Response | null> {
  if (pathname === '/' || pathname === '/index.html') {
    return new Response(Bun.file(join(ROOT_DIR, 'index.html')), {
      headers: { 'Content-Type': MIME_TYPES['.html'] },
    });
  }

  if (pathname === '/public/styles.css' || pathname === '/styles.css') {
    return new Response(Bun.file(join(ROOT_DIR, 'public', 'styles.css')), {
      headers: { 'Content-Type': MIME_TYPES['.css'] },
    });
  }

  const localPath = join(ROOT_DIR, pathname);
  const file = Bun.file(localPath);
  if (await file.exists()) {
    const extension = pathname.slice(pathname.lastIndexOf('.'));
    const contentType = MIME_TYPES[extension];
    return new Response(file, contentType ? { headers: { 'Content-Type': contentType } } : undefined);
  }

  return null;
}
