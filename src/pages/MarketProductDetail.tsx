import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useCart } from '../context/CartContext'; // adjust path
import ProductOrServiceDetail from "./ProductOrServiceDetail";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [Message, setMessage] = useState<any>(null);

  const { addToCart } = useCart(); // ✅ use cart context
  // const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1); // ✅ quantity field

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

  const handleAddToCart = (item: { productId: string; title: string; price: number; quantity: number; imageUrl: string; type: string; description?: string }) => {
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
      type: item.type || product.type || 'product'
    });
    setMessage("Product added to cart successfully");
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
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
    />
  );
}
