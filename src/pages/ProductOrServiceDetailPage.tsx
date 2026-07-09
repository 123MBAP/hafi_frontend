import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CartItem, useCart } from '../context/CartContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cachedFetch } from '../utils/cachedFetch';
import ProductOrServiceDetail from './ProductOrServiceDetail';
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

interface ProviderProfile {
  id: string;
  name?: string;
  email?: string;
  phone_number?: string;
  whatsapp_number?: string;
  profile_image?: string;
  profile_image_url?: string;
}


interface ProviderImage {
  productId: string;
  url: string;
  title?: string;
  desc?: string;
  description?: string;
  price?: number;
  type: "product" | "service";
  visible?: boolean;
  views?: string[];
  mediaFiles?: Array<{ url: string; type: 'image' | 'video' }>;
  fileType?: 'image' | 'video' | 'mixed';
  madeInRwanda?: boolean;
}

export default function ProductOrServicesDetailPage() {
  const { providerId, imageIndex } = useParams<{ providerId: string; imageIndex: string }>();
  const [imageData, setImageData] = useState<ProviderImage | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchData() {
      if (!providerId || imageIndex === undefined) return;

      try {
        // Use the same uploads endpoint used elsewhere so data shape matches
        const data = await cachedFetch<any>(`${API_BASE}/api/providers/${providerId}/uploads/images`);
        console.log('dataimagass', data)

        const providerData = await cachedFetch<ProviderProfile>(`${API_BASE}/api/providers/${providerId}`);
        setProvider(providerData);

        const allImages: ProviderImage[] = [];
        console.log('allimages', allImages)

        if (Array.isArray(data.product)) {
          allImages.push(...data.product.map((img: any) => ({
            productId: img.id,
            url: img.url,
            title: img.title,
            desc: img.desc,
            description: img.description || img.desc,
            price: img.price,
            type: "product",
            visible: img.visible !== false,
            views: Array.isArray(img.views) ? img.views : [],
            mediaFiles: Array.isArray(img.mediaFiles) ? img.mediaFiles : [],
            fileType: img.fileType || 'image',
            madeInRwanda: img.madeInRwanda || false,
          })));
        }

        if (Array.isArray(data.service)) {
          allImages.push(...data.service.map((img: any) => ({
            productId: img.id,
            url: img.url,
            title: img.title,
            desc: img.desc,
            description: img.description || img.desc,
            price: img.price,
            type: "service",
            visible: img.visible !== false,
            views: Array.isArray(img.views) ? img.views : [],
            mediaFiles: Array.isArray(img.mediaFiles) ? img.mediaFiles : [],
            fileType: img.fileType || 'image',
            madeInRwanda: img.madeInRwanda || false,
          })));
        }

        const numericIndex = parseInt(imageIndex);
        const matchedByIndex = !isNaN(numericIndex) ? allImages[numericIndex] : undefined;
        const matchedById = allImages.find((img) => String(img.productId) === String(imageIndex));

        if (matchedById) {
          setImageData(matchedById);
        } else if (matchedByIndex) {
          setImageData(matchedByIndex);
        } else {
          setError("Item not found");
        }
      } catch (e) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [providerId, imageIndex]);

  const handleAddToCart = (item: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    size?: string;
    imageUrl: string;
    type: string;
    description?: string;
    serviceCustomization?: {
      needsCustomization: boolean;
      customizationRequest?: string;
      noCustomizationNeeded?: boolean;
    };
  }) => {
    if (!providerId) return;

    // ✅ consistent id based on provider + title + size
    const itemId = `${providerId}-${item.title}-${item.size || "default"}`;

    const cartItem: CartItem = {
      id: itemId,
      productId: item.productId,
      name: item.title,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      image: item.imageUrl,
      description: item.description,
      shipping: 0,
      checked: true,
      providerId,
      type: item.type,
      ...(item.serviceCustomization && { serviceCustomization: item.serviceCustomization }),
    };

    addToCart(cartItem);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <LoadingSpinner size="lg" message="Loading products..." variant="dots" />
      </div>
    );
  }

  if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;
  if (!imageData) return <div className="text-center mt-10">Item not found.</div>;

  // Extract all media (images and videos) from views and mediaFiles
  const allMedia: string[] = [];

  // Add views
  if (imageData.views) {
    allMedia.push(...imageData.views);
  }

  // Add videos from mediaFiles
  if (imageData.mediaFiles) {
    imageData.mediaFiles.forEach(media => {
      if (media.type === 'video') {
        allMedia.push(media.url);
      }
    });
  }

  return (
    <ProductOrServiceDetail
      productId={imageData.productId}
      title={imageData.title || "Untitled Item"}
      description={imageData.desc}
      // sizes={imageData.type === "product" ? ["Small", "Medium", "Large"] : []}
      price={imageData.price || 1000}
      imageUrl={imageData.url.startsWith("http") ? imageData.url : `${API_BASE}${imageData.url}`}
      imageViews={allMedia.map(v => v.startsWith("http") ? v : `${API_BASE}${v}`)}
      onAddToCart={handleAddToCart}
      type={imageData.type}
      providerId={providerId}
      providerName={provider?.name}
      providerEmail={provider?.email}
      providerPhone={provider?.phone_number}
      providerWhatsapp={provider?.whatsapp_number}
      providerProfileImage={toAbsoluteMediaUrl(provider?.profile_image || provider?.profile_image_url)}
      madeInRwanda={imageData.madeInRwanda}
      viewMorePath={`/provider/${providerId}/uploads`}
    />
  );
}
