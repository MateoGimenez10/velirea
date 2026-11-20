import { formatPrice, isSoldOut } from '/catalog/model.js';

const $ = id => document.getElementById(id);
const login = $('login'), editor = $('editor'), categoryForm = $('category');
const field = name => editor.elements.namedItem(name);
let state, editingId, categoryId, photos = [], busy = false;

async function api(route, method = 'GET', value) {
  const photo = value instanceof Blob;
  const response = await fetch('/api/shop/' + route, {
    method, cache:'no-store',
    headers: value === undefined ? {} : {'Content-Type':photo ? 'image/jpeg' : 'application/json'},
    body: photo ? value : JSON.stringify(value)
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) showLogin();
    const error = new Error(result.error || 'Volvé a intentar.');
    error.status = response.status;
    throw error;
  }
  return result;
}
function say(message) { $('message').textContent = message; }
async function run(action) {
  if (busy) return;
  busy = true;
  for (const id of ['workspace','login','logout']) $(id).inert = true;
  try { await action(); }
  catch (error) { say(error.message || 'No se pudo completar la acción.'); }
  finally {
    for (const id of ['workspace','login','logout']) $(id).inert = false;
    busy = false;
  }
}
function showLogin() {
  $('workspace').hidden = $('logout').hidden = true;
  editor.hidden = true;
  state = null;
  clearPhotos();
  clearCategory();
  login.hidden = false;
}
function enter(result) {
  state = result;
  login.hidden = true;
  $('workspace').hidden = $('logout').hidden = false;
  draw();
}
async function save(catalog, message) {
  state = await api('admin','PUT',{catalog,revision:state.revision});
  draw();
  say(message);
}
function button(label, handler) {
  const node = document.createElement('button');
  node.type = 'button'; node.textContent = label;
  node.onclick = handler;
  return node;
}
function row(label, ...buttons) {
  const li = document.createElement('li'), name = document.createElement('span');
  name.textContent = label; li.className = 'row'; li.append(name,...buttons);
  return li;
}
function draw() {
  const {categories,products} = state.catalog;
  const selected = field('category').value;
  field('category').replaceChildren(...categories.map(c => new Option(c.name + (c.isVisible ? '' : ' · Oculta'),c.id)));
  if (categories.some(c => c.id === selected)) field('category').value = selected;
  $('products').replaceChildren(...products.map(p => row(
    p.name + ' · ' + formatPrice(p.priceCents) + ' · ' + (isSoldOut(p) ? 'Agotado' : 'Disponible') + (p.isVisible ? '' : ' · Oculta'),
    button('Editar',() => edit(p)), button('Eliminar',() => run(async () => {
      if (!confirm('¿Eliminar «' + p.name + '» del catálogo?')) return;
      const draft = structuredClone(state.catalog);
      draft.products = draft.products.filter(item => item.id !== p.id);
      await save(draft,'Prenda eliminada.');
      if (editingId === p.id) editor.hidden = true;
    }))
  )));
  if (!products.length) $('products').textContent = 'Todavía no cargaste prendas.';
  $('categories').replaceChildren(...categories.map((c,i) => {
    const up = button('Subir',() => move(i,-1)), down = button('Bajar',() => move(i,1));
    up.disabled = i === 0; down.disabled = i === categories.length - 1;
    return row(c.name + (c.isVisible ? '' : ' · Oculta'),button('Editar',() => {
      categoryId = c.id; $('category-label').textContent = 'Editar categoría';
      $('category-visible').checked = c.isVisible;
      $('category-name').value = c.name; $('cancel-category').hidden = false; $('category-name').focus();
    }),up,down);
  }));
}
function move(index, step) { run(async () => {
  const draft = structuredClone(state.catalog);
  const [item] = draft.categories.splice(index,1);
  draft.categories.splice(index + step,0,item);
  draft.categories.forEach((c,i) => c.sortOrder = i);
  await save(draft,'Orden de categorías guardado.');
}); }
function clearCategory() {
  categoryId = null; categoryForm.reset(); $('cancel-category').hidden = true; $('category-label').textContent = 'Nueva categoría';
}
$('cancel-category').onclick = clearCategory;
categoryForm.onsubmit = event => {
  event.preventDefault(); run(async () => {
    const draft = structuredClone(state.catalog);
    const name = $('category-name').value.trim();
    if (!name || draft.categories.some(c => c.id !== categoryId && c.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) throw Error('Ingresá un nombre de categoría único.');
    const isVisible = $('category-visible').checked;
    if (categoryId) Object.assign(draft.categories.find(c => c.id === categoryId),{name,isVisible});
    else {
      const id = crypto.randomUUID();
      const base = name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'categoria';
      const slug = draft.categories.some(c => c.slug === base) ? base + '-' + id.slice(0,8) : base;
      draft.categories.push({id,name,slug,isVisible,sortOrder:draft.categories.length});
    }
    await save(draft,'Categoría guardada.'); clearCategory();
  });
};
function clearPhotos() {
  for (const photo of photos) if (photo.blob) URL.revokeObjectURL(photo.preview);
  photos = [];
}
function drawPhotos() {
  $('photos').replaceChildren(...photos.map((photo,i) => {
    const figure = document.createElement('figure'), img = new Image();
    img.src = photo.preview || photo.src; img.alt = 'Foto ' + (i+1);
    figure.append(img,button('Quitar',() => {
      photos.splice(i,1); if (photo.blob) URL.revokeObjectURL(photo.preview); drawPhotos();
    }));
    return figure;
  }));
}
function edit(p) {
  editor.reset(); clearPhotos(); editingId = p?.id;
  $('form-title').textContent = p ? 'Editar prenda' : 'Nueva prenda';
  if (p) {
    field('name').value = p.name; field('description').value = p.description;
    field('price').value = (p.priceCents/100).toFixed(2).replace('.',',');
    field('sizes').value = p.sizes.join(', '); field('status').value = p.status;
    field('soldOutSizes').value = (p.soldOutSizes ?? []).join(', ');
    field('colors').value = (p.colors ?? []).join(', ');
    field('category').value = p.categoryId; field('visible').checked = p.isVisible;
    photos = structuredClone(p.images);
  }
  editor.hidden = false; drawPhotos(); field('name').focus();
}
$('add').onclick = () => edit();
$('cancel').onclick = () => {clearPhotos(); editor.hidden = true;};
async function preparePhoto(file) {
  const image = new Image(), url = URL.createObjectURL(file);
  try {
    image.src = url; await image.decode();
    const scale = Math.min(1,1600 / Math.max(image.naturalWidth,image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(image.naturalWidth*scale)); canvas.height = Math.max(1,Math.round(image.naturalHeight*scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',.84));
    if (!blob) throw Error();
    return {blob,preview:URL.createObjectURL(blob)};
  } catch { throw Error('No se pudo leer «' + file.name + '». Probá con una foto JPG, PNG o WebP.'); }
  finally { URL.revokeObjectURL(url); }
}
$('files').onchange = () => run(async () => {
  const files = [...$('files').files]; $('files').value = '';
  if (photos.length + files.length > 8) throw Error('Podés usar hasta ocho fotos por prenda.');
  for (const file of files) { photos.push(await preparePhoto(file)); drawPhotos(); }
  say('Fotos listas para guardar.');
});
editor.onsubmit = event => {
  event.preventDefault(); run(async () => {
    const price = field('price').value.trim();
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(price)) throw Error('Ingresá el precio sin puntos de miles, por ejemplo 24500,50.');
    const list = name => field(name).value.split(',').map(s=>s.trim()).filter(Boolean);
    const sizes = list('sizes'), soldOutSizes = list('soldOutSizes'), colors = list('colors');
    if (soldOutSizes.some(size => !sizes.includes(size))) throw Error('Incluí cada talle agotado también en la lista de talles.');
    if (!photos.length || !sizes.length || !field('name').value.trim()) throw Error('Completá el nombre, los talles y al menos una foto.');
    say('Guardando prenda…');
    const images = [];
    for (const photo of photos) {
      if (!photo.src) Object.assign(photo,await api('photo','POST',photo.blob));
      images.push({src:photo.src,width:photo.width,height:photo.height,alt:field('name').value.trim()});
    }
    const draft = structuredClone(state.catalog);
    const index = draft.products.findIndex(p => p.id === editingId);
    const product = {id:editingId || crypto.randomUUID(), name:field('name').value.trim(), description:field('description').value.trim(),
      priceCents:Math.round(Number(price.replace(',','.'))*100),currency:'ARS',sizes,soldOutSizes,colors,categoryId:field('category').value,
      status:field('status').value,isVisible:field('visible').checked,images,sortOrder:index < 0 ? Date.now() : draft.products[index].sortOrder};
    if (index < 0) draft.products.push(product); else draft.products[index] = product;
    await save(draft,'Prenda guardada.'); clearPhotos(); editor.hidden = true;
  });
};
login.onsubmit = event => {
  event.preventDefault(); run(async () => {
    await api('login','POST',{password:login.elements.password.value});
    login.reset(); enter(await api('admin')); say('');
  });
};
$('logout').onclick = () => run(async () => {
  await api('logout','POST'); showLogin(); say('Sesión cerrada.');
});
run(async () => {
  try { enter(await api('admin')); say(''); }
  catch (error) {
    showLogin();
    say(error.status === 401 ? '' : 'No se pudo consultar la sesión. Volvé a intentar el ingreso.');
  }
});
