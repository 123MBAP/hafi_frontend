import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useDarkMode } from '../context/DarkMode';
import { cachedFetch } from '../utils/cachedFetch';

import interiorDesignImage from "./images/bg_images/interior_design.jpg"
import clothesShoppingImage from "./images/bg_images/clothes_shopping.avif"
import madeInRwandaImage from "./images/bg_images/made_in_rwanda.jpg"
import weddingDecorationImage from "./images/bg_images/wedding_decoration.png"
import equipmrntRentalImage from "./images/bg_images/equipment_rental.jpg"
import realEstateImage from "./images/bg_images/real_estate.jpg"
import photoStudioImage from "./images/bg_images/photo_studio.jpg"
import kidsOutdoorImage from "./images/bg_images/kids_outdoor.png"



const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  created_at?: string;
  location?: {
    lat: number;
    lng: number;
  } | null;
}

interface MarketProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  image_url?: string;
  views: string[];
  mediaFiles?: Array<{ url: string; type: 'image' | 'video' }>;
  fileType?: 'image' | 'video' | 'mixed';
  createdAt?: string;
}

interface UploadPreviewItem {
  id: string;
  title: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  providerId?: string;
  createdAt?: string;
  updatedAt?: string;
  source: 'providerUpload' | 'sellerProduct';
  type?: 'product' | 'service';
}

interface PropertyItem {
  id: string;
  title: string;
  price: number;
  images?: string[];
  createdAt?: string;
}

const images = [
  interiorDesignImage,
  clothesShoppingImage,
  madeInRwandaImage, 
  weddingDecorationImage,
  equipmrntRentalImage, 
  realEstateImage, 
  photoStudioImage, 
  kidsOutdoorImage
];

const FALLBACK_ITEMS = [
  {
    id: "fallback-1",
    title: "Modern Interior Design & Styling",
    description: "Get bespoke home decoration, custom furniture setups, and elegant styling by local design experts.",
    image: interiorDesignImage,
    imageUrl: interiorDesignImage,
    image_url: interiorDesignImage,
    images: [interiorDesignImage],
    price: 120000,
    category: "upload",
    type: "service",
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    providerId: "fallback-prov",
  },
  {
    id: "fallback-2",
    title: "Trending Fashion & Designer Outfits",
    description: "Explore collections of tailored clothing, trendy street styles, and premium local designer fashion.",
    image: clothesShoppingImage,
    imageUrl: clothesShoppingImage,
    image_url: clothesShoppingImage,
    images: [clothesShoppingImage],
    price: 25000,
    category: "product",
    type: "product",
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    providerId: "fallback-prov",
  },
  {
    id: "fallback-3",
    title: "Authentic Made in Rwanda Handcrafts",
    description: "High quality local crafts, custom wood products, traditional baskets, and souvenirs made in Rwanda.",
    image: madeInRwandaImage,
    imageUrl: madeInRwandaImage,
    image_url: madeInRwandaImage,
    images: [madeInRwandaImage],
    price: 35000,
    category: "product",
    type: "product",
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    providerId: "fallback-prov",
  },
  {
    id: "fallback-4",
    title: "Luxury Wedding Decoration & Catering",
    description: "Plan the perfect wedding ceremony with bespoke stages, lights, decoration, and flower concepts.",
    image: weddingDecorationImage,
    imageUrl: weddingDecorationImage,
    image_url: weddingDecorationImage,
    images: [weddingDecorationImage],
    price: 450000,
    category: "upload",
    type: "service",
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    providerId: "fallback-prov",
  },
  {
    id: "fallback-5",
    title: "Construction Equipment Rental",
    description: "Rent concrete mixers, power drills, scaffoldings, and heavy duty machinery for your construction project.",
    image: equipmrntRentalImage,
    imageUrl: equipmrntRentalImage,
    image_url: equipmrntRentalImage,
    images: [equipmrntRentalImage],
    price: 45000,
    category: "upload",
    type: "service",
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    providerId: "fallback-prov",
  },
  {
    id: "fallback-6",
    title: "Prime Real Estate & Offices",
    description: "View top houses, villas, and apartments for rent or sale. Secure commercial office spaces in Kigali.",
    image: realEstateImage,
    imageUrl: realEstateImage,
    image_url: realEstateImage,
    images: [realEstateImage],
    price: 900000,
    category: "property",
    type: "property",
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    providerId: "fallback-prov",
  },
  {
    id: "fallback-7",
    title: "Professional Studio Photography",
    description: "Indoor studio shoots, outdoor family sessions, wedding coverage, and creative videography packages.",
    image: photoStudioImage,
    imageUrl: photoStudioImage,
    image_url: photoStudioImage,
    images: [photoStudioImage],
    price: 30000,
    category: "upload",
    type: "service",
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    providerId: "fallback-prov",
  },
  {
    id: "fallback-8",
    title: "Kids Outdoor Playground",
    description: "Rent custom bouncy castles, kids entertainment centers, and setups for children birthday parties.",
    image: kidsOutdoorImage,
    imageUrl: kidsOutdoorImage,
    image_url: kidsOutdoorImage,
    images: [kidsOutdoorImage],
    price: 40000,
    category: "upload",
    type: "service",
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    providerId: "fallback-prov",
  }
];

