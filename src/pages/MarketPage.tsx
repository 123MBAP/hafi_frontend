import { useDarkMode } from "@/context/DarkMode";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  ChevronRight,

  Grid3X3,
  List,
  Menu,
  Search,
  ShoppingCart,
  Star,
  X,
  Filter,
  ChevronDown
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export interface MarketProductCat {
  id: string;
  name: string;
  description: string;
  image_url?: string;
}

interface Product {
  id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  views: string[];
  mediaFiles?: Array<{ url: string; type: 'image' | 'video' }>;
  fileType?: 'image' | 'video' | 'mixed';
  rating?: number;
  createdAt?: string;
  providerId?: string;
}

const getUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}/${path.replace(/^\/+/, '')}`;
};

// Small width product card component
function MarketProductCard({
  product,
  darkMode,
  onOpen,
  onView,
}: {
  product: Product;
  darkMode: boolean;
  onOpen: (product: Product, startAtVideo?: boolean) => void;
  onView: (id: string) => void;
}) {
  const mainImage = getUrl(product.image_url);

  return (
    <div
      className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} border-0 shadow-sm`}
      style={{ borderRadius: '2px' }}
        onClick={(e) => {
                e.stopPropagation();
                onView(product.id);
              }}
    >
      {/* Image section - fixed height for consistency */}
      <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
        {product.fileType === 'video' && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white" style={{ borderRadius: '2px' }}>
            🎥 Video
          </div>
        )}
      </div>

      {/* Content - compact */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className={`text-sm font-semibold line-clamp-1 mb-1 ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors`}>
          {product.title}
        </h3>
        
        <p className={`text-xs line-clamp-2 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {product.description}
        </p>

        <div className="mt-auto">
          <div className={`text-lg font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
            RWF {product.price.toLocaleString()}
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-400">
            
              {product.rating && (
                <span className="flex items-center gap-0.5 ml-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {product.rating}
                </span>
              )}
            </div>
       
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketWithCategoryProducts() {
  const { darkMode } = useDarkMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterProviderId = searchParams.get("providerId");
  const [filterProviderName, setFilterProviderName] = useState<string | null>(null);

  const [categories, setCategories] = useState<MarketProductCat[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<MarketProductCat | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'newest'>('popular');
  const [showFilters, setShowFilters] = useState(false);

  // Auto-scroll refs
  const categoryStripRef = useRef<HTMLDivElement | null>(null);

  // Fetch provider name if filtered
  useEffect(() => {
    if (filterProviderId) {
      fetch(`${API_BASE}/api/providers/${filterProviderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setFilterProviderName(data.name || data.email?.split('@')[0] || 'Provider');
          }
        })
        .catch((err) => console.error("Error fetching provider info:", err));
    } else {
      setFilterProviderName(null);
    }
  }, [filterProviderId]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalViews, setModalViews] = useState<string[]>([]);
  const [modalViewIndex, setModalViewIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  function useQuery() {
    return new URLSearchParams(useLocation().search);
  }

  const query = useQuery();
  const categoryIdFromQuery = query.get("categoryId");
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preSelectedCategoryId = queryParams.get("categoryId");

  const filteredAndSortedProducts = useMemo(() => {
    const categoryId = selectedCategory ? String(selectedCategory.id) : '';

    return products
      .filter(product => !categoryId || String(product.category_id) === categoryId)
      .filter(product => {
        if (filterProviderId && String(product.providerId) !== String(filterProviderId)) {
          return false;
        }
        return true;
      })
      .filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'newest':
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          case 'popular':
          default:
            return (b.views?.length || 0) - (a.views?.length || 0);
        }
      });
  }, [products, selectedCategory, searchQuery, sortBy, filterProviderId]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(product => {
      const key = String(product.category_id || '');
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [products]);

  const fetchInitialData = async () => {
    setLoadingCats(true);
    setLoadingProducts(true);
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/api/upload/categories?type=product`),
        fetch(`${API_BASE}/api/marketPage/products`),
      ]);

      const categoriesData = categoriesRes.ok
        ? await categoriesRes.json()
        : { uploadCategories: [] };

      const productsData = productsRes.ok
        ? await productsRes.json()
        : { products: [] };

      const normalizedCategories = Array.isArray(categoriesData.uploadCategories)
        ? categoriesData.uploadCategories.map((cat: any) => ({
            id: String(cat.id),
            name: cat.name,
            description: cat.description || '',
            image_url: cat.image_url || '',
          }))
        : [];

      const normalizedProducts = Array.isArray(productsData.products)
        ? productsData.products.map((product: any) => ({
            id: String(product.id),
            category_id: String(product.category_id || ''),
            title: product.title || '',
            description: product.description || '',
            price: Number(product.price || 0),
            image_url: product.image_url || '',
            views: Array.isArray(product.views) ? product.views : [],
            mediaFiles: Array.isArray(product.mediaFiles) ? product.mediaFiles : [],
            fileType: product.fileType || 'image',
            rating: product.rating,
            createdAt: product.createdAt || product.created_at || undefined,
            providerId: product.providerId || product.provider_id || product.seller_id || undefined,
          }))
        : [];

      setCategories(normalizedCategories);
      setProducts(normalizedProducts);

      const initialCategoryId = categoryIdFromQuery || preSelectedCategoryId;
      if (initialCategoryId) {
        const matchedCat = normalizedCategories.find((cat: MarketProductCat) => String(cat.id) === String(initialCategoryId));
        setSelectedCategory(matchedCat || null);
      } else {
        setSelectedCategory(null);
      }
    } catch {
      setCategories([]);
      setProducts([]);
      setSelectedCategory(null);
    } finally {
      setLoadingCats(false);
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [categoryIdFromQuery, preSelectedCategoryId]);

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

  const handleCategorySelect = (cat: MarketProductCat | null) => {
    setSelectedCategory(cat);
    setShowMobileSidebar(false);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setSortBy('popular');
  };

  const isVideo = (url: string) => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') ||
      lowerUrl.includes('.avi') || lowerUrl.includes('.webm');
  };

  const openModal = (product: Product, startAtVideo: boolean = false) => {
    const videoUrls: string[] = [];
    if ((product.fileType === 'mixed' || product.fileType === 'video') && Array.isArray(product.mediaFiles)) {
      product.mediaFiles.forEach((media) => {
        if (media.type === 'video') {
          videoUrls.push(media.url);
        }
      });
    }

    const views = Array.isArray(product.views) ? product.views : [];
    const allMedia = [product.image_url, ...views, ...videoUrls];
    const images = allMedia.filter(url => !isVideo(url));
    const videos = allMedia.filter(url => isVideo(url));
    const orderedMedia = [...images, ...videos];

    setModalViews(orderedMedia);
    let startIndex = 0;
    if (startAtVideo && videos.length > 0) {
      startIndex = orderedMedia.indexOf(videos[0]);
    }
    setModalViewIndex(startIndex);
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalViews([]);
    setModalViewIndex(0);
    setSelectedProduct(null);
  };

  const nextView = () => {
    if (modalViews.length > 0) {
      setModalViewIndex((prev) => (prev + 1) % modalViews.length);
    }
  };

  const prevView = () => {
    if (modalViews.length > 0) {
      setModalViewIndex((prev) => (prev - 1 + modalViews.length) % modalViews.length);
    }
  };

  // Compact Filters Panel - Single row
  const FiltersPanel = () => (
    <div className={`border-0 shadow-sm mb-4 overflow-x-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ borderRadius: '2px' }}>
      <div className="p-3 min-w-max flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
        </div>

        {/* Search inline */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-8 pr-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:ring-1 focus:ring-emerald-500 w-44`}
            style={{ borderRadius: '2px' }}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className={`px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer flex-shrink-0`}
          style={{ borderRadius: '2px' }}
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>

        {/* Category quick select */}
        <select
          value={selectedCategory?.id || ''}
          onChange={(e) => {
            const catId = e.target.value;
            const cat = categories.find(c => String(c.id) === catId);
            setSelectedCategory(cat || null);
          }}
          className={`px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer flex-shrink-0`}
          style={{ borderRadius: '2px' }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({categoryCounts[cat.id] || 0})
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {(selectedCategory || searchQuery || sortBy !== 'popular') && (
          <button
            onClick={clearFilters}
            className="text-xs text-emerald-500 hover:text-emerald-600 whitespace-nowrap flex-shrink-0"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );

  // Auto-scrolling Category chips row (marquee effect)
  const CategoryChips = () => (
    <div className="mb-4 w-full overflow-hidden">
      <div
        ref={categoryStripRef}
        className="flex w-full max-w-full items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          onClick={() => handleCategorySelect(null)}
          className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors shadow-sm ${!selectedCategory
              ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
              : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          style={{ borderRadius: '2px' }}
        >
          All
          <span className="text-xs opacity-80">({products.length})</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat)}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors shadow-sm ${selectedCategory?.id === cat.id
                ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            style={{ borderRadius: '2px' }}
          >
            {cat.name}
            <span className="text-xs opacity-80">({categoryCounts[cat.id] || 0})</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Mobile Overlay
  const MobileOverlay = () => (
    showMobileSidebar && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
        onClick={() => setShowMobileSidebar(false)}
      />
    )
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'} uppercase`}>
            Market
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {filteredAndSortedProducts.length} products available
          </p>
        </div>

        {/* Provider Filter Banner */}
        {filterProviderId && (
          <div className={`mb-6 p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            darkMode 
              ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`} style={{ borderRadius: '2px' }}>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Showing products by:</span>
              <span className="font-bold underline text-emerald-600 dark:text-emerald-400">
                {filterProviderName || 'Loading...'}
              </span>
            </div>
            <button
              onClick={() => setSearchParams({})}
              className={`text-xs px-3 py-1.5 font-bold transition-all border ${
                darkMode
                  ? 'border-emerald-700 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200'
                  : 'border-emerald-300 bg-emerald-100 hover:bg-emerald-200/80 text-emerald-800'
              }`}
              style={{ borderRadius: '2px' }}
            >
              Clear Filter / Show All
            </button>
          </div>
        )}

        {/* Mobile action buttons */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'} shadow-sm`}
            style={{ borderRadius: '2px' }}
          >
            <Menu className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'} shadow-sm`}
            style={{ borderRadius: '2px' }}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Filters'}
          </button>
        </div>

        {/* Filters Panel - Desktop always visible, Mobile toggle */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-4`}>
          <FiltersPanel />
        </div>

        {/* Auto-scrolling Category Chips */}
        <CategoryChips />

        {/* Products Grid - Small width cards, equal sizes */}
        {loadingProducts ? (
          <div className="py-16">
            <LoadingSpinner size="lg" message="Loading products..." variant="dots" />
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ borderRadius: '2px' }}>
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className={`text-base font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No products found
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Try adjusting your search or category filter
            </p>
            <button
              onClick={clearFilters}
              className={`mt-4 px-4 py-2 text-sm ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} shadow-sm`}
              style={{ borderRadius: '2px' }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
            {filteredAndSortedProducts.map((product) => (
              <MarketProductCard
                key={product.id}
                product={product}
                darkMode={darkMode}
                onOpen={openModal}
                onView={(id) => navigate(`/product/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className={`absolute left-0 top-0 bottom-0 w-72 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-base">Categories</h2>
              <button onClick={() => setShowMobileSidebar(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 space-y-1">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${!selectedCategory
                    ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                style={{ borderRadius: '2px' }}
              >
                All Products ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${selectedCategory?.id === cat.id
                      ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                      : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  style={{ borderRadius: '2px' }}
                >
                  {cat.name} ({categoryCounts[cat.id] || 0})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing images/videos */}
      {modalOpen && selectedProduct && modalViews.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-5xl max-h-[95vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 transition-all bg-white hover:bg-gray-100 shadow-lg"
              style={{ borderRadius: '2px' }}
            >
              <X className="w-5 h-5" />
            </button>

            {modalViews.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 transition-all"
                  style={{ borderRadius: '2px' }}
                  onClick={(e) => { e.stopPropagation(); prevView(); }}
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 transition-all"
                  style={{ borderRadius: '2px' }}
                  onClick={(e) => { e.stopPropagation(); nextView(); }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="bg-black overflow-hidden shadow-2xl max-w-full max-h-full">
              {(() => {
                const currentUrl = modalViews[modalViewIndex];
                const isVideoUrl = selectedProduct.fileType === 'video' ||
                  currentUrl.toLowerCase().includes('.mp4') ||
                  currentUrl.toLowerCase().includes('.mov');

                return isVideoUrl ? (
                  <video
                    className="max-w-[90vw] max-h-[80vh] w-auto h-auto"
                    src={currentUrl}
                    controls
                    autoPlay={false}
                    preload="metadata"
                    style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={currentUrl}
                    alt={selectedProduct.title}
                    className="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain"
                  />
                );
              })()}
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 backdrop-blur-sm" style={{ borderRadius: '2px' }}>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-medium">{selectedProduct.title}</span>
                {modalViews.length > 1 && (
                  <span className="text-gray-300">
                    {modalViewIndex + 1} / {modalViews.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}