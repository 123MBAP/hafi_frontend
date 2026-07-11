import { useDarkMode } from "@/context/DarkMode";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MapComponent from "@/components/MapComponent";
import { Search, Filter, MapPin } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const toAbsoluteMediaUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return '';

  let trimmed = String(rawUrl).trim().replace(/\\/g, '/');
  if (!trimmed) return '';

  // Extract nested URL if it's double-prefixed (e.g. http://localhost:5000/https://res.cloudinary.com/...)
  const nestedHttpIndex = trimmed.indexOf('http', 4);
  if (nestedHttpIndex !== -1) {
    trimmed = trimmed.substring(nestedHttpIndex);
  }

  const uploadsIndex = trimmed.toLowerCase().indexOf('uploads/');
  if (uploadsIndex !== -1 && /^https?:\/\//i.test(trimmed)) {
    trimmed = API_BASE + '/' + trimmed.substring(uploadsIndex);
  }

  if (/^(https?:|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${API_BASE}${trimmed}`;
  }

  return `${API_BASE}/${trimmed.replace(/^\/+/, '')}`;
};

interface MadeInRwandaProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  views?: string[];
  mediaFiles?: Array<{ url: string; type: 'image' | 'video' }>;
  fileType?: 'image' | 'video' | 'mixed';
  madeInRwanda?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  providerId?: string | null;
  lat?: number;
  lng?: number;
}

interface Category {
  id: number;
  name: string;
  type: 'product' | 'service';
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Small width product card component
function ProductCard({ product, darkMode, onView }: {
  product: MadeInRwandaProduct;
  darkMode: boolean;
  onView: (id: string) => void;
}) {
  return (
    <div
      className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-white'} border-0 shadow-sm`}
      style={{ borderRadius: '2px' }}
      onClick={(e) => {
        e.stopPropagation();
        onView(product.id);
      }}
    >
      <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          // onClick={() => onOpen(product)}
        />
        <div className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-600 text-white" style={{ borderRadius: '2px' }}>
          Made in Rwanda
        </div>
        {product.fileType === 'video' && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white" style={{ borderRadius: '2px' }}>
            🎥 Video
          </div>
        )}
      </div>

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
   
        </div>
      </div>
    </div>
  );
}

