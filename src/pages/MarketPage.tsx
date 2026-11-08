import { useDarkMode } from "@/context/DarkMode";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import {
  ChevronRight,
  Grid3X3,
  List,
  Menu,
  Search,
  ShoppingCart,
  X,
  Filter,
  ChevronDown
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../api/apiClient';
import { fetchEdgeProducts } from '../api/workerClient';


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
  used?: boolean;
  pricingUnit?: string;
  pricing_unit?: string;
  inStock?: boolean;
}

const getUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}/${path.replace(/^\/+/, '')}`;
};

// Premium Market Product Card
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
      className={`group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full ${
        darkMode ? 'bg-zinc-900 border border-zinc-800 hover:border-[#E5252A]' : 'bg-white border border-gray-200 hover:border-[#E5252A]'
      } shadow-sm`}
      onClick={(e) => {
        e.stopPropagation();
        onView(product.id);
      }}
    >
      {/* Image section with 1:1 Aspect Ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              product.inStock === false ? 'opacity-70' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}

        {/* Floating Quick Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(product.id);
          }}
          title="View product details"
          className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-800 text-black dark:text-white shadow-md hover:bg-[#E5252A] hover:text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>

        {/* Badges on Image */}
        {product.inStock === false ? (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-zinc-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
              Out of stock
            </span>
          </div>
        ) : product.used ? (
          <div className="absolute top-2 left-2 z-10 bg-[#0A0A0A]/85 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
            USED
          </div>
        ) : null}

        {product.fileType === 'video' && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[9px] font-medium bg-black/75 text-white z-10 rounded-full">
            ▶ Video
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className={`text-xs sm:text-[13px] font-semibold text-[#151515] dark:text-white line-clamp-2 leading-snug group-hover:text-[#E5252A] dark:group-hover:text-red-400 transition-colors`}>
            {product.title}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#666666] dark:text-gray-400 line-clamp-2">
            {product.description || 'No description available'}
          </p>
        </div>

        {/* Pricing */}
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-baseline justify-between gap-1 flex-wrap">
          <span className="text-base sm:text-lg font-black text-[#E5252A] tracking-tight">
            FRw {product.price.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-[#E5252A] transition-colors">
            View →
          </span>
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
  const [showFilters, setShowFilters] = useState(true);
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'used'>('all');

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
      .filter(product => {
        if (conditionFilter === 'new') return !product.used;
        if (conditionFilter === 'used') return !!product.used;
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
  }, [products, selectedCategory, searchQuery, sortBy, filterProviderId, conditionFilter]);

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
      const [categoriesRes, edgeProductsData] = await Promise.all([
        fetch(`${API_BASE}/api/upload/categories?type=product`),
        fetchEdgeProducts({ limit: 100 }).catch(async () => {
          const fallback = await fetch(`${API_BASE}/api/marketPage/products`);
          return fallback.ok ? await fallback.json() : { products: [] };
        }),
      ]);

      const categoriesData = categoriesRes.ok
        ? await categoriesRes.json()
        : { uploadCategories: [] };

      const productsData = edgeProductsData || { products: [] };

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
            used: product.used === true,
            pricingUnit: product.pricingUnit || 'Per Item / Piece',
            pricing_unit: product.pricing_unit || 'Per Item / Piece',
            inStock: product.inStock !== false && product.in_stock !== false,
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
    setConditionFilter('all');
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

  // Refined Filters Panel on light-grey surface
  const FiltersPanel = () => (
    <div className={`p-3 sm:p-4 rounded-xl border mb-5 transition-colors ${
      darkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-[#F5F5F5] border-[#E5E5E5]'
    }`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Search inline */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border outline-none transition-all ${
              darkMode
                ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#E5252A]'
                : 'bg-white border-gray-200 text-[#151515] placeholder-gray-400 focus:border-[#E5252A]'
            }`}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className={`px-3 py-2 text-xs sm:text-sm rounded-lg border outline-none cursor-pointer ${
            darkMode
              ? 'bg-zinc-950 border-zinc-800 text-white'
              : 'bg-white border-gray-200 text-[#151515]'
          }`}
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
          className={`px-3 py-2 text-xs sm:text-sm rounded-lg border outline-none cursor-pointer ${
            darkMode
              ? 'bg-zinc-950 border-zinc-800 text-white'
              : 'bg-white border-gray-200 text-[#151515]'
          }`}
        >
          <option value="">All Categories ({products.length})</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({categoryCounts[cat.id] || 0})
            </option>
          ))}
        </select>

        {/* Condition selection */}
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value as any)}
          className={`px-3 py-2 text-xs sm:text-sm rounded-lg border outline-none cursor-pointer ${
            darkMode
              ? 'bg-zinc-950 border-zinc-800 text-white'
              : 'bg-white border-gray-200 text-[#151515]'
          }`}
        >
          <option value="all">All Conditions</option>
          <option value="new">Brand New</option>
          <option value="used">Pre-owned</option>
        </select>

        {/* Clear filters */}
        {(selectedCategory || searchQuery || sortBy !== 'popular' || conditionFilter !== 'all') && (
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-[#E5252A] hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );

  // Category chips row
  const CategoryChips = () => (
    <div className="mb-6 w-full overflow-hidden">
      <div
        ref={categoryStripRef}
        className="flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          onClick={() => handleCategorySelect(null)}
          className={`flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
            !selectedCategory
              ? 'bg-[#E5252A] text-white shadow-sm'
              : darkMode
              ? 'bg-zinc-900 border border-zinc-800 text-gray-300 hover:text-white'
              : 'bg-white border border-gray-200 text-[#151515] hover:border-gray-300'
          }`}
        >
          All Items
          <span className={`text-[10px] ${!selectedCategory ? 'text-white/90' : 'text-gray-400'}`}>
            ({products.length})
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat)}
              className={`flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isSelected
                  ? 'bg-[#E5252A] text-white shadow-sm'
                  : darkMode
                  ? 'bg-zinc-900 border border-zinc-800 text-gray-300 hover:text-white'
                  : 'bg-white border border-gray-200 text-[#151515] hover:border-gray-300'
              }`}
            >
              {cat.name}
              <span className={`text-[10px] ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                ({categoryCounts[cat.id] || 0})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Mobile Overlay
  const MobileOverlay = () => (
    showMobileSidebar && (
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
        onClick={() => setShowMobileSidebar(false)}
      />
    )
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Editorial Compact Header */}
        <PageHeader
          title="Marketplace"
          subtitle="Discover and shop electronics, fashion, lifestyle goods, and unique essentials across Rwanda."
          badge={
            <Badge variant="red-subtle">
              {filteredAndSortedProducts.length} Products
            </Badge>
          }
          darkMode={darkMode}
        />

        {/* Provider Filter Banner */}
        {filterProviderId && (
          <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-red-50/50 border-red-200 text-black'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-600 dark:text-gray-400">Showing products by:</span>
              <span className="font-bold text-[#E5252A]">
                {filterProviderName || 'Loading...'}
              </span>
            </div>
            <button
              onClick={() => setSearchParams({})}
              className={`text-xs px-3 py-1.5 font-bold transition-all border rounded-lg ${
                darkMode
                  ? 'border-red-700 bg-red-900/40 hover:bg-red-800/60 text-red-200'
                  : 'border-red-300 bg-red-100 hover:bg-red-200/80 text-red-800'
              }`}
            >
              Clear Filter / Show All
            </button>
          </div>
        )}

        {/* Mobile action buttons */}
        <div className="flex items-center gap-2 mb-4 lg:hidden">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border ${
              darkMode ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-white text-[#151515] border-gray-200'
            } shadow-sm hover:border-[#E5252A]`}
          >
            <Menu className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border ${
              darkMode ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-white text-[#151515] border-gray-200'
            } shadow-sm hover:border-[#E5252A]`}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
        </div>

        {/* Filters Panel - Desktop always visible, Mobile toggle */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-4`}>
          <FiltersPanel />
        </div>

        {/* Category Chips */}
        <CategoryChips />

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="py-20">
            <LoadingSpinner size="lg" message="Loading products..." variant="dots" />
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800 p-8 my-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
              <Search className="w-6 h-6 text-[#E5252A]" />
            </div>
            <h3 className={`text-base font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
              No products found
            </h3>
            <p className={`text-xs sm:text-sm max-w-sm mx-auto ${darkMode ? 'text-gray-400' : 'text-[#666666]'}`}>
              Try relaxing your category selection or search keywords to see more items.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#E5252A] hover:bg-[#C81E23] rounded-lg shadow-sm transition-all"
            >
              Reset All Filters
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
          <div className={`absolute left-0 top-0 bottom-0 w-72 overflow-y-auto ${darkMode ? 'bg-black' : 'bg-white'} border-r border-black dark:border-white shadow-xl`}>
            <div className="p-4 border-b border-black dark:border-white flex justify-between items-center">
              <h2 className="font-bold text-base text-black dark:text-white">Categories</h2>
              <button onClick={() => setShowMobileSidebar(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 space-y-1">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`w-full text-left px-3 py-2 text-sm font-bold transition-colors rounded-lg ${!selectedCategory
                    ? 'bg-red-600 text-white'
                    : darkMode ? 'text-white hover:bg-red-600' : 'text-black hover:bg-red-600 hover:text-white'
                  }`}
              >
                All Products ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`w-full text-left px-3 py-2 text-sm font-bold transition-colors rounded-lg ${selectedCategory?.id === cat.id
                      ? 'bg-red-600 text-white'
                      : darkMode ? 'text-white hover:bg-red-600' : 'text-black hover:bg-red-600 hover:text-white'
                    }`}
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