import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCart } from '../context/CartContext'; // adjust path
import ProductOrServiceDetail from "./ProductOrServiceDetail";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const toAbsoluteMediaUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return '';

  let trimmed = String(rawUrl).trim().replace(/\\/g, '/');
  if (!trimmed) return '';

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

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [Message, setMessage] = useState<any>(null);

  const { addToCart } = useCart(); // ✅ use cart context
  // const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1); // ✅ quantity field

  useEffect(() => {
    if (!product) return;
    const provId = product.providerId || product.provider_id || product.seller_id;
    if (!provId) return;

    const fetchProvider = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/providers/${provId}`);
        if (res.ok) {
          const data = await res.json();
          setProvider(data);
        }
      } catch (err) {
        console.error("Failed to fetch provider profile info:", err);
      }
    };
    fetchProvider();
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${productId}`);
        const data = await res.json();
        console.log("Fetching product from:", `${API_BASE}/api/products/${productId}`);
        console.log("Product object:", data.product);

        setProduct(data.product);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = (item: { productId: string; title: string; price: number; quantity: number; imageUrl: string; type: string; description?: string; used?: boolean; pricingUnit?: string }) => {
    const providerId = product.providerId || product.provider_id || product.seller_id || '';

    addToCart({
      productId: product.id,
      id: product.id,
      name: item.title,
      image: item.imageUrl,
      price: item.price,
      description: item.description,
      quantity: item.quantity,
      oldPrice: product.old_price || item.price,
      shipping: product.shipping || 0,
      checked: true,
      providerId: String(providerId),
      type: item.type || product.type || 'product',
      used: item.used || product.used || false,
      pricingUnit: item.pricingUnit || product.pricingUnit || product.pricing_unit || 'Per Item / Piece'
    });
    setMessage("Product added to cart successfully");
  };

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner size="lg" message="Loading product details..." variant="dots" />
      </div>
    );
  }
  if (!product) return <div className="p-10 text-center text-red-600">Product not found</div>;

  // Extract all media (views + videos from mediaFiles)
  const allMedia: string[] = [];

  // Add views
  if (product.views) {
    allMedia.push(...product.views);
  }

  // Add videos from mediaFiles if available
  if (product.mediaFiles) {
    product.mediaFiles.forEach((media: any) => {
      if (media.type === 'video') {
        const videoUrl = media.url.startsWith('http') ? media.url : `${API_BASE}${media.url}`;
        allMedia.push(videoUrl);
      }
    });
  } else if (product.video_url) {
    // Fallback: if video_url exists directly on product
    const videoUrl = product.video_url.startsWith('http') ? product.video_url : `${API_BASE}${product.video_url}`;
    allMedia.push(videoUrl);
  }

  return (

    <ProductOrServiceDetail
      productId={product.id}
      title={product.title}
      description={product.description}
      price={product.price}
      imageUrl={product.image_url}
      imageViews={allMedia}
      // sizes={product.sizes}
      // selectedSize={selectedSize}
      // setSelectedSize={setSelectedSize}
      quantity={quantity}
      setQuantity={setQuantity}
      onAddToCart={handleAddToCart}
      message={Message}
      type={product.type}
      providerId={product.providerId || product.provider_id || product.seller_id}
      providerName={provider?.name}
      providerEmail={provider?.email}
      providerPhone={provider?.phone_number}
      providerWhatsapp={provider?.whatsapp_number}
      providerProfileImage={toAbsoluteMediaUrl(provider?.profile_image || provider?.profile_image_url)}
      madeInRwanda={product.madeInRwanda || product.made_in_rwanda || false}
      used={product.used}
      pricingUnit={product.pricingUnit || product.pricing_unit}
      inStock={product.inStock !== false && product.in_stock !== false}
      viewMorePath={`/market?providerId=${product.providerId || product.provider_id || product.seller_id}`}
    />
  );
}
