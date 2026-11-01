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
  ChevronDown,
  Store,
  Truck,
  Flame
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../api/apiClient';


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

// Modern AliExpress / Amazon style Shop Product Card
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
  const ratingValue = product.rating || 4.9;
  const originalPrice = Math.round(product.price * 1.22);

  return (
    <div
      className={`group cursor-pointer overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg flex flex-col h-full ${
        darkMode ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' : 'bg-white border border-gray-100 hover:border-gray-200'
      } shadow-sm`}
      onClick={(e) => {
        e.stopPropagation();
        onView(product.id);
      }}
    >
      {/* Image section with 1:1 Aspect Ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-gray-800/60 rounded-t-xl flex items-center justify-center">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}

        {/* Floating Quick Add-To-Cart Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(product.id);
          }}
          title="View product details"
          className="absolute bottom-2 right-2 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-md hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>

        {/* Top Badges */}
        {product.shopping_type_name ? (
          <div className="absolute top-2 left-2 z-10 bg-black/80 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
            <Store className="w-2.5 h-2.5 text-amber-400" />
            <span>{product.shopping_type_name}</span>
          </div>
        ) : (
          <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider rounded flex items-center gap-0.5 shadow-sm">
            <Flame className="w-2.5 h-2.5" />
            PREMIUM
          </div>
        )}

        {product.fileType === 'video' && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-medium bg-black/60 text-white rounded">
            🎥 Video
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Choice Tag + Title */}
          <div className="flex items-start gap-1.5">
            <h3 className={`text-xs sm:text-sm font-semibold text-black dark:text-white line-clamp-2 h-9 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors`}>
              <span className="inline-block bg-amber-100 text-black dark:bg-amber-950 dark:text-amber-200 text-[9px] font-bold px-1.5 py-0.2 mr-1 rounded align-middle">
                Top Brand
              </span>
              {product.title}
            </h3>
          </div>

          {/* Rating & Sold count */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-black/85 dark:text-gray-200 mt-1.5">
            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {ratingValue}
            </span>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <span className="text-black/85 dark:text-gray-200">Verified Shop</span>
          </div>
        </div>

        {/* Pricing & Trust Perks (Red Deal Price + Green Free Delivery) */}
        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-red-600 dark:text-red-500 tracking-tight font-sans">
              FRw {product.price.toLocaleString()}
            </span>
            <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400 line-through">
              FRw {originalPrice.toLocaleString()}
            </span>
          </div>

          {/* Trust Incentive Perk */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            <Truck className="w-3 h-3 flex-shrink-0" />
            <span>Fast Dispatch</span>
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
        <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-black'} uppercase flex items-center gap-2`}>
              <Store className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              Explore Premium Shops and Exceptional Products
            </h1>
            <p className={`text-sm sm:text-base font-normal ${darkMode ? 'text-gray-200' : 'text-black'} mt-2.5 leading-relaxed max-w-4xl`}>
              Discover a curated shopping experience through HafiConnect Premium Shops. Explore shops offering quality fashion, clothing, shoes, jewelry, handbags, accessories, beauty products, and lifestyle items. Browse shop collections, discover products that match your style, and connect directly with retailers to ask questions or make purchases. Whether you are looking for everyday elegance or something special, find shops and products that meet your preferences.
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
