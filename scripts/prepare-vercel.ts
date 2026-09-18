import { join } from 'path';

const rootDir = join(import.meta.dir, '..');
const publicDir = join(rootDir, 'public');

const html = await Bun.file(join(rootDir, 'index.html')).text();
const vercelHtml = html.replace('/public/styles.css', '/styles.css');

await Bun.write(join(publicDir, 'index.html'), vercelHtml);

const buildResult = await Bun.build({
  entrypoints: [join(rootDir, 'src', 'main.ts')],
  target: 'browser',
  outdir: publicDir,
  naming: 'bundle.js',
  minify: true,
});

if (!buildResult.success) {
  console.error(buildResult.logs);
  process.exit(1);
}

console.log('Vercel static assets prepared in public/');
