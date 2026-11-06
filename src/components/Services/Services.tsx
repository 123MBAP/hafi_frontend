// Services.tsx
import type { Category, Service } from '@/api/types';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import SearchBar from '@/components/ui/SearchBar';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import { useDarkMode } from '@/context/DarkMode';
import { cachedFetch } from '@/utils/cachedFetch';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Filter, X, Search } from 'lucide-react';
import ServiceCard from './ServiceCard';
import { API_BASE } from '../../api/apiClient';


export default function Services() {
  const { darkMode } = useDarkMode();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const categoryStripRef = useRef<HTMLDivElement | null>(null);

  // Prevent automatic scrolling to comments on page load
  useEffect(() => {
    if (window.location.hash === '#comments') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Auto-scroll animation for categories
  useEffect(() => {
    const container = categoryStripRef.current;
    if (!container || categories.length <= 2) return;

    let frame = 0;
    const speed = 0.6;

    const step = () => {
      if (!container) return;
      container.scrollLeft += speed;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
        container.scrollLeft = 0;
      }
      frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [categories.length]);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cachedFetch<{ services?: Service[] }>(`${API_BASE}/api/services`);
      setServices(data.services || []);
    } catch (err) {
      setError('Network error. Failed to fetch services.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await cachedFetch<{ uploadCategories?: Category[] }>(`${API_BASE}/api/upload/categories?type=service`);
      setCategories(data.uploadCategories || []);
    } catch (err) {
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? service.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const servicesPerPage = 24;
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * servicesPerPage,
    currentPage * servicesPerPage
  );

  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategory(categoryId ?? null);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== null;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Editorial Header */}
        <PageHeader
          title="Services Directory"
          subtitle="Discover verified service providers, technicians, creative experts, and professionals across Rwanda."
          badge={
            <Badge variant="red-subtle">
              {filteredServices.length} Services
            </Badge>
          }
          darkMode={darkMode}
        />

        {/* Search & Category Filter Controls */}
        <div className={`p-3 sm:p-4 rounded-xl border mb-5 transition-colors ${
          darkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-[#F5F5F5] border-[#E5E5E5]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services by title or description..."
                className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border outline-none transition-all ${
                  darkMode
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#E5252A]'
                    : 'bg-white border-gray-200 text-[#151515] placeholder-gray-400 focus:border-[#E5252A]'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {showFilters ? 'Hide' : 'Categories'}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-[#E5252A] hover:underline"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-6`}>
          <div className="w-full overflow-hidden">
            <div
              ref={categoryStripRef}
              className="flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <button
                onClick={() => handleCategoryChange(undefined)}
                className={`flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !selectedCategory
                    ? 'bg-[#E5252A] text-white shadow-sm'
                    : darkMode
                    ? 'bg-zinc-900 border border-zinc-800 text-gray-300 hover:text-white'
                    : 'bg-white border border-gray-200 text-[#151515] hover:border-gray-300'
                }`}
              >
                All Services
                <span className={`text-[10px] ${!selectedCategory ? 'text-white/90' : 'text-gray-400'}`}>
                  ({services.length})
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#E5252A] text-white shadow-sm'
                      : darkMode
                      ? 'bg-zinc-900 border border-zinc-800 text-gray-300 hover:text-white'
                      : 'bg-white border border-gray-200 text-[#151515] hover:border-gray-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16">
            <LoadingSpinner size="lg" message="Loading services..." variant="dots" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => {
              fetchServices();
              setCurrentPage(1);
            }}
          />
        )}

        {/* Services Grid */}
        {!loading && !error && (
          <>
            {paginatedServices.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
                  {paginatedServices.map((service) => (
                    <Link
                      to={`/services/${service.id}`}
                      key={service.id}
                      className="block transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <ServiceCard service={service} darkMode={darkMode} />
                    </Link>
                  ))}
                </div>

                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredServices.length}
                    itemsPerPage={servicesPerPage}
                    onPageChange={setCurrentPage}
                    className="mt-8"
                    darkMode={darkMode}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-black' : 'bg-white'} border border-black dark:border-white`} style={{ borderRadius: '2px' }}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className={`text-base font-bold mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                  No services found
                </h3>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                  Try adjusting your search or category filter
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className={`mt-4 px-4 py-2 text-sm font-bold ${darkMode ? 'bg-black text-white hover:bg-red-600' : 'bg-white text-black hover:bg-red-600 hover:text-white'} border border-black dark:border-white shadow-sm`}
                    style={{ borderRadius: '2px' }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}