export default function MadeInRwanda() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterProviderId = searchParams.get("providerId");
  const [filterProviderName, setFilterProviderName] = useState<string | null>(null);

  const [products, setProducts] = useState<MadeInRwandaProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high">("popular");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number>(10);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Auto-scroll ref
  const categoryStripRef = useRef<HTMLDivElement | null>(null);

  // Fetch provider info if filtered
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

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/market/made-in-rwanda`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items: any[] = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];

        const normalized: MadeInRwandaProduct[] = items
          .filter((p) => p && (p.madeInRwanda === true || p.made_in_rwanda === true))
          .map((row: any) => {
            const title = row.title || row.image_title || "";
            const description = row.description || row.image_description || "";
            const rawImagePath = row.image_url || row.image_path || "";

            const latitude = row.latitude ?? row.lat ?? row.location_lat ?? (row.location ? row.location.lat : undefined) ?? null;
            const longitude = row.longitude ?? row.lng ?? row.location_lng ?? (row.location ? row.location.lng : undefined) ?? null;

            let views: string[] = [];
            if (Array.isArray(row.views)) {
              views = row.views
                .filter((v: string) => v && String(v).trim())
                .map((v: string) => toAbsoluteMediaUrl(v));
            } else if (typeof row.views === "string" && row.views.length > 0) {
              try {
                const parsed = JSON.parse(row.views);
                if (Array.isArray(parsed))
                  views = parsed
                    .filter((v: any) => v && String(v).trim())
                    .map((v) => toAbsoluteMediaUrl(v));
              } catch { }
            }

            const mediaFiles = Array.isArray(row.mediaFiles)
              ? row.mediaFiles
                  .filter((m: any) => m && m.url)
                  .map((m: any) => ({
                    ...m,
                    url: toAbsoluteMediaUrl(m.url),
                  }))
              : [];

            const image_url = toAbsoluteMediaUrl(rawImagePath);

            // Determine fileType based on available media
            let fileType = row.fileType || 'image';
            if (mediaFiles.some((m: any) => m.type === 'video') && (views.length > 0 || image_url)) {
              fileType = 'mixed';
            } else if (mediaFiles.some((m: any) => m.type === 'video')) {
              fileType = 'video';
            }

            return {
              id: String(row.id || row.image_id || row.product_id || Math.random()),
              title,
              description,
              price: Number(row.price ?? 0),
              image_url,
              views,
              mediaFiles,
              fileType,
              madeInRwanda: true,
              providerId: row.providerId || row.provider_id || row.seller_id || null,
              latitude: latitude !== undefined ? Number(latitude) : null,
              longitude: longitude !== undefined ? Number(longitude) : null,
            } as MadeInRwandaProduct;
          });

        setProducts(normalized);
      } catch (err: any) {
        setError(err.message || "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/upload/categories?type=product`);
        const data = await res.json();
        if (res.ok) {
          setCategories(data.uploadCategories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
    };
    fetchCategories();
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

  const filteredAndSorted = useMemo(() => {
    return products
      .filter((p) => {
        if (!p) return false;

        // Apply providerId query filter if present
        if (filterProviderId && String(p.providerId) !== String(filterProviderId)) {
          return false;
        }

        const title = (p.title || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const q = searchQuery.toLowerCase();
        const cat = selectedCategory.toLowerCase();
        const categoryMatches = cat === "all" || title.includes(cat) || desc.includes(cat);
        return (title.includes(q) || desc.includes(q)) && categoryMatches;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        const aViews = a.views?.length ?? 0;
        const bViews = b.views?.length ?? 0;
        return bViews - aViews;
      });
  }, [products, searchQuery, sortBy, selectedCategory, filterProviderId]);

  const visibleProducts = useMemo(() => {
    if (!nearbyOnly || !userLocation) return filteredAndSorted;
    return filteredAndSorted.filter((p) => {
      const lat = p.latitude ?? p.lat ?? null;
      const lng = p.longitude ?? p.lng ?? null;
      if (lat == null || lng == null) return false;
      const d = haversineKm(userLocation.lat, userLocation.lng, Number(lat), Number(lng));
      return d <= nearbyRadiusKm;
    });
  }, [filteredAndSorted, nearbyOnly, userLocation, nearbyRadiusKm]);

  const markers = useMemo(() => {
    return visibleProducts
      .map((p) => {
        const lat = p.latitude ?? p.lat ?? null;
        const lng = p.longitude ?? p.lng ?? null;
        if (lat == null || lng == null) return null;
        return {
          id: p.id,
          lat: Number(lat),
          lng: Number(lng),
          title: p.title,
          image_url: p.image_url,
          price: p.price,
          productId: p.id,
        };
      })
      .filter((m): m is Exclude<typeof m, null> => m !== null);
  }, [visibleProducts]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not available.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearbyOnly(true);
      },
      (err) => {
        alert("Unable to get location: " + err.message);
      }
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSortBy("popular");
    setNearbyOnly(false);
    setUserLocation(null);
  };

  // Compact Filters Panel
  const FiltersPanel = () => (
    <div className={`border-0 shadow-sm mb-4 overflow-x-auto ${darkMode ? 'bg-gray-950 border border-gray-700' : 'bg-white border border-gray-200'}`} style={{ borderRadius: '2px' }}>
      <div className="p-3 min-w-max flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
        </div>

        <div className="relative flex-shrink-0 outline-0 border border-gray-700 dark:border-gray-700">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-8 pr-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-950 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:ring-1 focus:ring-emerald-500 w-40`}
            style={{ borderRadius: '2px' }}
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className={`px-3 py-1.5 text-sm ${darkMode ? 'bg-gray-950 border border-gray-700 text-white outline-0 border border-gray-700 dark:border-gray-700' : 'bg-gray-100 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer flex-shrink-0`}
          style={{ borderRadius: '2px' }}
        >
          <option value="popular">Most Popular</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>

        <button
          onClick={() => {
            setNearbyOnly(!nearbyOnly);
            if (!nearbyOnly) handleUseMyLocation();
          }}
          className={`px-3 py-1.5 text-sm transition-colors flex-shrink-0 ${nearbyOnly ? 'bg-emerald-600 text-white' : darkMode ? 'bg-gray-950 border border-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
          style={{ borderRadius: '2px' }}
        >
          <MapPin className="w-3.5 h-3.5 inline mr-1" />
          Nearby
        </button>

        {nearbyOnly && (
          <input
            type="number"
            min={1}
            value={nearbyRadiusKm}
            onChange={(e) => setNearbyRadiusKm(Math.max(1, Number(e.target.value || 1)))}
            className={`w-16 px-2 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-950 text-white border border-gray-700' : 'bg-gray-100 text-gray-900'} focus:ring-1 focus:ring-emerald-500 flex-shrink-0`}
            style={{ borderRadius: '2px' }}
          />
        )}

        <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={showMap}
            onChange={(e) => setShowMap(e.target.checked)}
            className="w-3.5 h-3.5 rounded focus:ring-1 focus:ring-emerald-500"
          />
          <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Show Map</span>
        </label>

        {(searchQuery || selectedCategory !== "All" || sortBy !== "popular" || nearbyOnly) && (
          <button onClick={clearFilters} className="text-xs text-emerald-500 hover:text-emerald-600 whitespace-nowrap flex-shrink-0">
            Clear all
          </button>
        )}
      </div>
    </div>
  );

  // Auto-scrolling Category chips
  const CategoryChips = () => (
    <div className="mb-4 w-full overflow-hidden">
      <div
        ref={categoryStripRef}
        className="flex w-full max-w-full items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          onClick={() => setSelectedCategory("All")}
          className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors shadow-sm ${selectedCategory === "All"
              ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
              : darkMode ? 'bg-gray-950 border border-gray-700 text-gray-400 hover:bg-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          style={{ borderRadius: '2px' }}
        >
          All
          <span className="text-xs opacity-80">({products.length})</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors shadow-sm ${selectedCategory === cat.name
                ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                : darkMode ? 'bg-gray-950 border border-gray-700 text-gray-400 hover:bg-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            style={{ borderRadius: '2px' }}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'} uppercase`}>
            Made in Rwanda
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {visibleProducts.length} products proudly made in Rwanda
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

        {/* Mobile filter toggle */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'} shadow-sm`}
            style={{ borderRadius: '2px' }}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Filters'}
          </button>
        </div>

        {/* Filters Panel */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-4`}>
          <FiltersPanel />
        </div>

        {/* Auto-scrolling Categories */}
        <CategoryChips />

        {/* Map */}
        {showMap && markers.length > 0 && (
          <div className="mb-6">
            <div className="h-64 w-full overflow-hidden shadow-sm" style={{ borderRadius: '2px' }}>
              <MapComponent markers={markers} userLocation={userLocation} height="100%" fitToMarkers={true} />
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-16">
            <LoadingSpinner size="lg" message="Loading products..." variant="dots" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className={`p-4 text-sm ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'} text-center`} style={{ borderRadius: '2px' }}>
            Failed to load products: {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visibleProducts.length === 0 && (
          <div className="text-center py-16">
            <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ borderRadius: '2px' }}>
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
              className={`mt-4 px-4 py-2 text-sm ${darkMode ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-700 hover:bg-gray-50'} shadow-sm`}
              style={{ borderRadius: '2px' }}
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && visibleProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                darkMode={darkMode}
                onView={(id) => navigate(`/made-in-rwanda/product/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal - removed, now navigating to detail page instead */}
    </div>
  );
}