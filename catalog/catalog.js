import { loadCatalog } from './repository.js';
import { categoryHref, productsForCategory, slugFromHash, visibleCategories } from './model.js';
import { productCard } from './components/product-card.js';

const root = document.getElementById('coleccion');
const filters = document.querySelector('[data-catalog-filters]');
const menu = document.querySelector('[data-catalog-menu]');
const disclosure = document.querySelector('.catalog-menu');
const heading = document.getElementById('catalog-category-heading');
const count = document.querySelector('[data-catalog-count]');
const grid = document.querySelector('[data-catalog-grid]');
const empty = document.querySelector('[data-catalog-empty]');
const emptyTitle = document.querySelector('[data-catalog-empty-title]');
const status = document.querySelector('[data-catalog-status]');
const retry = document.querySelector('[data-catalog-retry]');
const announcement = document.querySelector('[data-catalog-announcement]');
let catalog, categories = [], focusHeading = false, request = 0;

function categoryLink(category, location) {
  const link = document.createElement('a');
  link.className = 'catalog-category';
  link.href = categoryHref(category);
  link.textContent = category.name;
  link.dataset.catalogSlug = category.slug;
  link.dataset.catalogLocation = location;
  return link;
}

function render({ navigate = false } = {}) {
  if (!catalog) return;
  const slug = slugFromHash(window.location.hash);
  const category = slug === null ? categories[0] : categories.find((item) => item.slug === slug);
  const products = category ? productsForCategory(catalog, category.id) : [];
  heading.textContent = category?.name || (categories.length ? 'Categoría no encontrada' : 'Catálogo');
  count.textContent = category ? `${products.length} ${products.length === 1 ? 'prenda' : 'prendas'}` : '';
  document.querySelectorAll('[data-catalog-slug]').forEach((link) => {
    if (category?.slug === link.dataset.catalogSlug) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  grid.replaceChildren(...products.map(productCard));
  grid.hidden = products.length === 0;
  empty.hidden = products.length !== 0;
  emptyTitle.textContent = category ? `Todavía no hay prendas en ${category.name}.` : (categories.length ? 'No encontramos esa categoría.' : 'Todavía no hay categorías para mostrar.');
  announcement.textContent = `${heading.textContent}: ${products.length} ${products.length === 1 ? 'prenda' : 'prendas'}.`;
  root.dataset.catalogReady = 'true';
  if (navigate) {
    root.scrollIntoView({ behavior: 'instant', block: 'start' });
    if (focusHeading) heading.focus({ preventScroll: true });
  }
  focusHeading = false;
}

async function refresh() {
  const token = ++request;
  status.hidden = false;
  status.textContent = 'Cargando las prendas…';
  retry.hidden = true;
  try {
    const result = await loadCatalog();
    if (token !== request) return;
    catalog = result;
    categories = visibleCategories(catalog);
    filters.replaceChildren(...categories.map((category) => categoryLink(category, 'catalog')));
    menu.replaceChildren(...categories.map((category) => categoryLink(category, 'menu')));
    status.hidden = true;
    render({ navigate: window.location.hash.startsWith('#coleccion/') });
  } catch (error) {
    if (token !== request) return;
    status.textContent = 'No pudimos cargar las prendas. Volvé a intentar.';
    retry.hidden = false;
    console.error('No se pudo cargar el catálogo.', error);
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-catalog-slug]');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  focusHeading = link.dataset.catalogLocation === 'menu';
  disclosure.open = false;
  if (window.location.hash === link.hash) {
    event.preventDefault();
    render({ navigate: true });
  }
});

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#coleccion' || window.location.hash.startsWith('#coleccion/')) render({ navigate: true });
});
document.addEventListener('pointerdown', (event) => {
  if (disclosure.open && !disclosure.contains(event.target)) disclosure.open = false;
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !disclosure.open) return;
  event.preventDefault();
  event.stopPropagation();
  disclosure.open = false;
  disclosure.querySelector('summary').focus();
}, true);
retry.addEventListener('click', refresh);
refresh();
