import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { shopWhatsApp } from '../catalog/shop-contact.js';
await mkdir('dist', { recursive: true });
for (const file of ['page.css', 'credits.html', 'favicon.svg', 'share.jpg', 'assets', 'fonts', 'catalog', 'coleccion', 'prenda', 'admin']) {
  await cp(file, 'dist/' + file, { recursive: true, filter: path => !/(?:^|[\\/])(?:data|README\.md)$/.test(path) });
}
const home = await readFile('index.html', 'utf8');
await writeFile('dist/index.html', home.replace(/data-shop-whatsapp href="[^"]*"/, 'data-shop-whatsapp href="' + shopWhatsApp + '"'));
