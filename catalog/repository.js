import { demoCatalog } from './data/demo.js';
import { normalizeCatalog } from './model.js';

// This is the only data-source boundary. A future API can return the same
// contract here; neither the renderer nor the navigation needs to change.
export async function loadCatalog() {
  return normalizeCatalog(demoCatalog);
}
