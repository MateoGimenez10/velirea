import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'page.css', 'credits.html', 'favicon.svg', 'share.jpg', 'assets', 'fonts', 'catalog', 'coleccion', 'admin']) {
  await cp(file, 'dist/' + file, { recursive: true, filter: path => !/(?:^|[\\/])(?:data|README\.md)$/.test(path) });
}
