/**
 * Edge API Client using Cloudflare Worker + Hyperdrive with Client-Side Caching & In-Flight Deduplication.
 *
 * Caching Strategy:
 * 1. Layer 1 (Client): In-memory Map deduplicates inflight requests and caches reads for TTL (prevents duplicate React renders/mounts)
 * 2. Layer 2 (Cloudflare Edge Cache): Cloudflare Edge stores responses globally via caches.default (0ms, 0 DB queries on cache hit)
 * 3. Layer 3 (Cloudflare Hyperdrive): If edge cache misses, Hyperdrive accelerates the query via connection pool to Supabase
 */

import { cachedFetch, clearFetchCache } from '../utils/cachedFetch';

const WORKER_BASE =
  import.meta.env.VITE_CLOUDFLARE_WORKER_URL ||
  'https://haficonnect-worker.haficonnect.workers.dev';

export interface WorkerProduct {
  id: number | string;
  title: string;
  description: string;
  price: string | number;
  image_url: string;
  category_id?: string | number;
  shopping_type_id?: number;
  shopping_type_name?: string;
  views?: string[];
  mediaFiles?: { url: string; type: 'image' | 'video' }[];
  fileType?: string;
  madeInRwanda?: boolean;
  used?: boolean;
  pricingUnit?: string;
  inStock?: boolean;
  createdAt?: string;
  providerId?: number | null;
}

export interface WorkerProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  property_type: string;
  listing_type: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqm?: number | null;
  images: string[];
  provider_id: number;
  contact?: string | null;
  whatsapp_number?: string | null;
  verified?: boolean;
}

/**
 * Fetch marketplace products with in-memory & edge caching
 */
export const fetchEdgeProducts = async (options?: {
  categoryId?: string | number;
  madeInRwanda?: boolean;
  search?: string;
  limit?: number;
}): Promise<{ total: number; products: WorkerProduct[] }> => {
  const params = new URLSearchParams();
  if (options?.categoryId) params.append('categoryId', String(options.categoryId));
  if (options?.madeInRwanda) params.append('madeInRwanda', 'true');
  if (options?.search) params.append('search', options.search);
  if (options?.limit) params.append('limit', String(options.limit));

  const qs = params.toString() ? `?${params.toString()}` : '';
  const url = `${WORKER_BASE}/api/products${qs}`;

  // Client cache for 30s
  return await cachedFetch<{ total: number; products: WorkerProduct[] }>(url, {}, { ttlMs: 30_000 });
};

/**
 * Fetch shops products with in-memory & edge caching
 */
export const fetchEdgeShopProducts = async (shopTypeId?: string | number): Promise<{ products: WorkerProduct[] }> => {
  const qs = shopTypeId ? `?shop_type_id=${shopTypeId}` : '';
  const url = `${WORKER_BASE}/api/shops/products${qs}`;
  return await cachedFetch<{ products: WorkerProduct[] }>(url, {}, { ttlMs: 30_000 });
};

/**
 * Fetch Made in Rwanda products with in-memory & edge caching
 */
export const fetchEdgeMadeInRwanda = async (): Promise<{ products: WorkerProduct[] }> => {
  const url = `${WORKER_BASE}/api/market/made-in-rwanda`;
  return await cachedFetch<{ products: WorkerProduct[] }>(url, {}, { ttlMs: 30_000 });
};

/**
 * Fetch Real Estate properties with in-memory & edge caching
 */
export const fetchEdgeProperties = async (limit = 200): Promise<{ properties: WorkerProperty[] }> => {
  const url = `${WORKER_BASE}/api/real-estate/properties?limit=${limit}`;
  return await cachedFetch<{ properties: WorkerProperty[] }>(url, {}, { ttlMs: 45_000 });
};

/**
 * Fetch Real Estate service metadata
 */
export const fetchEdgeRealEstateService = async (): Promise<{ service: any }> => {
  const url = `${WORKER_BASE}/api/real-estate/service`;
  return await cachedFetch<{ service: any }>(url, {}, { ttlMs: 300_000 }); // 5 minutes
};

/**
 * Fetch providers by service ID (used for commissioners)
 */
export const fetchEdgeProvidersByService = async (serviceId: string | number): Promise<any[]> => {
  const url = `${WORKER_BASE}/api/providers/${serviceId}/providers`;
  return await cachedFetch<any[]>(url, {}, { ttlMs: 60_000 });
};

/**
 * Fetch single provider info by ID
 */
export const fetchEdgeProviderById = async (id: string | number): Promise<any> => {
  const url = `${WORKER_BASE}/api/providers/${id}`;
  return await cachedFetch<any>(url, {}, { ttlMs: 60_000 });
};

/**
 * Fetch single product from Edge
 */
export const fetchEdgeProductById = async (id: number | string): Promise<WorkerProduct> => {
  const url = `${WORKER_BASE}/api/products/${id}`;
  const data = await cachedFetch<{ product: WorkerProduct }>(url, {}, { ttlMs: 60_000 });
  return data.product;
};

/**
 * Fetch recent 7-day notifications/updates with caching
 */
export const fetchEdgeNotifications = async (): Promise<any[]> => {
  const url = `${WORKER_BASE}/api/notifications`;
  return await cachedFetch<any[]>(url, {}, { ttlMs: 30_000 });
};

/**
 * Invalidate client-side cache
 */
export const invalidateEdgeCache = () => {
  clearFetchCache();
};

export default {
  WORKER_BASE,
  fetchEdgeProducts,
  fetchEdgeProductById,
  fetchEdgeShopProducts,
  fetchEdgeMadeInRwanda,
  fetchEdgeProperties,
  fetchEdgeRealEstateService,
  fetchEdgeProvidersByService,
  fetchEdgeProviderById,
  fetchEdgeNotifications,
  invalidateEdgeCache,
};
