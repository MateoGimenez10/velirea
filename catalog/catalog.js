import { loadCatalog } from './repository.js';
import { categoryHref, productsForCategory, visibleCategories } from './model.js';
import { productCard } from './components/product-card.js';

const allName = 'Todas las colecciones';
const editorial = new Map([
  ['pantalones', '/assets/img/catalog/pantalon-beige.jpg'],
  ['remeras', '/assets/img/catalog/remera-blanca.jpg'],
  ['shorts', '/assets/img/catalog/short-denim.jpg'],
  ['blusas', '/assets/img/catalog/blusa-blanca.jpg']
]);
const tiles = document.querySelector('[data-catalog-tiles]');
const status = document.querySelector('[data-catalog-status]');
const retry = document.querySelector('[data-catalog-retry]');
const disclosure = document.querySelector('.catalog-menu');

function linkTo(category) {
  const link = document.createElement('a');
  link.href = categoryHref(category);
  link.textContent = category?.name ?? allName;
  return link;
}
function categoryTile(category, products) {
  const link = linkTo(category);
  link.className = 'collection-tile';
  const label = document.createElement('span');
  label.className = 'tile-label';
  label.textContent = link.textContent;
  const arrow = document.createElement('span');
  arrow.className = 'tile-arrow';
  arrow.setAttribute('aria-hidden','true');
  arrow.textContent = '↗';
  const frame = document.createElement('span');
  frame.className = 'tile-frame';
  frame.setAttribute('aria-hidden','true');
  const monogram = document.createElement('span');
  monogram.className = 'tile-letter';
  monogram.textContent = category?.name.trim().charAt(0).toLocaleUpperCase('es') || 'V';
  frame.append(monogram);
  const src = category
    ? products[0]?.images[0]?.src ?? editorial.get(category.slug)
    : '/assets/img/editorial-small.jpg';
  if (src) {
    const img = new Image();
    img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('error', () => img.remove(), {once:true});
    img.src = src;
    frame.append(img);
  }
  label.append(arrow);
  link.replaceChildren(frame,label);
  return link;
}
function showDirectory(categories, byCategory, products) {
  const entries = [null, ...categories];
  tiles.replaceChildren(...entries.map(c => categoryTile(c, c ? byCategory.get(c.id) : products)));
  document.querySelector('[data-catalog-menu]').replaceChildren(...entries.map(c => {
    const link = linkTo(c);
    link.className = 'catalog-category';
    return link;
  }));
}
function showCategory(categories, byCategory, allProducts) {
  const slug = new URLSearchParams(location.search).get('categoria');
  const selected = categories.find(category => category.slug === slug);
  const title = slug === null ? allName : selected?.name ?? 'Categoría no encontrada';
  const products = slug === null ? allProducts : byCategory.get(selected?.id) ?? [];
  document.title = title + ' · VELIREA';
  document.querySelector('[data-heading]').textContent = title;
  document.querySelector('[data-count]').textContent = products.length ? products.length + (products.length === 1 ? ' prenda' : ' prendas') : '';
  document.querySelector('[data-products]').replaceChildren(...products.map(productCard));
  document.querySelector('[data-empty]').hidden = !!products.length;
  document.querySelector('[data-back]').hidden = !products.length;
  document.querySelector('[data-empty-message]').textContent = slug !== null && !selected ? 'Esta categoría ya no está disponible.' : 'Todavía no hay prendas en esta colección.';
  const select = document.querySelector('[data-category-switch]');
  select.replaceChildren(...[null,...categories].map(c => new Option(c?.name ?? allName, categoryHref(c))));
  select.value = selected || slug === null ? categoryHref(selected) : '';
  select.parentElement.hidden = false;
  select.onchange = () => location.assign(select.value);
  document.querySelector('.collection-detail').classList.add('is-ready');
}
let request = 0;
async function refresh() {
  const current = ++request;
  retry.hidden = true;
  status.hidden = false;
  status.textContent = tiles ? 'Cargando categorías…' : 'Cargando prendas…';
  try {
    const catalog = await loadCatalog();
    if (current !== request) return;
    const categories = visibleCategories(catalog);
    const byCategory = new Map(categories.map(c => [c.id,productsForCategory(catalog,c.id)]));
    const products = [...byCategory.values()].flat();
    if (tiles) showDirectory(categories,byCategory,products);
    else showCategory(categories,byCategory,products);
    status.hidden = true;
  } catch {
    if (current !== request) return;
    status.textContent = 'No pudimos cargar la colección.';
    retry.hidden = false;
  }
}
if (disclosure) {
  document.addEventListener('pointerdown', event => {
    if (!disclosure.contains(event.target)) disclosure.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && disclosure.open) {
      event.preventDefault();
      event.stopPropagation();
      disclosure.open = false;
      disclosure.querySelector('summary').focus();
    }
  },true);
  disclosure.addEventListener('click', event => { if (event.target.closest('a')) disclosure.open = false; });
}
retry.addEventListener('click',refresh);
window.addEventListener('pageshow', e => { if (e.persisted) refresh(); });
refresh();
