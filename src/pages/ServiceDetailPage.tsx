import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaSearch } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { useDarkMode } from '../context/DarkMode';
import { cachedFetch } from '../utils/cachedFetch';
import blankProfileImage from './images/blankProfileImage.png';
import { ChevronRight, MapPin, Package, Users } from 'lucide-react';

L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const IMAGE_BASE = API_BASE.replace(/\/api$/, "");

interface Provider {
  id: string;
  email: string;
  location: { lat: number; lng: number } | null;
  profile_image?: string;
  profile_image_url?: string;
  phone_number?: string;
  rating?: number;
  address?: {
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
    known_place?: string;
  };
}

interface Address {
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  known_place?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  category?: string;
  image?: string;
}

interface ProviderListingItem {
  productId: string;
  url: string;
  title?: string;
  desc?: string;
  price?: number;
  type: 'product' | 'service';
  visible?: boolean;
  views?: string[];
  mediaFiles?: Array<{ url: string; type: 'image' | 'video' }>;
  fileType?: 'image' | 'video' | 'mixed';
  providerId: string;
  providerEmail: string;
  providerProfileImage?: string;
  providerAddress?: Address;
  providerLocation: { lat: number; lng: number } | null;
}

const toAbsoluteImageUrl = (rawUrl?: string | null): string => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (/^(https?:|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, '/');
  if (normalized.startsWith('/')) {
    return `${IMAGE_BASE}${normalized}`;
  }

  return `${IMAGE_BASE}/${normalized}`;
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerListings, setProviderListings] = useState<ProviderListingItem[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [filteredListings, setFilteredListings] = useState<ProviderListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'listings' | 'providers'>('listings');
  const [showNearby, setShowNearby] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [providerSearchTerm, setProviderSearchTerm] = useState('');
  const [submittedProviderSearchTerm, setSubmittedProviderSearchTerm] = useState('');
  const [listingSearchTerm, setListingSearchTerm] = useState('');
  const [submittedListingSearchTerm, setSubmittedListingSearchTerm] = useState('');
  const { darkMode } = useDarkMode();

  const normalizeProviders = (data: unknown): Provider[] => {
    if (!Array.isArray(data)) return [];
    return (data as any[]).map((p) => {
      const rawLoc = p?.location;
      const lat = rawLoc?.lat;
      const lng = rawLoc?.lng;

      const normalizedLocation =
        lat !== undefined && lng !== undefined && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
          ? { lat: Number(lat), lng: Number(lng) }
          : null;

      return {
        ...p,
        id: String(p.id),
        profile_image: p.profile_image || p.profile_image_url || '',
        location: normalizedLocation,
        rating: p.rating || (3.5 + Math.random() * 1.5).toFixed(1),
      } as Provider;
    });
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const serviceData = await cachedFetch<Service>(`${API_BASE}/api/services/${id}`);
        setService(serviceData);

        const providerData = await cachedFetch<Provider[]>(`${API_BASE}/services/${id}/providers`);
        const normalized = normalizeProviders(providerData);
        setProviders(normalized);
        setFilteredProviders(normalized);

        const listingsNested = await Promise.all(
          normalized.map(async (provider) => {
            try {
              const uploads = await cachedFetch<any>(`${API_BASE}/api/providers/${provider.id}/uploads/images`);
              const items: ProviderListingItem[] = [];

              const pushItems = (source: any[] | undefined, type: 'product' | 'service') => {
                if (!Array.isArray(source)) return;
                source.forEach((item: any) => {
                  items.push({
                    productId: String(item.productId || item.id || item.group_id || ''),
                    url: String(item.url || ''),
                    title: item.title || '',
                    desc: item.desc || item.description || '',
                    price: item.price,
                    type,
                    visible: item.visible !== false,
                    views: Array.isArray(item.views) ? item.views : [],
                    mediaFiles: Array.isArray(item.mediaFiles) ? item.mediaFiles : [],
                    fileType: item.fileType || 'image',
                    providerId: String(provider.id),
                    providerEmail: provider.email,
                    providerProfileImage: provider.profile_image,
                    providerAddress: provider.address,
                    providerLocation: provider.location,
                  });
                });
              };

              pushItems(uploads?.product, 'product');
              pushItems(uploads?.service, 'service');

              return items;
            } catch {
              return [] as ProviderListingItem[];
            }
          })
        );

        setProviderListings(listingsNested.flat());
        setFilteredListings(listingsNested.flat());
      } catch (e) {
        console.error('Failed to fetch data:', e);
        setProviders([]);
        setFilteredProviders([]);
        setProviderListings([]);
        setFilteredListings([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!showNearby) {
      setUserCoords(null);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          alert('Could not get your location.');
          setShowNearby(false);
        }
      );
    } else {
      alert('Geolocation not supported.');
      setShowNearby(false);
    }
  }, [showNearby]);

  useEffect(() => {
    const providerTerm = submittedProviderSearchTerm.trim().toLowerCase();
    const listingTerm = submittedListingSearchTerm.trim().toLowerCase();
    const nearbyProviderIds = showNearby && userCoords
      ? new Set(
          providers.filter((provider) => {
            if (
              !provider.location ||
              typeof provider.location.lat !== 'number' ||
              typeof provider.location.lng !== 'number'
            ) return false;
            return getDistance(
              userCoords.lat,
              userCoords.lng,
              provider.location.lat,
              provider.location.lng
            ) < 50;
          }).map((provider) => provider.id)
        )
      : null;

    const matchesProvider = (provider: Provider) => {
      if (!providerTerm) return true;
      const { district = '', sector = '', cell = '', village = '', known_place = '' } = provider.address || {};
      return [provider.email, district, sector, cell, village, known_place]
        .join(' ')
        .toLowerCase()
        .includes(providerTerm);
    };

    const nextProviders = providers.filter((provider) => {
      if (nearbyProviderIds && !nearbyProviderIds.has(provider.id)) return false;
      return matchesProvider(provider);
    });

    const nextProviderIds = new Set(nextProviders.map((provider) => provider.id));

    const nextListings = providerListings.filter((item) => {
      if (!nextProviderIds.has(item.providerId)) return false;
      if (!listingTerm) return true;
      return [item.title, item.desc, item.type]
        .join(' ')
        .toLowerCase()
        .includes(listingTerm);
    });

    setFilteredProviders(nextProviders);
    setFilteredListings(nextListings);
  }, [providers, providerListings, submittedProviderSearchTerm, submittedListingSearchTerm, showNearby, userCoords]);

  const mapProviders = useMemo(() => {
    return filteredProviders;
  }, [filteredProviders]);

  // Map initialization
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('providers-map');
      if (!mapContainer) return;

      // Clean up existing map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const providersWithValidLocation = mapProviders.filter(
        p => p.location && typeof p.location.lat === 'number' && typeof p.location.lng === 'number'
      );

      if (providersWithValidLocation.length > 0 && mapContainer) {
        const firstLoc = providersWithValidLocation[0].location!;
        
        // Create map
        mapRef.current = L.map('providers-map').setView([firstLoc.lat, firstLoc.lng], 12);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);

        // Add markers for each provider
        providersWithValidLocation.forEach((provider) => {
          const popupContent = `
            <strong>${provider.email.split('@')[0]}</strong><br/>
            ${provider.address?.sector || ''}, ${provider.address?.district || ''}
          `;
          L.marker([provider.location!.lat, provider.location!.lng])
            .addTo(mapRef.current!)
            .bindPopup(popupContent);
        });

        // Add user location circle if nearby mode is on
        if (showNearby && userCoords && typeof userCoords.lat === 'number' && typeof userCoords.lng === 'number') {
          L.circle([userCoords.lat, userCoords.lng], { 
            radius: 50000, 
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.1
          })
            .addTo(mapRef.current!)
            .bindPopup('You are here');
        }

        // Fit bounds to show all markers
        setTimeout(() => {
          if (mapRef.current) {
            const group = L.featureGroup(providersWithValidLocation.map(p => 
              L.marker([p.location!.lat, p.location!.lng])
            ));
            mapRef.current.fitBounds(group.getBounds().pad(0.3));
            mapRef.current.invalidateSize();
          }
        }, 100);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapProviders, showNearby, userCoords]);

  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const handleSearch = () => {
    if (viewMode === 'providers') {
      setSubmittedProviderSearchTerm(providerSearchTerm);
      return;
    }
    setSubmittedListingSearchTerm(listingSearchTerm);
  };

  const activeSearchTerm = viewMode === 'providers' ? providerSearchTerm : listingSearchTerm;

  const handleSearchTermChange = (value: string) => {
    if (viewMode === 'providers') {
      setProviderSearchTerm(value);
      return;
    }
    setListingSearchTerm(value);
  };

  const activeSearchPlaceholder =
    viewMode === 'providers'
      ? 'Search providers by district, sector, or cell...'
      : 'Search products or services...';

  const mainContainerClasses = darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardBgClasses = darkMode ? 'bg-gray-800' : 'bg-white';
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-500';

  const visibleCount = viewMode === 'providers' ? filteredProviders.length : filteredListings.length;
  // render page header + inline spinner while loading so header/navigation remains visible
  if (loading) {
    return (
      <div className={`min-h-screen ${mainContainerClasses}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header Section */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/services')}
              className={`text-sm ${mutedText} hover:text-emerald-500 transition-colors mb-3 inline-flex items-center gap-1`}
            >
              ← Back to Services
            </button>
            <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {service?.title || 'Service'}
            </h1>
            <p className={`text-sm ${mutedText} mt-2 max-w-2xl`}>
              {service?.description}
            </p>
          </div>

          <div className="py-16">
            <LoadingSpinner size="lg" message="Loading service details..." variant="dots" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Service Not Found</h2>
        <button 
          onClick={() => navigate('/services')}
          className="px-4 py-2 bg-emerald-500 text-white rounded-sm"
        >
          Back to Services
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${mainContainerClasses}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/services')}
            className={`text-sm ${mutedText} hover:text-emerald-500 transition-colors mb-3 inline-flex items-center gap-1`}
          >
            ← Back to Services
          </button>
          <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {service.title}
          </h1>
          <p className={`text-sm ${mutedText} mt-2 max-w-2xl`}>
            {service.description}
          </p>
        </div>

        {/* Search and Controls - Compact row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={activeSearchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={activeSearchPlaceholder}
              className={`w-full pl-9 pr-4 py-2 text-sm border-0 ${darkMode ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'} shadow-sm focus:ring-1 focus:ring-emerald-500`}
              style={{ borderRadius: '2px' }}
            />
          </div>
          
          <button
            onClick={handleSearch}
            className={`px-4 py-2 text-sm font-medium transition-colors ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'} shadow-sm`}
            style={{ borderRadius: '2px' }}
          >
            Search
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('listings')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors shadow-sm ${viewMode === 'listings'
                  ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              style={{ borderRadius: '2px' }}
            >
              <Package className="w-4 h-4" />
              Products & Services
            </button>
            <button
              onClick={() => setViewMode('providers')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors shadow-sm ${viewMode === 'providers'
                  ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              style={{ borderRadius: '2px' }}
            >
              <Users className="w-4 h-4" />
              Service Providers
            </button>
          </div>

          {/* Nearby Toggle */}
          <div className="flex items-center gap-3 ml-auto">
            <span className={`text-sm ${mutedText}`}>All</span>
            <button
              onClick={() => setShowNearby(!showNearby)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 ${showNearby ? 'bg-emerald-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${showNearby ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-sm ${mutedText}`}>Nearby</span>
          </div>
        </div>

        {/* Map Section - FIXED */}
        {mapProviders.filter(p => p.location && typeof p.location.lat === 'number' && typeof p.location.lng === 'number').length > 0 ? (
          <div className="mb-8">
            <div 
              id="providers-map" 
              className="w-full overflow-hidden shadow-sm" 
              style={{ height: "320px", borderRadius: '2px' }} 
            />
          </div>
        ) : (
          <div className={`mb-8 text-center py-8 text-sm ${mutedText} border border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} style={{ borderRadius: '2px' }}>
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No provider locations to display on map
          </div>
        )}

        {/* Providers Count */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {viewMode === 'providers' ? 'Service Providers' : 'Products & Services'}
          </h2>
          <span className={`text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`} style={{ borderRadius: '2px' }}>
            {visibleCount} {viewMode === 'providers' ? (visibleCount === 1 ? 'provider' : 'providers') : (visibleCount === 1 ? 'item' : 'items')}
          </span>
        </div>

        {/* Cards Grid */}
        {viewMode === 'providers' ? (
          filteredProviders.length === 0 ? (
            <div className={`text-center py-12 ${mutedText}`}>
              No providers found for this service.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
              {filteredProviders.map((provider) => {
              const imagePath = toAbsoluteImageUrl(provider.profile_image || provider.profile_image_url) || blankProfileImage;

              const isNearby = showNearby && userCoords && provider.location && getDistance(
                userCoords.lat,
                userCoords.lng,
                provider.location.lat,
                provider.location.lng
              ) < 50;

              const locationText = [
                provider.address?.district,
                provider.address?.sector,
                provider.address?.cell
              ].filter(Boolean).slice(0, 2).join(', ');

                return (
                  <div
                    key={provider.id}
                    onClick={() => navigate(`/provider/${provider.id}/uploads`)}
                    className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full ${cardBgClasses} border-0 shadow-sm`}
                    style={{ borderRadius: '2px' }}
                  >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={imagePath}
                      alt={provider.email.split('@')[0]}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = blankProfileImage;
                      }}
                    />
                    {isNearby && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500 text-white" style={{ borderRadius: '2px' }}>
                        Nearby
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-2.5 flex-1 flex flex-col">
                    <h3 className={`text-sm font-semibold truncate ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors`}>
                      {provider.email.split('@')[0]}
                    </h3>

                    {locationText && (
                      <div className="flex items-start gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className={`text-xs ${mutedText} line-clamp-1`}>
                          {locationText}
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                  
      
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>
          )
        ) : filteredListings.length === 0 ? (
          <div className={`text-center py-12 ${mutedText}`}>
            No products or services found for this service.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
            {filteredListings.map((item) => {
              const imagePath = toAbsoluteImageUrl(item.url) || blankProfileImage;
              const providerLabel = item.providerEmail.split('@')[0];

              return (
                <div
                  key={`${item.providerId}-${item.productId}`}
                  className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full ${cardBgClasses} border-0 shadow-sm`}
                  style={{ borderRadius: '2px' }}
                  onClick={() => navigate(`/product-or-service-detail/${item.providerId}/${item.productId}`)}
                >
                  <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={imagePath}
                      alt={item.title || 'Item'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = blankProfileImage;
                      }}
                    />
                    <div className={`absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-medium text-white ${item.type === 'product' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ borderRadius: '2px' }}>
                      {item.type === 'product' ? 'Product' : 'Service'}
                    </div>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col">
                    <h3 className={`text-sm font-semibold truncate ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors`}>
                      {item.title || 'Untitled'}
                    </h3>

                    <p className={`text-xs ${mutedText} line-clamp-1 mt-1`}>
                      by {providerLabel}
                    </p>

                    <div className="mt-auto pt-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item.price ? `RWF ${item.price.toLocaleString()}` : 'Contact for price'}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/provider/${item.providerId}/uploads`);
                          }}
                          className={`text-xs font-medium px-2 py-1 transition-colors ${darkMode ? 'bg-gray-700 text-white hover:bg-emerald-600' : 'bg-gray-100 text-gray-700 hover:bg-emerald-500 hover:text-white'}`}
                          style={{ borderRadius: '2px' }}
                        >
                          Provider
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}