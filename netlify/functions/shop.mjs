import { getStore } from '@netlify/blobs';
import { handleShop } from '../../server/shop.mjs';

export const config = { path: '/api/shop/*' };

export default (request, context) => handleShop(request, {
  store: getStore({ name: 'velirea-shop-v1', consistency: 'strong' }),
  password: process.env.VELIREA_OWNER_PASSWORD,
  ip: context.ip
});
