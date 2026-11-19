// Data contract shared by any future source: a file today, an API later.
export const CATALOG_SCHEMA_VERSION = 1;
export const PRODUCT_STATUS = Object.freeze({ AVAILABLE: 'available', SOLD_OUT: 'sold_out' });

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const order = (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id);
const required = (condition, message) => { if (!condition) throw new TypeError(message); };
const identifier = (value) => text(value) && /^[a-zA-Z0-9_-]+$/.test(value);

export function normalizeCatalog(input) {
  required(input?.schemaVersion === CATALOG_SCHEMA_VERSION, 'Versión de catálogo incompatible.');
  required(Array.isArray(input.categories) && Array.isArray(input.products), 'El catálogo necesita categorías y prendas.');
  const categoryIds = new Set(), slugs = new Set(), productIds = new Set();
  const categories = input.categories.map((category) => {
    required(identifier(category.id) && !categoryIds.has(category.id), 'Identificador de categoría inválido o repetido.');
    required(text(category.slug) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug) && !slugs.has(category.slug), 'Ruta de categoría inválida o repetida.');
    required(text(category.name), 'La categoría necesita un nombre.');
    categoryIds.add(category.id); slugs.add(category.slug);
    return { ...category, name: category.name.trim(), isVisible: category.isVisible !== false, sortOrder: Number.isFinite(category.sortOrder) ? category.sortOrder : 0 };
  });
  const products = input.products.map((product) => {
    required(identifier(product.id) && !productIds.has(product.id), 'Identificador de prenda inválido o repetido.');
    required(categoryIds.has(product.categoryId), 'La categoría de la prenda no existe.');
    required(text(product.name), 'La prenda necesita un nombre.');
    required(product.currency === 'ARS' && Number.isSafeInteger(product.priceCents) && product.priceCents >= 0, 'El precio debe expresarse en centavos de pesos argentinos.');
    required(Object.values(PRODUCT_STATUS).includes(product.status), 'Estado de prenda inválido.');
    required(Array.isArray(product.sizes) && product.sizes.length > 0 && product.sizes.every(text), 'La prenda necesita talles.');
    required(Array.isArray(product.images) && product.images.length > 0, 'La prenda necesita una foto.');
    const images = product.images.map((image) => {
      required(text(image.src), 'La foto necesita una dirección.');
      const url = new URL(image.src, 'https://velirea.netlify.app/');
      required(['https:', 'http:'].includes(url.protocol), 'Dirección de foto inválida.');
      required(Number.isInteger(image.width) && image.width > 0 && Number.isInteger(image.height) && image.height > 0, 'La foto necesita sus dimensiones.');
      return { ...image, alt: text(image.alt) ? image.alt.trim() : product.name.trim() };
    });
    productIds.add(product.id);
    return { ...product, name: product.name.trim(), sizes: product.sizes.map((size) => size.trim()), images, isVisible: product.isVisible !== false, isDemo: product.isDemo ?? Boolean(input.isDemo), sortOrder: Number.isFinite(product.sortOrder) ? product.sortOrder : 0 };
  });
  return { schemaVersion: CATALOG_SCHEMA_VERSION, isDemo: Boolean(input.isDemo), categories, products };
}

export const visibleCategories = (catalog) => catalog.categories.filter((category) => category.isVisible).sort(order);
export function productsForCategory(catalog, categoryId) {
  if (!catalog.categories.some((category) => category.id === categoryId && category.isVisible)) return [];
  return catalog.products.filter((product) => product.categoryId === categoryId && product.isVisible).sort(order);
}

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const formatPrice = (priceCents) => `${pesos.format(priceCents / 100)} ARS`;
export const categoryHref = (category) => `#coleccion/${category.slug}`;
export function slugFromHash(hash) {
  if (hash === '#coleccion' || !hash.startsWith('#coleccion/')) return null;
  try { return decodeURIComponent(hash.slice('#coleccion/'.length)); } catch { return ''; }
}
