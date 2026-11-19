import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { normalizeCatalog, visibleCategories } from '../catalog/model.js';

const digest = value => createHash('sha256').update(value).digest();
const cookieName = '__Host-velirea';
const sessionAge = 8 * 60 * 60;
const catalogKey = 'catalog';
const photoPrefix = '/api/shop/photo/';
const initialNames = ['Pantalones','Remeras','Shorts','Polleras','Vestidos','Blusas','Accesorios'];
const pausedCategoryIds = new Set(['cat-polleras','cat-vestidos','cat-accesorios']);
const initial = {
  schemaVersion: 1, products: [], categories: initialNames.map((name, sortOrder) => ({
    id: 'cat-' + name.toLowerCase(), slug: name.toLowerCase(), name, sortOrder, isVisible: true
  }))
};
class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function requireThat(value, status, message) { if (!value) throw new ApiError(status, message); }
function json(value, status = 200, headers = {}) {
  return Response.json(value, {status, headers: {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff', ...headers}});
}
function sessionCookie(token, age) {
  return cookieName + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + age;
}
function tokenFrom(request) {
  return request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-velirea=([a-f0-9]{64})(?:;|$)/)?.[1];
}
async function readJSON(request) {
  const body = await request.text();
  requireThat(body.length <= 2000000, 413, 'Los datos exceden el límite permitido.');
  try { return JSON.parse(body); } catch { throw new ApiError(400,'Revisá los datos enviados.'); }
}
async function readCatalog(store) {
  const saved = await store.getWithMetadata(catalogKey, {type:'json'});
  const {categoryVisibilityVersion, ...catalog} = saved?.data ?? initial;
  // Apply the pause to older catalogs until the owner's next save records their choices.
  if (!categoryVisibilityVersion) {
    catalog.categories = catalog.categories.map(c => pausedCategoryIds.has(c.id) ? {...c,isVisible:false} : c);
  }
  return {catalog, revision: saved?.etag ?? null};
}
function publicCatalog(catalog) {
  const categories = visibleCategories(catalog);
  const ids = new Set(categories.map(c => c.id));
  return {...catalog, categories, products: catalog.products.filter(p => p.isVisible && ids.has(p.categoryId))};
}
async function login(request, store, password, ip) {
  requireThat(password?.length >= 20, 503, 'Falta configurar el acceso de la dueña en Netlify.');
  const input = await readJSON(request);
  const key = 'attempt/' + digest(ip || 'unknown').toString('hex');
  const attempt = await store.getWithMetadata(key, {type:'json'});
  const now = Date.now();
  const window = attempt?.data.until > now ? attempt.data : {count:0, until:now + 900000};
  requireThat(window.count < 10, 429, 'Hubo varios intentos. Volvé a probar en 15 minutos.');
  const valid = typeof input?.password === 'string' && timingSafeEqual(digest(input.password), digest(password));
  if (!valid) {
    const saved = await store.setJSON(key, {...window,count:window.count + 1}, attempt ? {onlyIfMatch:attempt.etag} : {onlyIfNew:true});
    requireThat(saved.modified, 429, 'Esperá un momento antes de volver a intentar.');
    throw new ApiError(401,'La contraseña es incorrecta.');
  }
  const token = randomBytes(32).toString('hex');
  await store.setJSON('session/' + digest(token).toString('hex'), {until:now + sessionAge*1000, credential:digest(password + token).toString('hex')});
  return json({ok:true},200,{'Set-Cookie':sessionCookie(token,sessionAge)});
}
async function authorized(request, store, password) {
  const token = tokenFrom(request);
  if (!token || !password || password.length < 20) return false;
  const session = await store.get('session/' + digest(token).toString('hex'), {type:'json'});
  return session?.until > Date.now() && session.credential === digest(password + token).toString('hex');
}
async function persistCatalog(request, store) {
  const input = await readJSON(request);
  let catalog;
  try { catalog = normalizeCatalog(input.catalog); }
  catch { throw new ApiError(400,'Revisá las categorías, el nombre, el precio, los talles y las fotos.'); }
  const current = await readCatalog(store);
  requireThat(input.revision === current.revision,409,'El catálogo cambió en otra sesión. Recargá el panel antes de guardar.');
  const existingPhotos = new Map(current.catalog.products.flatMap(p => p.images.map(i => [i.src,i])));
  for (const category of catalog.categories) {
    requireThat(category.name.length <= 100,400,'El nombre de la categoría es demasiado largo.');
  }
  for (const product of catalog.products) {
    requireThat(typeof product.description === 'string' && product.description.length <= 4000 && product.name.length <= 150,400,'Revisá el nombre y la descripción.');
    requireThat(product.images.length <= 8,400,'Usá hasta ocho fotos por prenda.');
    product.isDemo = false;
    for (const image of product.images) {
      requireThat(/^\/api\/shop\/photo\/[a-f0-9-]{36}$/.test(image.src),400,'Seleccioná una foto subida al panel.');
      const id = image.src.slice(photoPrefix.length);
      const metadata = existingPhotos.get(image.src) ?? (await store.getMetadata('photo/' + id))?.metadata;
      requireThat(metadata,400,'La foto ya no está disponible. Volvé a subirla.');
      image.width = metadata.width;
      image.height = metadata.height;
      image.alt = product.name;
    }
  }
  catalog.isDemo = false;
  const result = await store.setJSON(catalogKey,{...catalog,categoryVisibilityVersion:1},current.revision ? {onlyIfMatch:current.revision} : {onlyIfNew:true});
  requireThat(result.modified,409,'Otra sesión guardó cambios. Recargá el panel.');
  return json({catalog, revision:result.etag});
}
async function upload(request, store) {
  const bytes = new Uint8Array(await request.arrayBuffer());
  requireThat(bytes.length <= 3*1024*1024,413,'La foto debe pesar menos de 3 MB.');
  requireThat(bytes[0]===255 && bytes[1]===216 && bytes[bytes.length-2]===255 && bytes[bytes.length-1]===217,400,'La foto debe ser un JPEG válido.');
  // Read the dimensions from the JPEG frame, independent of the submitted filename.
  const view = new DataView(bytes.buffer);
  let width = 0, height = 0;
  for (let i=2; i+9 < bytes.length && bytes[i]===255;) {
    const marker = bytes[i+1], length = view.getUint16(i+2);
    if (length < 2 || i+2+length > bytes.length || marker === 218) break;
    if ([192,193,194].includes(marker) && length >= 8) {
      height = view.getUint16(i+5); width = view.getUint16(i+7); break;
    }
    i += 2 + length;
  }
  requireThat(width && height && width <= 4000 && height <= 4000,400,'La imagen no se pudo leer o es demasiado grande.');
  const id = randomUUID();
  await store.set('photo/' + id,bytes.buffer,{metadata:{width,height}});
  return json({src:photoPrefix + id,width,height},201);
}
export async function handleShop(request,{store,password,ip}) {
  try {
    const url = new URL(request.url);
    const route = url.pathname.slice('/api/shop/'.length);
    const method = request.method;
    if (method !== 'GET') requireThat(request.headers.get('Origin') === url.origin,403,'Origen no autorizado.');
    if (route === 'login' && method === 'POST') return await login(request,store,password,ip);
    if (route === 'catalog' && method === 'GET') return json(publicCatalog((await readCatalog(store)).catalog));
    if (/^photo\/[a-f0-9-]{36}$/.test(route) && method === 'GET') {
      const src = '/api/shop/' + route;
      const catalog = publicCatalog((await readCatalog(store)).catalog);
      const visible = catalog.products.some(p => p.images.some(i => i.src === src));
      requireThat(visible || await authorized(request,store,password),404,'Foto no encontrada.');
      const data = await store.get(route,{type:'arrayBuffer'});
      requireThat(data,404,'Foto no encontrada.');
      return new Response(data,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
    }
    requireThat(await authorized(request,store,password),401,'Ingresá con la contraseña de la dueña.');
    if (route === 'admin' && method === 'GET') return json(await readCatalog(store));
    if (route === 'admin' && method === 'PUT') return await persistCatalog(request,store);
    if (route === 'photo' && method === 'POST') return await upload(request,store);
    if (route === 'logout' && method === 'POST') {
      await store.delete('session/' + digest(tokenFrom(request)).toString('hex'));
      return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
    }
    throw new ApiError(404,'Acción no encontrada.');
  } catch (error) {
    if (!(error instanceof ApiError)) console.error('Error del servicio de catálogo',error.name);
    return json({error:error instanceof ApiError ? error.message : 'No pudimos acceder al catálogo. Volvé a intentar.'}, error instanceof ApiError ? error.status : 503);
  }
}
