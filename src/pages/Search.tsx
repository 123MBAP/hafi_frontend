import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '@/context/DarkMode';
import { PageHeader } from '@/components/ui/PageHeader';
import { Search as SearchIcon, ArrowRight, Tag, Layers } from 'lucide-react';
import { API_BASE } from '../api/apiClient';

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
      setResults([]);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
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

    const isProduct = item.type === 'product';

    return (
      <Link
        key={`${item.type}-${item.id}`}
        to={to}
        className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 shadow-xs ${
          darkMode 
            ? 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-850' 
            : 'border-[#E5E5E5] bg-white hover:border-[#E5252A]/40 hover:shadow-sm'
        }`}
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F5F5F5] dark:bg-gray-800 flex-shrink-0 flex items-center justify-center border border-[#E5E5E5]/60 dark:border-gray-700">
          <img
            src={item.image || '/placeholder.png'}
            alt={item.name || 'Result'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.png';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isProduct
                ? 'bg-[#E5252A]/10 text-[#E5252A]'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              <Tag className="w-2.5 h-2.5" />
              {item.type || 'Item'}
            </span>
            {item.category && (
              <span className="text-[11px] text-[#666666] dark:text-gray-400 truncate">
                • {item.category}
              </span>
            )}
          </div>
          <div className={`text-sm font-semibold truncate transition-colors ${
            darkMode ? 'text-white group-hover:text-[#E5252A]' : 'text-[#151515] group-hover:text-[#E5252A]'
          }`}>
            {item.name || 'Untitled'}
          </div>
          {item.price !== undefined && (
            <div className="text-xs font-bold text-[#E5252A] mt-1 font-mono">
              {Number(item.price).toLocaleString()} RWF
            </div>
          )}
        </div>
        <div className="flex-shrink-0 text-gray-400 group-hover:text-[#E5252A] transition-colors pr-1">
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>
    );
  };

  return (
    <div className={`min-h-screen py-6 px-4 sm:px-6 lg:px-8 transition-colors ${
      darkMode ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'
    }`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          badge="Discovery"
          title={q ? `Search: "${q}"` : 'Marketplace Search'}
          subtitle={q ? `Displaying matching products and services across HafiConnect` : 'Enter a query to discover products, services, and shops'}
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Search' }]}
        />

        {loading && (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#E5252A] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-gray-400 mt-3">
              Searching marketplace...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-[#E5252A] text-sm font-medium">
            {error}
          </div>
        )}

        {!loading && !error && q && results.length === 0 && (
          <div className={`p-12 rounded-2xl border text-center ${
            darkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-[#E5E5E5] text-[#666666]'
          }`}>
            <SearchIcon className="w-10 h-10 text-gray-400 mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-[#151515] dark:text-white uppercase tracking-tight">No results found</h3>
            <p className="text-xs mt-1 max-w-sm mx-auto">
              We couldn't find any listings matching "{q}". Try searching with different keywords.
            </p>
          </div>
        )}

        {products.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#E5252A]" />
                Products ({products.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map(renderItem)}
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Services ({services.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map(renderItem)}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400">
                Other Results ({others.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {others.map(renderItem)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
