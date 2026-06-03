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
        className={`absolute top-full left-0 right-0 mt-1 shadow-sm border-0 z-50 overflow-hidden`}
        style={{ borderRadius: '2px' }}
      >
        <div className={`p-4 text-center text-sm ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className={`flex items-center gap-3 px-3 py-2.5 transition-colors group ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
      >
        {/* Image - small fixed width */}
        <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-100 dark:bg-gray-700" style={{ borderRadius: '2px' }}>
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {item.type === 'product' ? (
                <Package className="w-4 h-4 text-gray-400" />
              ) : (
                <Briefcase className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-medium dark:text-white text-gray-900">
              {item.name || 'Untitled'}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            {item.price !== undefined && (
              <span className={`text-xs font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                RWF {Number(item.price).toLocaleString()}
              </span>
            )}
            <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{randomRating}</span>
            </div>
            <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-gray-400" />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{randomViews.toLocaleString()}</span>
            </div>
          </div>
          
          {item.category && (
            <div className="mt-1">
              <span className={`text-xs px-1.5 py-0.5 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`} style={{ borderRadius: '2px' }}>
                {item.category}
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  };

  const SectionHeader = ({ title, icon: Icon, count }: { title: string; icon: React.ElementType; count: number }) => (
    <div className={`px-3 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-emerald-500" />
        <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {title}
        </span>
        <span className={`text-xs px-1.5 py-0.5 ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`} style={{ borderRadius: '2px' }}>
          {count}
        </span>
      </div>
    </div>
  );

  return (
    <div
      className={`absolute top-full left-0 right-0 mt-1 shadow-lg border-0 z-50 overflow-hidden`}
      style={{ borderRadius: '2px' }}
    >
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-96 overflow-y-auto`}>
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
        <div className={`px-3 py-2 text-center border-t text-xs ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
          Press Enter to see all results
        </div>
      </div>
    </div>
  );
};

export default SearchResults;