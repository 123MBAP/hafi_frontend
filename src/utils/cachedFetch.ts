/**
 * cachedFetch — a drop-in replacement for fetch() for GET endpoints.
 *
 * Stores responses in a module-level Map so that repeated calls to the
 * same URL (within the TTL) return the cached body without hitting the
 * network. This prevents 429 errors caused by React Strict Mode
 * double-invocations, HMR remounts, or rapid navigation.
 *
 * Usage:
 *   import { cachedFetch } from '@/utils/cachedFetch';
 *   const data = await cachedFetch('/api/services');
 *
 * To bypass the cache (e.g. after a mutation):
 *   cachedFetch('/api/services', {}, { force: true });
 *   // or clear everything:
 *   clearFetchCache();
 */

interface CacheEntry {
    data: unknown;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

/** Default time-to-live: 30 seconds */
const DEFAULT_TTL_MS = 30_000;
const MAX_429_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getRetryDelayMs(res: Response, attempt: number): number {
    const retryAfter = res.headers.get('Retry-After');
    if (retryAfter) {
        const asNumber = Number(retryAfter);
        if (Number.isFinite(asNumber)) {
            return Math.max(0, asNumber * 1000);
        }

        const asDate = Date.parse(retryAfter);
        if (!Number.isNaN(asDate)) {
            return Math.max(0, asDate - Date.now());
        }
    }

    // Exponential backoff with a conservative base to avoid request storms.
    return 500 * (2 ** attempt);
}

/**
 * Fetch a GET endpoint with an in-memory cache.
 *
 * @param url        - Absolute or relative URL
 * @param init       - Standard RequestInit (headers, signal, …)  — method is always GET
 * @param options    - { ttl?: number (ms), force?: boolean }
 */
export async function cachedFetch<T = unknown>(
    url: string,
    init: RequestInit = {},
    options: { ttl?: number; force?: boolean } = {}
): Promise<T> {
    const { ttl = DEFAULT_TTL_MS, force = false } = options;
    const now = Date.now();

    if (!force) {
        const cached = cache.get(url);
        if (cached && now < cached.expiresAt) {
            return cached.data as T;
        }

        const pending = inflight.get(url);
        if (pending) {
            return pending as Promise<T>;
        }
    }

    const requestPromise = (async () => {
        let lastStatus = 0;
        let lastStatusText = 'Unknown Error';

        for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt += 1) {
            const res = await fetch(url, { ...init, method: 'GET' });
            lastStatus = res.status;
            lastStatusText = res.statusText;

            if (res.ok) {
                const data: T = await res.json();
                cache.set(url, { data, expiresAt: Date.now() + ttl });
                return data;
            }

            if (res.status === 429 && attempt < MAX_429_RETRIES) {
                await sleep(getRetryDelayMs(res, attempt));
                continue;
            }

            throw new Error(`HTTP ${res.status}: ${res.statusText} — ${url}`);
        }

        throw new Error(`HTTP ${lastStatus}: ${lastStatusText} — ${url}`);
    })();

    if (!force) {
        inflight.set(url, requestPromise as Promise<unknown>);
    }

    try {
        return await requestPromise;
    } finally {
        inflight.delete(url);
    }
}

/**
 * Manually invalidate one or more cached URLs.
 * Pass no arguments to wipe the entire cache.
 */
export function clearFetchCache(...urls: string[]) {
    if (urls.length === 0) {
        cache.clear();
        inflight.clear();
    } else {
        urls.forEach((u) => {
            cache.delete(u);
            inflight.delete(u);
        });
    }
}
