import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '@/context/DarkMode';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

interface SearchItem {
  id: number | string;
  type?: 'product' | 'service' | string;
  name?: string;
  image?: string;
  price?: number | string;
  category?: string;
  slug?: string;
  [key: string]: any;
}

export default function Search() {
  const { darkMode } = useDarkMode();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const q = params.get('q')?.trim() || '';

  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function run() {
      if (!q || q.length < 1) {
        setLoading(false);
        setError(null);
        setResults([]);
        return;
      }
      // Clear previous results immediately so UI doesn't show stale data
      setResults([]);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}` , { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return; // ignore aborted requests
        setError(e?.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => controller.abort();
  }, [q]);

  const products = results.filter(r => r.type === 'product');
  const services = results.filter(r => r.type === 'service');
  const others = results.filter(r => r.type !== 'product' && r.type !== 'service');

  const renderItem = (item: SearchItem) => {
    let to = item.slug ? `/${item.type}/${item.slug}` : `/${item.type}/${item.id}`;
    if (item.type === 'product') {
      to = `/market?categoryId=${encodeURIComponent(String(item.id))}`;
    } else if (item.type === 'service') {
      to = `/services/${encodeURIComponent(String(item.id))}`;
    }
    return (
      <Link
        key={`${item.type}-${item.id}`}
        to={to}
        className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
          darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
        }`}
      >
        <img
          src={item.image || '/placeholder.png'}
          alt={item.name || 'Result'}
          className="w-12 h-12 rounded object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className={`truncate font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {item.name || 'Untitled'}
          </div>
          {item.price !== undefined && (
            <div className="text-sm text-gray-500 mt-0.5">{String(item.price)} RWF</div>
          )}
          {item.type && (
            <div className="text-xs mt-0.5 text-gray-400">{item.type}</div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Search results{q ? ` for "${q}"` : ''}
      </h1>

      {loading && (
        <div className="py-10 text-center">
          <div className="inline-block w-6 h-6 border-2 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-md mb-4 ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className={`p-6 rounded-md text-center ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
          No results found.
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-6">
          <div className={`px-1 py-2 text-xs uppercase font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Products</div>
          <div className="grid grid-cols-1 gap-3">
            {products.map(renderItem)}
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div className="mb-6">
          <div className={`px-1 py-2 text-xs uppercase font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Services</div>
          <div className="grid grid-cols-1 gap-3">
            {services.map(renderItem)}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="mb-6">
          <div className={`px-1 py-2 text-xs uppercase font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Other</div>
          <div className="grid grid-cols-1 gap-3">
            {others.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
}
