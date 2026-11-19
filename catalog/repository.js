import { normalizeCatalog } from './model.js';

export async function loadCatalog() {
  const response = await fetch('/api/shop/catalog', {cache: 'no-store'});
  if (!response.ok) throw new Error('Catálogo no disponible.');
  return normalizeCatalog(await response.json());
}