const fallbackServices: Service[] = FALLBACK_ITEMS.map(item => ({
  id: item.id,
  title: item.title,
  description: item.description,
  image: item.image,
  created_at: item.created_at,
}));

const fallbackUpdates = FALLBACK_ITEMS;

// Helper to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate random layout configurations for each row
const generateRowLayout = (itemCount: number): Array<'full' | 'half-half' | 'third-third-third' | 'two-thirds-third' | 'third-two-thirds' | 'large-small' | 'small-large' | 'scrolling'> => {
  const layouts: Array<'full' | 'half-half' | 'third-third-third' | 'two-thirds-third' | 'third-two-thirds' | 'large-small' | 'small-large' | 'scrolling'> = [
    'full', 'half-half', 'third-third-third', 'two-thirds-third', 
    'third-two-thirds', 'large-small', 'small-large', 'scrolling'
  ];
  const shuffledLayouts = shuffleArray([...layouts]);
  const result: any[] = [];
  let remaining = itemCount;
  
  while (remaining > 0) {
    let layout = shuffledLayouts[(result.length * 7) % shuffledLayouts.length];
    // Adjust layout based on remaining items
    if (layout === 'third-third-third' && remaining < 3) layout = 'half-half';
    if (layout === 'half-half' && remaining < 2) layout = 'full';
    if (layout === 'two-thirds-third' && remaining < 2) layout = 'half-half';
    if (layout === 'third-two-thirds' && remaining < 2) layout = 'half-half';
    if (layout === 'large-small' && remaining < 2) layout = 'full';
    if (layout === 'small-large' && remaining < 2) layout = 'full';
    
    result.push(layout);
    if (layout === 'full') remaining -= 1;
    else if (layout === 'half-half' || layout === 'large-small' || layout === 'small-large') remaining -= 2;
    else if (layout === 'two-thirds-third' || layout === 'third-two-thirds') remaining -= 2;
    else if (layout === 'third-third-third') remaining -= 3;
    else if (layout === 'scrolling') remaining -= 6;
  }
  return result;
};

// Random height generator
// const getRandomHeight = (): string => {
//   const heights = ['h-48', 'h-56', 'h-64', 'h-72', 'h-80', 'h-96'];
//   return heights[Math.floor(Math.random() * heights.length)];
// };

