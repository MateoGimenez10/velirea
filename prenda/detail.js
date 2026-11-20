import { loadCatalog } from '../catalog/repository.js';
import { categoryHref, productHref, formatPrice, isSoldOut } from '../catalog/model.js';
import { shopWhatsApp } from '../catalog/shop-contact.js';

const byId = id => document.getElementById(id);
const slides = byId('slides'), thumbs = byId('thumbs'), viewer = byId('viewer');

function photoElement(photo) {
  const image = new Image();
  image.src = photo.src;
  image.alt = photo.alt;
  image.width = photo.width;
  image.height = photo.height;
  return image;
}

function gallery(photos) {
  let index = 0;
  let requested = null;
  function mark(i) {
    index = i;
    byId('position').textContent = 'Foto ' + (i + 1) + ' de ' + photos.length;
    [...thumbs.children].forEach((button,n) => button.setAttribute('aria-pressed', String(i === n)));
  }
  function select(i) {
    requested = i;
    slides.scrollTo({left:i * slides.getBoundingClientRect().width,behavior:'instant'});
    mark(i);
  }
  function enlarge(i) {
    const image = byId('large');
    image.src = photos[i].src;
    image.alt = photos[i].alt + ', foto ' + (i + 1);
    image.parentElement.classList.remove('is-zoomed');
    byId('zoom').setAttribute('aria-pressed','false');
    byId('zoom').textContent = 'Ver al 100 %';
    viewer.showModal();
  }
  for (const [i,photo] of photos.entries()) {
    const number = (i + 1) + ' de ' + photos.length;
    const slide = document.createElement('button');
    slide.type = 'button';
    slide.className = 'slide';
    slide.setAttribute('aria-label', 'Ampliar foto ' + number);
    slide.append(photoElement(photo));
    slide.onclick = () => enlarge(i);
    slides.append(slide);
    if (photos.length > 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label','Ver foto ' + number);
      const mini = photoElement(photo);
      mini.alt = '';
      button.append(mini);
      button.onclick = () => select(i);
      thumbs.append(button);
    }
  }
  slides.onscroll = () => {
    if (requested !== null) return;
    const i = Math.min(photos.length - 1,Math.max(0,Math.round(slides.scrollLeft / slides.clientWidth)));
    if (i !== index && Number.isFinite(i)) mark(i);
  };
  // A thumbnail tap takes precedence over the tail of a touch fling.
  slides.onscrollend = () => {
    if (requested !== null && Math.abs(slides.scrollLeft - requested * slides.getBoundingClientRect().width) > 2) select(requested);
  };
  for (const event of ['pointerdown','wheel','keydown','focusin']) {
    slides.addEventListener(event, () => { requested = null; }, {passive:true});
  }
  byId('expand').onclick = () => enlarge(index);
  byId('close').onclick = () => viewer.close();
  byId('zoom').onclick = () => {
    const active = byId('large').parentElement.classList.toggle('is-zoomed');
    byId('zoom').setAttribute('aria-pressed',String(active));
    byId('zoom').textContent = active ? 'Ajustar a pantalla' : 'Ver al 100 %';
  };
  mark(0);
}

function inquiry(product, size) {
  const url = new URL(shopWhatsApp);
  const lines = [
    '¡Hola! 😊 Estoy viendo esta prenda en VELIRÉA y me gustaría consultar por ella.',
    '', '🛍️ Prenda: ' + product.name
  ];
  if (size) lines.push('📏 Talle: ' + size);
  lines.push('💰 Precio: ' + formatPrice(product.priceCents),
    '🔗 Producto: ' + new URL(productHref(product),location.origin).href, '',
    isSoldOut(product) ? '¿Me avisás si vuelve a estar disponible? ¡Gracias!' : '¿Me podrías confirmar si está disponible? ¡Gracias!');
  url.searchParams.set('text',lines.join('\n'));
  return url.href;
}

function showProduct(product, category) {
  document.title = product.name + ' · VELIREA';
  byId('back').href = categoryHref(category);
  byId('back').textContent = '← Volver a ' + category.name;
  byId('name').textContent = product.name;
  byId('price').textContent = formatPrice(product.priceCents);
  const soldOut = isSoldOut(product);
  byId('state').textContent = soldOut ? 'Agotado' : 'Disponible';
  if (product.description) {
    byId('description').textContent = product.description;
    byId('description').hidden = false;
  }
  if (product.colors.length) {
    byId('colors').textContent = 'Colores: ' + product.colors.join(' · ');
    byId('colors').hidden = false;
  }
  const initialSize = soldOut ? null : product.sizes.find(size => !product.soldOutSizes.includes(size));
  const consult = byId('consult');
  consult.href = inquiry(product,initialSize);
  for (const size of product.sizes) {
    const label = document.createElement('label'), input = document.createElement('input'), caption = document.createElement('span');
    label.className = 'size';
    input.type = 'radio';
    input.name = 'size';
    input.value = size;
    input.disabled = soldOut || product.soldOutSizes.includes(size);
    input.checked = size === initialSize;
    input.onchange = () => { consult.href = inquiry(product,size); };
    caption.textContent = size + (input.disabled ? ' · Agotado' : '');
    label.append(input,caption);
    byId('sizes').append(label);
  }
  gallery(product.images);
  byId('notice').hidden = true;
  byId('product').hidden = false;
}

async function load() {
  const id = new URLSearchParams(location.search).get('id');
  byId('retry').hidden = true;
  try {
    byId('notice').textContent = 'Cargando prenda…';
    const catalog = await loadCatalog();
    const product = catalog.products.find(p => p.id === id && p.isVisible);
    const category = product && catalog.categories.find(c => c.id === product.categoryId && c.isVisible);
    if (category) showProduct(product,category);
    else byId('notice').textContent = 'Esta prenda ya no está en el catálogo.';
  } catch {
    byId('notice').textContent = 'No pudimos cargar la prenda.';
    byId('retry').hidden = false;
  }
}

byId('retry').onclick = load;
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
load();
