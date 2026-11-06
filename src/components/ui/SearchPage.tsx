import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Briefcase, ChevronRight, Star, Eye } from 'lucide-react';

type SearchItem = {
  id: number | string;
  type?: 'product' | 'service' | string;
  name?: string;
  image?: string;
  price?: number | string;
  category?: string;
  slug?: string;
  rating?: number;
  views?: number;
  [key: string]: any;
};

interface SearchResultsProps {
  results?: SearchItem[];
  onResultClick?: () => void;
  darkMode?: boolean;
  searchQuery?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results = [],
  onResultClick,
  darkMode = false,
  searchQuery = '',
}) => {
  const safeResults = Array.isArray(results) ? results : [];

  if (!safeResults.length) {
    return (
      <div
        className="absolute top-full left-0 right-0 mt-1 shadow-lg border border-red-600 z-50 overflow-hidden"
        style={{ borderRadius: '2px' }}
      >
        <div className="p-4 text-center text-sm bg-black text-white/70">
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>No results found{searchQuery ? ` for "${searchQuery}"` : ''}</span>
          </div>
        </div>
      </div>
    );
  }

  const products = safeResults.filter(item => item.type === 'product');
  const services = safeResults.filter(item => item.type === 'service');
  const others = safeResults.filter(item => item.type !== 'product' && item.type !== 'service');

  const renderItem = (item: SearchItem) => {
    let to = item.slug ? `/${item.type}/${item.slug}` : `/${item.type}/${item.id}`;
    if (item.type === 'product') {
      to = `/market?categoryId=${encodeURIComponent(String(item.id))}`;
    } else if (item.type === 'service') {
      to = `/services/${encodeURIComponent(String(item.id))}`;
    }
    
    const randomRating = item.rating || (3.5 + Math.random() * 1.5).toFixed(1);
    const randomViews = item.views || Math.floor(Math.random() * 5000);
    
    return (
      <Link
        key={item.id}
        to={to}
        onClick={onResultClick}
        className="flex items-center gap-3 px-3 py-2.5 transition-colors group bg-black hover:bg-red-950"
      >
        {/* Image - small fixed width */}
        <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-black border border-red-900" style={{ borderRadius: '2px' }}>
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {item.type === 'product' ? (
                <Package className="w-4 h-4 text-red-600" />
              ) : (
                <Briefcase className="w-4 h-4 text-red-600" />
              )}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-medium text-white">
              {item.name || 'Untitled'}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            {item.price !== undefined && (
              <span className="text-xs font-semibold text-red-500">
                RWF {Number(item.price).toLocaleString()}
              </span>
            )}
            <span className="text-xs text-red-600">•</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-red-500 text-red-500" />
              <span className="text-xs text-white/60">{randomRating}</span>
            </div>
            <span className="text-xs text-red-600">•</span>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-red-600" />
              <span className="text-xs text-white/60">{randomViews.toLocaleString()}</span>
            </div>
          </div>
          
          {item.category && (
            <div className="mt-1">
              <span className="text-xs px-1.5 py-0.5 bg-red-950 text-red-300" style={{ borderRadius: '2px' }}>
                {item.category}
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  };

  const SectionHeader = ({ title, icon: Icon, count }: { title: string; icon: React.ElementType; count: number }) => (
    <div className="px-3 py-2 border-b border-red-900 bg-black">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-red-600" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
          {title}
        </span>
        <span className="text-xs px-1.5 py-0.5 bg-red-950 text-red-300" style={{ borderRadius: '2px' }}>
          {count}
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="absolute top-full left-0 right-0 mt-1 shadow-lg border border-red-600 z-50 overflow-hidden"
      style={{ borderRadius: '2px' }}
    >
      <div className="bg-black max-h-96 overflow-y-auto">
        {products.length > 0 && (
          <div>
            <SectionHeader title="Products" icon={Package} count={products.length} />
            {products.map(renderItem)}
          </div>
        )}

        {services.length > 0 && (
          <div>
            <SectionHeader title="Services" icon={Briefcase} count={services.length} />
            {services.map(renderItem)}
          </div>
        )}

        {others.length > 0 && (
          <div>
            <SectionHeader title="Other" icon={Briefcase} count={others.length} />
            {others.map(renderItem)}
          </div>
        )}

        {/* Footer hint */}
        <div className="px-3 py-2 text-center border-t border-red-900 text-xs text-white/50 bg-black">
          Press Enter to see all results
        </div>
      </div>
    </div>
  );
};

export default SearchResults;