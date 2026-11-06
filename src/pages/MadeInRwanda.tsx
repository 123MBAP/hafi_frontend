import { useDarkMode } from "@/context/DarkMode";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MapComponent from "@/components/MapComponent";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { Search, Filter, MapPin, X } from "lucide-react";
import { API_BASE } from '../api/apiClient';


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
  used?: boolean;
  pricingUnit?: string;
  pricing_unit?: string;
  inStock?: boolean;
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

// Premium Made in Rwanda product card
function ProductCard({ product, darkMode, onView }: {
  product: MadeInRwandaProduct;
  darkMode: boolean;
  onView: (id: string) => void;
}) {
  return (
    <div
      className={`group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full ${
        darkMode
          ? 'bg-zinc-900 border border-zinc-800 hover:border-[#E5252A]'
          : 'bg-white border border-gray-200 hover:border-[#E5252A] shadow-sm'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onView(product.id);
      }}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <img
          src={product.image_url}
          alt={product.title}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            product.inStock === false ? 'opacity-70' : ''
          }`}
          loading="lazy"
        />

        {product.inStock === false && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-zinc-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
              Out of stock
            </span>
          </div>
        )}

        <div className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-[#E5252A] text-white z-10 rounded-full shadow-sm flex items-center gap-1">
          🇷🇼 Made in Rwanda
        </div>

        {product.fileType === 'video' && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-semibold bg-black/75 backdrop-blur-sm text-white z-10 rounded-full">
            ▶ Video
          </div>
        )}
      </div>

      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className={`text-xs sm:text-[13px] font-semibold leading-snug line-clamp-2 mb-1.5 transition-colors ${
            darkMode ? 'text-white group-hover:text-red-400' : 'text-[#151515] group-hover:text-[#E5252A]'
          }`}>
            {product.title}
          </h3>

          {product.description && (
            <p className={`text-[11px] font-normal line-clamp-2 mb-2 leading-relaxed ${
              darkMode ? 'text-gray-400' : 'text-[#666666]'
            }`}>
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-[11px] font-bold text-[#E5252A]">FRw</span>
            <span className="text-base sm:text-lg font-black text-[#E5252A] tracking-tight">
              {product.price.toLocaleString()}
            </span>
            <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              / {product.pricingUnit || product.pricing_unit || 'Piece'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[9px] font-bold text-[#E5252A] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-1.5 py-0.5 rounded">
              Verified Origin
            </span>
            {product.used && (
              <span className="text-[9px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 font-bold uppercase rounded">
                USED
              </span>
            )}
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
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'used'>('all');

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
              used: row.used === true,
              pricingUnit: row.pricingUnit || row.pricing_unit || 'Per Item / Piece',
              pricing_unit: row.pricing_unit || row.pricingUnit || 'Per Item / Piece',
              inStock: row.inStock !== false && row.in_stock !== false,
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

        // Apply conditionFilter
        if (conditionFilter === 'new') {
          if (p.used) return false;
        } else if (conditionFilter === 'used') {
          if (!p.used) return false;
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
  }, [products, searchQuery, sortBy, selectedCategory, filterProviderId, conditionFilter]);

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
    setConditionFilter("all");
  };

  // Refined Filters Panel on light-grey surface
  const FiltersPanel = () => (
    <div className={`p-3 sm:p-4 rounded-xl border mb-5 transition-colors ${
      darkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-[#F5F5F5] border-[#E5E5E5]'
    }`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Made in Rwanda..."
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
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>

        {/* Condition select */}
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
          <option value="new">New Products</option>
          <option value="used">Pre-owned</option>
        </select>

        {/* Nearby */}
        <button
          onClick={() => {
            setNearbyOnly(!nearbyOnly);
            if (!nearbyOnly) handleUseMyLocation();
          }}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-lg font-semibold transition-all ${
            nearbyOnly
              ? 'bg-[#E5252A] text-white shadow-sm'
              : darkMode
              ? 'bg-zinc-950 border border-zinc-800 text-gray-300 hover:text-white'
              : 'bg-white border border-gray-200 text-[#151515] hover:border-gray-300'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Nearby
        </button>

        {nearbyOnly && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              value={nearbyRadiusKm}
              onChange={(e) => setNearbyRadiusKm(Math.max(1, Number(e.target.value || 1)))}
              className={`w-16 px-2 py-2 text-xs sm:text-sm rounded-lg border text-center outline-none ${
                darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'
              }`}
            />
            <span className="text-xs text-gray-400">km</span>
          </div>
        )}

        {/* Show Map Toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
          <input
            type="checkbox"
            checked={showMap}
            onChange={(e) => setShowMap(e.target.checked)}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-600"
          />
          <span className={darkMode ? 'text-gray-300' : 'text-[#151515]'}>Show Map</span>
        </label>

        {/* Clear Filters */}
        {(searchQuery || selectedCategory !== "All" || sortBy !== "popular" || nearbyOnly || conditionFilter !== "all") && (
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

  // Category Chips
  const CategoryChips = () => (
    <div className="mb-6 w-full overflow-hidden">
      <div
        ref={categoryStripRef}
        className="flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          onClick={() => setSelectedCategory("All")}
          className={`flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
            selectedCategory === "All"
              ? 'bg-[#E5252A] text-white shadow-sm'
              : darkMode
              ? 'bg-zinc-900 border border-zinc-800 text-gray-300 hover:text-white'
              : 'bg-white border border-gray-200 text-[#151515] hover:border-gray-300'
          }`}
        >
          All Items
          <span className={`text-[10px] ${selectedCategory === "All" ? 'text-white/90' : 'text-gray-400'}`}>
            ({products.length})
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isSelected
                  ? 'bg-[#E5252A] text-white shadow-sm'
                  : darkMode
                  ? 'bg-zinc-900 border border-zinc-800 text-gray-300 hover:text-white'
                  : 'bg-white border border-gray-200 text-[#151515] hover:border-gray-300'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Editorial Compact Header */}
        <PageHeader
          title="Made in Rwanda"
          subtitle="Discover authentic craftsmanship, home-grown products, fashion, and artisanal goods from verified Rwandan creators."
          badge={
            <Badge variant="red-subtle">
              {visibleProducts.length} Products
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
              <span className="font-medium text-gray-600 dark:text-gray-400">Filtering products by:</span>
              <span className="font-bold text-[#E5252A]">
                {filterProviderName || 'Loading...'}
              </span>
            </div>
            <button
              onClick={() => setSearchParams({})}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-300 bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            >
              Show All Products
            </button>
          </div>
        )}

        {/* Mobile filter toggle */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${darkMode ? 'bg-black text-white border border-white' : 'bg-white text-black border border-black'} shadow-sm hover:bg-red-600 hover:text-white`}
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
          <div className="p-4 rounded-xl text-sm bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50 text-center">
            Failed to load products: {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visibleProducts.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800 p-8 my-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
              <Search className="w-6 h-6 text-[#E5252A]" />
            </div>
            <h3 className={`text-base font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
              No Made in Rwanda products found
            </h3>
            <p className={`text-xs sm:text-sm max-w-sm mx-auto ${darkMode ? 'text-gray-400' : 'text-[#666666]'}`}>
              We couldn't find matching items. Try relaxing your filters or searching for another term.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#E5252A] hover:bg-[#C81E23] rounded-lg shadow-sm transition-all"
            >
              Reset All Filters
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