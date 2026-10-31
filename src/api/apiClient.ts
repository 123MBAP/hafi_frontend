/**
 * Centralized API Client for HafiConnect
 * 
 * All API calls MUST use API_BASE from this module instead of
 * hardcoding backend URLs. The real backend URL is never sent to
 * the browser — Vite proxy (dev) and Vercel rewrites (prod) handle
 * forwarding transparently.
 * 
 * Usage:
 *   import { API_BASE } from '@/api/apiClient';
 *   fetch(`${API_BASE}/api/profile`, { ... })
 */

/**
 * The base URL prefix for all API requests.
 * 
 * - In development: empty string → requests go to `/api/*` on the same
 *   origin (localhost:5173), and the Vite dev-server proxy forwards them
 *   to the backend (localhost:5000).
 * 
 * - In production: empty string → requests go to `/api/*` on the same
 *   origin, and the Vercel rewrite rule forwards them to the production
 *   backend (configured in vercel.json).
 * 
 * Because the browser only ever sees relative `/api/*` paths, the real
 * backend origin is never exposed in the Network tab, source code, or
 * console.
 */
export const API_BASE = '';
export const API_BASE_URL = '/api';
