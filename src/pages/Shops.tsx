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
  ChevronDown,
  Store
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export interface ShopCategory {
  id: string;
  name: string;
  key?: string;
}

interface Product {
  id: string;
  category_id: string;
  shopping_type_id?: string;
  shopping_type_name?: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  views: string[];
  mediaFiles?: Array<{ url: string; type: 'image' | 'video' }>;
  fileType?: 'image' | 'video' | 'mixed';
  rating?: number;
  createdAt?: string;
}

const getUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}/${path.replace(/^\/+/, '')}`;
};

function ShopProductCard({
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
      className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-white'} border-0 shadow-sm`}
      style={{ borderRadius: '2px' }}
       onClick={(e) => {
                e.stopPropagation();
                onView(product.id);
              }}
      
    >
      {/* Image section */}
      <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
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
        {/* Shop Category Label badge */}
        {product.shopping_type_name && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-600/90 text-white shadow-sm flex items-center gap-1" style={{ borderRadius: '2px' }}>
            {/* <Store className="w-2.5 h-2.5" />
            <span>{product.shopping_type_name}</span> */}
          </div>
        )}
      </div>

      {/* Content */}
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

export default function ShopsPage() {
  const { darkMode } = useDarkMode();
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'newest'>('popular');
  const [showFilters, setShowFilters] = useState(true);

  // Auto-scroll refs
  const categoryStripRef = useRef<HTMLDivElement | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalViews, setModalViews] = useState<string[]>([]);
  const [modalViewIndex, setModalViewIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const navigate = useNavigate();

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter(product => {
        if (!selectedCategory) return true;
        // Check if seller's shopping_type_id matches
        return String(product.shopping_type_id) === String(selectedCategory.id);
      })
      .filter(product => {
        if (!selectedProductCategory) return true;
        if (selectedProductCategory === "uncategorized") {
          return !product.category_id || product.category_id === "uncategorized" || product.category_id === "null";
        }
        return String(product.category_id) === String(selectedProductCategory);
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
  }, [products, selectedCategory, selectedProductCategory, searchQuery, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(product => {
      const key = String(product.shopping_type_id || '');
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [products]);

  const fetchData = async () => {
    setLoadingCats(true);
    setLoadingProducts(true);
    try {
      const [catsRes, productsRes, prodCatsRes] = await Promise.all([
        fetch(`${API_BASE}/api/shopping-types`),
        fetch(`${API_BASE}/api/shops/products`),
        fetch(`${API_BASE}/api/upload/categories?type=product`),
      ]);

      const catsData = catsRes.ok ? await catsRes.json() : { shopping_types: [] };
      const productsData = productsRes.ok ? await productsRes.json() : { products: [] };
      const prodCatsData = prodCatsRes.ok ? await prodCatsRes.json() : { uploadCategories: [] };

      // Exclude 'other' products shop category from filters
      const rawCats = Array.isArray(catsData.shopping_types) ? catsData.shopping_types : [];
      const filteredCats = rawCats.filter((cat: any) => cat.key !== 'other' && !cat.name.toLowerCase().includes('other'));

      setCategories(filteredCats);
      setProductCategories(prodCatsData.uploadCategories || []);

      const normalizedProducts = Array.isArray(productsData.products)
        ? productsData.products.map((p: any) => ({
            id: String(p.id),
            category_id: String(p.category_id || ''),
            shopping_type_id: String(p.shopping_type_id || ''),
            shopping_type_name: p.shopping_type_name || '',
            title: p.title || '',
            description: p.description || '',
            price: Number(p.price || 0),
            image_url: p.image_url || '',
            views: Array.isArray(p.views) ? p.views : [],
            mediaFiles: Array.isArray(p.mediaFiles) ? p.mediaFiles : [],
            fileType: p.fileType || 'image',
            rating: p.rating,
            createdAt: p.createdAt || p.created_at || undefined,
          }))
        : [];

      setProducts(normalizedProducts);
    } catch (err) {
      console.error("Failed to load Shops data:", err);
      setCategories([]);
      setProductCategories([]);
      setProducts([]);
    } finally {
      setLoadingCats(false);
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category horizontal scroll effect
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

  const handleCategorySelect = (cat: ShopCategory | null) => {
    setSelectedCategory(cat);
    setShowFilters(false);
  };

  const handleFilterToggle = () => {
    if (showFilters) {
      clearFilters();
    }
    setShowFilters((prev) => !prev);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedProductCategory(null);
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-55'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'} uppercase flex items-center gap-2`}>
              <Store className="w-6 h-6 text-emerald-500" />
              Shops
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Explore products direct from registered seller shops
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFilterToggle}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'} border border-transparent shadow-sm`}
              style={{ borderRadius: '2px' }}
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className={` p-4 mb-6 shadow-sm ${darkMode ? 'bg-gray-950' : 'bg-white'}`} style={{ borderRadius: '2px' }}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-sm border ${darkMode ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-250 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-emerald-500`}
                  style={{ borderRadius: '2px' }}
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-3 py-2 text-sm border ${darkMode ? 'bg-gray-950 border-gray-700 text-white' : 'bg-gray-50 border-gray-250 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer`}
                  style={{ borderRadius: '2px' }}
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest Products</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                <select
                  value={selectedCategory?.id || ''}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const cat = categories.find(c => String(c.id) === catId);
                    setSelectedCategory(cat || null);
                  }}
                  className={`px-3 py-2 text-sm border ${darkMode ? 'bg-gray-950 border-gray-700 text-white' : 'bg-gray-50 border-gray-250 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer`}
                  style={{ borderRadius: '2px' }}
                >
                  <option value="">All Shop Types</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({categoryCounts[cat.id] || 0})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedProductCategory || ''}
                  onChange={(e) => {
                    setSelectedProductCategory(e.target.value || null);
                  }}
                  className={`px-3 py-2 text-sm border ${darkMode ? 'bg-gray-950 border-gray-700 text-white' : 'bg-gray-50 border-gray-250 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer`}
                  style={{ borderRadius: '2px' }}
                >
                  <option value="">All Product Categories</option>
                  <option value="uncategorized">Uncategorised</option>
                  {productCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {(selectedCategory || selectedProductCategory || searchQuery || sortBy !== 'popular') && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-600 whitespace-nowrap"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Categories strip */}
        <div className="mb-6 w-full overflow-hidden">
          <div
            ref={categoryStripRef}
            className="flex w-full max-w-full items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              onClick={() => handleCategorySelect(null)}
              className={`flex shrink-0 items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border shadow-sm ${!selectedCategory
                  ? darkMode ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-emerald-500 border-emerald-500 text-white'
                  : darkMode ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              style={{ borderRadius: '2px' }}
            >
              All Shops
              <span className="text-[10px] opacity-80">({products.length})</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`flex shrink-0 items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border shadow-sm ${selectedCategory?.id === cat.id
                    ? darkMode ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-emerald-500 border-emerald-500 text-white'
                    : darkMode ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-55'
                  }`}
                style={{ borderRadius: '2px' }}
              >
                {cat.name}
                <span className="text-[10px] opacity-80">({categoryCounts[cat.id] || 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        {loadingProducts ? (
          <div className="py-16">
            <LoadingSpinner size="lg" message="Loading shop products..." variant="dots" />
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 border dark:border-gray-700" style={{ borderRadius: '2px' }}>
            <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`} style={{ borderRadius: '2px' }}>
              <Store className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className={`text-base font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No products available
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              There are no products listed under this shop category.
            </p>
            {(selectedCategory || searchQuery) && (
              <button
                onClick={clearFilters}
                className="mt-4 bg-emerald-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-colors"
                style={{ borderRadius: '2px' }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredAndSortedProducts.map((product) => (
              <ShopProductCard
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
