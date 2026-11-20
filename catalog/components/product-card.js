import { formatPrice, isSoldOut, productHref } from '../model.js';

const element = (tag, className, content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
};

export function productCard(product) {
  const card = element('a', 'catalog-card');
  card.href = productHref(product);
  card.dataset.productId = product.id;
  card.setAttribute('aria-labelledby', `product-${product.id}`);
  const media = element('div', 'catalog-card__photo');
  const image = element('img');
  const photo = product.images[0];
  image.src = photo.src;
  image.alt = photo.alt;
  image.width = photo.width;
  image.height = photo.height;
  image.loading = 'lazy';
  image.decoding = 'async';
  if (product.isDemo) image.dataset.source = 'stand-in';
  image.dataset.subject = product.name;
  image.addEventListener('error', () => {
    const fallback = element('p', 'catalog-card__image-error', 'Foto no disponible');
    media.replaceChildren(fallback);
  }, { once: true });
  media.append(image);

  const content = element('div', 'catalog-card__content');
  const soldOut = isSoldOut(product);
  const state = element('p', 'catalog-card__state', soldOut ? 'Agotado' : 'Disponible');
  state.dataset.status = soldOut ? 'sold_out' : 'available';
  const title = element('h2', 'catalog-card__name', product.name);
  title.id = `product-${product.id}`;
  const price = element('p', 'catalog-card__price', formatPrice(product.priceCents));
  const sizes = element('p', 'catalog-card__sizes', 'Talles: ' + product.sizes.map(size =>
    !soldOut && product.soldOutSizes.includes(size) ? size + ' (agotado)' : size
  ).join(' · '));
  content.append(state, title, price, sizes);
  card.append(media, content);
  return card;
}