const HomePage = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  // const [allServices, setAllServices] = useState<Service[]>(fallbackServices);
  const [filteredServices, setFilteredServices] = useState<Service[]>(fallbackServices);
  // Unused local state variables commented out to satisfy compiler rules
  // const [latestUploadItems, setLatestUploadItems] = useState<UploadPreviewItem[]>([]);
  // const [latestMarketProducts, setLatestMarketProducts] = useState<MarketProduct[]>([]);
  // const [latestProperties, setLatestProperties] = useState<PropertyItem[]>([]);
  // const [searchTerm, setSearchTerm] = useState('');
  // const [locationTerm, setLocationTerm] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [shuffledUpdates, setShuffledUpdates] = useState<any[]>(fallbackUpdates);
  const [serviceRows, setServiceRows] = useState<Array<{ layout: any; items: any[] }>>([]);
  const [updateRows, setUpdateRows] = useState<Array<{ layout: any; items: any[] }>>([]);

  useEffect(() => {
    async function loadUpdates() {
      try {
        const [servicesRes, latestUploadsRes, productsRes, propertiesRes] = await Promise.all([
          cachedFetch<any>(`${API_BASE}/api/services`),
          cachedFetch<any>(`${API_BASE}/api/latest-uploads`),
          cachedFetch<any>(`${API_BASE}/api/marketPage/products`),
          cachedFetch<any>(`${API_BASE}/api/real-estate/properties`),
        ]);

        const servicesData = servicesRes || { services: [] };
        const latestUploadsData = latestUploadsRes || [];
        const productsData = productsRes || { products: [] };
        const propertiesData = propertiesRes || { properties: [] };

        const servicesList: Service[] = Array.isArray(servicesData.services)
          ? servicesData.services.map((service: any) => ({
              id: String(service.id),
              title: service.title || '',
              description: service.description || '',
              image: service.image || '',
              created_at: service.created_at || service.updated_at || '',
              location: service.location || null,
            }))
          : [];

        const uploadItems: UploadPreviewItem[] = Array.isArray(latestUploadsData)
          ? latestUploadsData
              .filter((item: any) => item.provider_id && (item.type === 'product' || item.type === 'service'))
              .map((item: any) => ({
                id: String(item.id),
                title: item.title || item.image_title || 'Uploaded item',
                description: item.description || item.image_description || '',
                price: Number(item.price || 0),
                imageUrl: Array.isArray(item.image_url) ? String(item.image_url[0] || '') : String(item.image_url || ''),
                providerId: String(item.provider_id),
                createdAt: item.created_at || '',
                updatedAt: item.updated_at || item.created_at || '',
                source: 'providerUpload',
                type: item.type === 'service' ? 'service' : 'product',
              }))
          : [];

        const productList: MarketProduct[] = Array.isArray(productsData.products)
          ? productsData.products.map((product: any) => ({
              id: String(product.id),
              title: product.title || '',
              description: product.description || '',
              price: Number(product.price || 0),
              image_url: product.image_url || '',
              views: Array.isArray(product.views) ? product.views : [],
              mediaFiles: Array.isArray(product.mediaFiles) ? product.mediaFiles : [],
              fileType: product.fileType || 'image',
              createdAt: product.createdAt || product.created_at || '',
            }))
          : [];

        const propertyList: PropertyItem[] = Array.isArray(propertiesData.properties)
          ? propertiesData.properties.map((property: any) => ({
              id: String(property.id),
              title: property.title || property.name || 'Property',
              price: Number(property.price || 0),
              images: Array.isArray(property.images) ? property.images : [],
              createdAt: property.createdAt || property.created_at || '',
            }))
          : [];

        // setAllServices(servicesList);
        setFilteredServices(servicesList);
        
        const uploads = uploadItems.sort((a, b) => {
          return (new Date(b.updatedAt || b.createdAt || 0).getTime() || 0) - (new Date(a.updatedAt || a.createdAt || 0).getTime() || 0);
        }).slice(0, 15);
        
        const products = productList.sort((a, b) => {
          return (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0);
        }).slice(0, 15);
        
        const properties = propertyList.sort((a, b) => {
          return (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0);
        }).slice(0, 15);

        // setLatestUploadItems(uploads);
        // setLatestMarketProducts(products);
        // setLatestProperties(properties);

        // Combine all updates
        const allUpdates = shuffleArray([
          ...uploads.map(u => ({ ...u, category: 'upload' })),
          ...products.map(p => ({ ...p, category: 'product' })),
          ...properties.map(p => ({ ...p, category: 'property' }))
        ]);
        setShuffledUpdates(allUpdates);
        
      } catch (error) {
        console.error('Failed to load updates for home page:', error);
        // Keep fallback data active to avoid blank homepage on server issues
      }
    }

    loadUpdates();
  }, []);

  // Generate random rows when data changes
  useEffect(() => {
    if (filteredServices.length > 0) {
      const layouts = generateRowLayout(Math.min(filteredServices.length, 24));
      let itemsLeft = [...filteredServices];
      const rows = [];
      for (const layout of layouts) {
        if (itemsLeft.length === 0) break;
        if (layout === 'full') {
          rows.push({ layout, items: itemsLeft.slice(0, 1) });
          itemsLeft = itemsLeft.slice(1);
        } else if (layout === 'half-half' && itemsLeft.length >= 2) {
          rows.push({ layout, items: itemsLeft.slice(0, 2) });
          itemsLeft = itemsLeft.slice(2);
        } else if (layout === 'third-third-third' && itemsLeft.length >= 3) {
          rows.push({ layout, items: itemsLeft.slice(0, 3) });
          itemsLeft = itemsLeft.slice(3);
        } else if ((layout === 'two-thirds-third' || layout === 'third-two-thirds') && itemsLeft.length >= 2) {
          rows.push({ layout, items: itemsLeft.slice(0, 2) });
          itemsLeft = itemsLeft.slice(2);
        } else if ((layout === 'large-small' || layout === 'small-large') && itemsLeft.length >= 2) {
          rows.push({ layout, items: itemsLeft.slice(0, 2) });
          itemsLeft = itemsLeft.slice(2);
        } else if (layout === 'scrolling') {
          rows.push({ layout, items: itemsLeft.slice(0, 6) });
          itemsLeft = itemsLeft.slice(6);
        } else {
          rows.push({ layout: 'full', items: itemsLeft.slice(0, 1) });
          itemsLeft = itemsLeft.slice(1);
        }
      }
      setServiceRows(rows);
    }
  }, [filteredServices]);

  useEffect(() => {
    if (shuffledUpdates.length > 0) {
      const layouts = generateRowLayout(Math.min(shuffledUpdates.length, 24));
      let itemsLeft = [...shuffledUpdates];
      const rows = [];
      for (const layout of layouts) {
        if (itemsLeft.length === 0) break;
        if (layout === 'full') {
          rows.push({ layout, items: itemsLeft.slice(0, 1) });
          itemsLeft = itemsLeft.slice(1);
        } else if (layout === 'half-half' && itemsLeft.length >= 2) {
          rows.push({ layout, items: itemsLeft.slice(0, 2) });
          itemsLeft = itemsLeft.slice(2);
        } else if (layout === 'third-third-third' && itemsLeft.length >= 3) {
          rows.push({ layout, items: itemsLeft.slice(0, 3) });
          itemsLeft = itemsLeft.slice(3);
        } else if ((layout === 'two-thirds-third' || layout === 'third-two-thirds') && itemsLeft.length >= 2) {
          rows.push({ layout, items: itemsLeft.slice(0, 2) });
          itemsLeft = itemsLeft.slice(2);
        } else if ((layout === 'large-small' || layout === 'small-large') && itemsLeft.length >= 2) {
          rows.push({ layout, items: itemsLeft.slice(0, 2) });
          itemsLeft = itemsLeft.slice(2);
        } else if (layout === 'scrolling') {
          rows.push({ layout, items: itemsLeft.slice(0, 8) });
          itemsLeft = itemsLeft.slice(8);
        } else {
          rows.push({ layout: 'full', items: itemsLeft.slice(0, 1) });
          itemsLeft = itemsLeft.slice(1);
        }
      }
      setUpdateRows(rows);
    }
  }, [shuffledUpdates]);

  // const handleSearch = () => {
  //   const results = allServices.filter(service =>
  //     (service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       service.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
  //     (locationTerm
  //       ? (service.location &&
  //           (String(service.location.lat).includes(locationTerm) ||
  //            String(service.location.lng).includes(locationTerm)) ||
  //          service.description?.toLowerCase().includes(locationTerm.toLowerCase()))
  //       : true)
  //   );
  //   setFilteredServices(results);
  // };

  const resolveImageUrl = (path: string | undefined) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('/src/') || path.includes('/images/') || path.includes('/assets/')) return path;
    return `${API_BASE}/${path.replace(/^\/+/, '')}`;
  };

  const formatUpdatedTime = (timestamp: string | undefined) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Commented out unused handler to satisfy compiler rules
  // const handleUploadClick = (item: UploadPreviewItem) => {
  //   if (item.providerId) {
  //     navigate(`/provider/${item.providerId}/uploads`);
  //   }
  // };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  // Render service card with random height
  const renderServiceCard = (service: Service, isLarge: boolean = false, isWide: boolean = false) => {
    const cardHeight = isLarge ? 'h-64 sm:h-72' : isWide ? 'h-44 sm:h-52 md:h-60' : 'h-36 sm:h-44 md:h-52';
    
    return (
      <Link to={`/services/${service.id}`} className="block h-full group">
        <div className="h-full bg-white dark:bg-gray-900 border dark:border-gray-800/60 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden" style={{ borderRadius: '2px' }}>
          <div className={`${cardHeight} overflow-hidden`}>
            <img 
              src={resolveImageUrl(service.image) || 'https://via.placeholder.com/400x300?text=Service'} 
              alt={service.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight line-clamp-2">
              {service.title}
            </h3>
            <p className="mt-1.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">
              {service.description}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                {formatUpdatedTime(service.created_at) || 'New'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // Render update card
  const renderUpdateCard = (item: any, isLarge: boolean = false, isWide: boolean = false) => {
    const getPrice = () => {
      if (item.category === 'product') return item.price;
      if (item.category === 'property') return item.price;
      if (item.category === 'upload') return item.price;
      return null;
    };
    
    const getImage = () => {
      if (item.category === 'product') return resolveImageUrl(item.image_url);
      if (item.category === 'property') return resolveImageUrl(item.images?.[0]);
      if (item.category === 'upload') return resolveImageUrl(item.imageUrl);
      return '';
    };
    
    const getTitle = () => item.title || 'Untitled';
    const price = getPrice();
    const imageUrl = getImage();
    const title = getTitle();
    const cardHeight = isLarge ? 'h-64 sm:h-80' : isWide ? 'h-44 sm:h-56 md:h-64' : 'h-36 sm:h-44 md:h-52';
    
    const handleClick = () => {
      if (item.category === 'product') navigate(`/product/${item.id}`);
      else if (item.category === 'property') navigate(`/real-estate/property/${item.id}`);
      else if (item.category === 'upload' && item.providerId) navigate(`/provider/${item.providerId}/uploads`);
    };
    
    return (
      <button
        onClick={handleClick}
        className="w-full h-full text-left group relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border dark:border-gray-800/60 flex flex-col"
        style={{ borderRadius: '2px' }}
      >
        <div className={`${cardHeight} overflow-hidden relative`}>
          <img
            src={imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 text-white text-xs uppercase tracking-wider" style={{ borderRadius: '2px' }}>
            {item.category === 'product' ? 'Market' : item.category === 'property' ? 'Estate' : 'Fresh'}
          </div>
          {price && (
            <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 text-white text-sm font-bold">
              RWF {price.toLocaleString()}
            </div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight line-clamp-2">
            {title}
          </h3>
          {isLarge && item.description && (
            <p className="mt-1.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">
              {formatUpdatedTime(item.createdAt || item.updatedAt) || 'Just added'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
          </div>
        </div>
      </button>
    );
  };

  // Render a row based on layout
  const renderRow = (row: { layout: any; items: any[] }, type: 'service' | 'update') => {
    const { layout, items } = row;
    
    if (layout === 'full' && items[0]) {
      return (
        <div key={Math.random()} className="mb-6">
          <div className="grid grid-cols-1 gap-4">
            {type === 'service' 
              ? renderServiceCard(items[0], true, false)
              : renderUpdateCard(items[0], true, false)
            }
          </div>
        </div>
      );
    }
    
    if (layout === 'half-half' && items.length >= 2) {
      return (
        <div key={Math.random()} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.slice(0, 2).map((item, idx) => (
              <div key={item.id || idx}>
                {type === 'service' 
                  ? renderServiceCard(item, false, false)
                  : renderUpdateCard(item, false, false)
                }
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (layout === 'third-third-third' && items.length >= 3) {
      return (
        <div key={Math.random()} className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.slice(0, 3).map((item, idx) => (
              <div key={item.id || idx}>
                {type === 'service' 
                  ? renderServiceCard(item, false, false)
                  : renderUpdateCard(item, false, false)
                }
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (layout === 'two-thirds-third' && items.length >= 2) {
      return (
        <div key={Math.random()} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {type === 'service' 
                ? renderServiceCard(items[0], true, true)
                : renderUpdateCard(items[0], true, true)
              }
            </div>
            <div className="md:col-span-1">
              {type === 'service' 
                ? renderServiceCard(items[1], false, false)
                : renderUpdateCard(items[1], false, false)
              }
            </div>
          </div>
        </div>
      );
    }
    
    if (layout === 'third-two-thirds' && items.length >= 2) {
      return (
        <div key={Math.random()} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              {type === 'service' 
                ? renderServiceCard(items[0], false, false)
                : renderUpdateCard(items[0], false, false)
              }
            </div>
            <div className="md:col-span-2">
              {type === 'service' 
                ? renderServiceCard(items[1], true, true)
                : renderUpdateCard(items[1], true, true)
              }
            </div>
          </div>
        </div>
      );
    }
    
    if (layout === 'large-small' && items.length >= 2) {
      return (
        <div key={Math.random()} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              {type === 'service' 
                ? renderServiceCard(items[0], true, true)
                : renderUpdateCard(items[0], true, true)
              }
            </div>
            <div className="md:col-span-1">
              {type === 'service' 
                ? renderServiceCard(items[1], false, false)
                : renderUpdateCard(items[1], false, false)
              }
            </div>
          </div>
        </div>
      );
    }
    
    if (layout === 'small-large' && items.length >= 2) {
      return (
        <div key={Math.random()} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              {type === 'service' 
                ? renderServiceCard(items[0], false, false)
                : renderUpdateCard(items[0], false, false)
              }
            </div>
            <div className="md:col-span-3">
              {type === 'service' 
                ? renderServiceCard(items[1], true, true)
                : renderUpdateCard(items[1], true, true)
              }
            </div>
          </div>
        </div>
      );
    }
    
    if (layout === 'scrolling') {
      return (
        <div key={Math.random()} className="mb-6 overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
            {items.slice(0, 8).map((item, idx) => (
              <div key={item.id || idx} className="w-64 sm:w-72 flex-shrink-0">
                {type === 'service' 
                  ? renderServiceCard(item, false, false)
                  : renderUpdateCard(item, false, false)
                }
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-55 text-gray-800'}`}>
      
      {/* Hero Section */}
      <section
        className="relative text-center py-24 sm:py-32 lg:py-48 px-4 sm:px-6 text-white bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${images[currentIndex]})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-0"></div>

        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-2 transition-all"
          style={{ borderRadius: '2px' }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-2 transition-all"
          style={{ borderRadius: '2px' }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-4 uppercase tracking-tighter text-white drop-shadow-md">
            Services, Products & Real Estate
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto mb-8 sm:mb-10 drop-shadow-sm">
            Find local services, shop Rwanda-made products, browse global market listings, and explore real estate opportunities near you.
          </p>
        </div>
      </section>

      {/* Why HafiConnect */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-gray-900 dark:text-white uppercase">
            Why HafiConnect?
          </h2>
          <div className="w-12 h-0.5 bg-emerald-500 mx-auto mt-4"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Browse & Compare', desc: 'Easily browse local providers. Compare prices and profiles.' },
            { title: 'Contact Instantly', desc: 'Message or call providers directly. Get quick answers without leaving.' },
            { title: 'Review & Trust', desc: 'Read authentic reviews and make informed decisions.' }
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border dark:border-gray-800/60 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all" style={{ borderRadius: '2px' }}>
              <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Services - Unpredictable Rows */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-10 flex justify-between items-end flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tighter text-gray-900 dark:text-white uppercase">
              Featured Services
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Every row is different — just like real life</p>
          </div>
        </div>
        {serviceRows.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Loading services...</div>
        ) : (
          <div>
            {serviceRows.map(row => renderRow(row, 'service'))}
          </div>
        )}
        <div className="flex justify-center mt-12">
          <Link
            to="/services"
            className="px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            style={{ borderRadius: '2px' }}
          >
            Browse All Services →
          </Link>
        </div>
      </section>

      {/* Fresh Picks - Completely unpredictable */}
      <section className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900/30">
        <div className="mb-4">
          <h2 className="text-3xl font-bold tracking-tighter text-gray-900 dark:text-white uppercase">
            Fresh Picks
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">No categories, no filters — just what's new and unexpected</p>
        </div>
        {updateRows.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Loading fresh picks...</div>
        ) : (
          <div>
            {updateRows.map(row => renderRow(row, 'update'))}
          </div>
        )}
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-2 sm:py-4">
        <div className="text-center mb-2 sm:mb-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-gray-900 dark:text-white uppercase">
            How It Works
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            One platform to search, compare, chat, order, and receive what you need across services, products, and real estate.
          </p>
          <div className="w-12 h-0.5 bg-emerald-500 mx-auto mt-4"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0  sm:gap-4 mt-4 sm:mt-8 p-0  sm:p-4">
          {[
            {
              step: '01',
              title: 'Search what you need',
              desc: 'Look up services, Made in Rwanda products, market items, or properties in one place.',
            },
            {
              step: '02',
              title: 'Compare nearby options',
              desc: 'Review prices, locations, and available providers to find the best nearby match.',
            },
            {
              step: '03',
              title: 'Open details and chat',
              desc: 'View a provider or item page, then contact the seller or service provider directly.',
            },
            {
              step: '04',
              title: 'Choose products or services',
              desc: 'Select the right service, property, or product based on your budget and preferences.',
            },
            {
              step: '05',
              title: 'Place your order',
              desc: 'Add items to cart, submit your order, or confirm the service request in a few taps.',
            },
            {
              step: '06',
              title: 'Receive and follow up',
              desc: 'Track the order or service outcome and complete delivery through the same platform.',
            },
          ].map((item) => (
            <div key={item.step} className="bg-white dark:bg-gray-900 border dark:border-gray-800/60 p-4 shadow-sm hover:shadow-md transition-all h-full" style={{ borderRadius: '2px' }}>
              <div className="inline-flex items-center justify-center w-9 h-9 mb-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs" style={{ borderRadius: '2px' }}>
                {item.step}
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {item.title}
              </h3>
              <p className={`text-sm leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;