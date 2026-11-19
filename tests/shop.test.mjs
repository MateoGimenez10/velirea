import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { BlobsServer } from '@netlify/blobs/server';
import { getStore } from '@netlify/blobs';
import { handleShop } from '../server/shop.mjs';

test('owner lifecycle and persistence with the Netlify Blobs development server', async t => {
  const directory = await mkdtemp(join(tmpdir(),'velirea-blobs-'));
  const token = randomBytes(32).toString('hex'), password = randomBytes(24).toString('hex');
  let server, store;
  const localEtags = new Map();
  // BlobsServer 11.1.9 returns ETag on PUT and enforces If-Match on disk,
  // but omits ETag on GET. Restore that production response header in tests.
  async function localFetch(input, init) {
    const req = new Request(input,init);
    const res = await fetch(req);
    const key = new URL(req.url).pathname;
    if (req.method === 'PUT' && res.ok) localEtags.set(key,res.headers.get('etag'));
    if (req.method === 'GET' && res.ok && !res.headers.has('etag') && localEtags.get(key)) {
      const headers = new Headers(res.headers);
      headers.set('etag',localEtags.get(key));
      return new Response(res.body,{status:res.status,headers});
    }
    return res;
  }
  async function start() {
    server = new BlobsServer({directory,token,logger:()=>{}});
    const {port} = await server.start();
    const address = 'http://127.0.0.1:' + port;
    store = getStore({name:'velirea-test',siteID:'test-site', token, edgeURL:address,uncachedEdgeURL:address,consistency:'strong',fetch:localFetch});
  }
  await start();
  t.after(() => server.stop());
  const origin = 'https://velirea.test';
  function call(route,method='GET',value,cookie='',from=origin) {
    const headers = {origin:from,cookie};
    const body = value instanceof Uint8Array ? value : JSON.stringify(value);
    return handleShop(new Request(origin+'/api/shop/'+route,{method,headers,body}),{store,password,ip:'localhost'});
  }
  const guest = await (await call('catalog')).json();
  assert.equal(guest.categories.length,7); assert.deepEqual(guest.products,[]);
  for (const [path,method] of [['admin','GET'],['admin','PUT'],['photo','POST']]) {
    assert.equal((await call(path,method)).status,401);
  }
  assert.equal((await call('login','POST',{password:'incorrecta'})).status,401);
  const login = await call('login','POST',{password}); assert.equal(login.status,200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.match(login.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
  let state = await (await call('admin','GET',undefined,cookie)).json();
  async function save() {
    const response = await call('admin','PUT',state,cookie);
    assert.equal(response.status,200,await response.clone().text());
    state = await response.json();
  }
  const bytes = await readFile(new URL('../assets/img/catalog/jean-recto.jpg',import.meta.url));
  const photos = [];
  for (let i=0;i<2;i++) {
    const upload = await call('photo','POST',bytes,cookie); assert.equal(upload.status,201,await upload.clone().text());
    photos.push(await upload.json());
  }
  assert.equal((await call(photos[0].src.split('/api/shop/')[1])).status,404);
  state.catalog.categories.unshift({id:'abrigo',name:'Abrigos',slug:'abrigos',sortOrder:-1,isVisible:true});
  state.catalog.products.push({id:'uno',name:'Saco',description:'De lana',categoryId:'abrigo',currency:'ARS',priceCents:1234500,
    sizes:['M'],images:photos,isVisible:true,status:'available'});
  const stale = structuredClone(state);
  await save();
  assert.equal((await call('admin','PUT',stale,cookie)).status,409);
  assert.equal((await call('admin','PUT',state,cookie,'https://otra.test')).status,403);
  const product = state.catalog.products[0];
  product.priceCents = 2345678; product.sizes = ['S','L']; product.status = 'sold_out';
  state.catalog.categories[0].name = 'Sacos';
  await save();
  await server.stop(); await start();
  const publicData = await (await call('catalog')).json();
  assert.equal(publicData.categories[0].name,'Sacos');
  assert.equal(publicData.products[0].priceCents,2345678);
  assert.deepEqual(publicData.products[0].sizes,['S','L']);
  assert.equal(publicData.products[0].status,'sold_out'); assert.equal(publicData.products[0].images.length,2);
  const photoRoute = photos[0].src.split('/api/shop/')[1];
  assert.deepEqual(Buffer.from(await (await call(photoRoute)).arrayBuffer()),bytes);
  state.catalog.products[0].isVisible=false; await save();
  assert.deepEqual((await (await call('catalog')).json()).products,[]);
  assert.equal((await call(photoRoute)).status,404);
  state.catalog.products=[]; await save();
  assert.equal((await call('logout','POST',undefined,cookie)).status,200);
  assert.equal((await call('admin','PUT',stale,cookie)).status,401);
});
