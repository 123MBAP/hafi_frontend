import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useCart } from '../context/CartContext';
import ProductOrServiceDetail from "./ProductOrServiceDetail";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function MadeInRwandaProductDetail() {
    const { productId } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | undefined>(undefined);

    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // Fetch all made-in-rwanda products and find the one with matching id
                const res = await fetch(`${API_BASE}/api/market/made-in-rwanda`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const items: any[] = Array.isArray(data.products) ? data.products : [];

                const found = items.find((p) => String(p.id) === String(productId));
                if (found) {
                    // If views are missing, try to fetch provider images to populate views
                    if ((!found.views || found.views.length === 0) && (found.providerId || found.provider_id)) {
                        try {
                            const provId = found.providerId || found.provider_id;
                            const provRes = await fetch(`${API_BASE}/api/providers/${provId}/images`);
                            if (provRes.ok) {
                                const provData = await provRes.json();
                                const allImgs = [];
                                if (Array.isArray(provData.product)) allImgs.push(...provData.product);
                                if (Array.isArray(provData.service)) allImgs.push(...provData.service);
                                const match = allImgs.find((img: any) => String(img.id) === String(found.id));
                                if (match) {
                                    // normalize urls to absolute
                                    const main = match.url?.startsWith('http') ? match.url : `${API_BASE}${match.url}`;
                                    const views = Array.isArray(match.views)
                                        ? match.views.map((v: string) => v.startsWith('http') ? v : `${API_BASE}${v}`)
                                        : [];
                                    const mediaFiles = Array.isArray(match.mediaFiles)
                                        ? match.mediaFiles
                                        : [];
                                    found.image_url = main;
                                    found.views = views;
                                    found.mediaFiles = mediaFiles;
                                    found.fileType = match.fileType || 'image';
                                }
                            }
                        } catch (e) {
                            // ignore errors, proceed with found as-is
                        }
                    }
                    setProduct(found);
                    return;
                }

                // Fallback: try the generic products endpoint
                const fallback = await fetch(`${API_BASE}/api/products/${productId}`);
                if (fallback.ok) {
                    const fb = await fallback.json();
                    setProduct(fb.product || null);
                } else {
                    setProduct(null);
                }
            } catch (err) {
                console.error('Failed to load Made in Rwanda product', err);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleAddToCart = (item: { productId: string; title: string; price: number; quantity: number; imageUrl: string; type: string; description?: string }) => {
        if (!product) return;
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
            providerId: product.providerId || null,
            type: item.type || product.type || 'product'
        });
        setMessage('Product added to cart successfully');
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!product) return <div className="p-10 text-center text-red-600">Product not found</div>;

    // Extract all media (views + videos from mediaFiles)
    const allMedia: string[] = [];

    // Add views
    if (product.views) {
        allMedia.push(...product.views);
    }

    // Add videos from mediaFiles
    if (product.mediaFiles) {
        product.mediaFiles.forEach((media: any) => {
            if (media.type === 'video') {
                const videoUrl = media.url.startsWith('http') ? media.url : `${API_BASE}${media.url}`;
                allMedia.push(videoUrl);
            }
        });
    }

    return (
        <div>
            <ProductOrServiceDetail
                productId={product.id}
                title={product.title}
                description={product.description}
                price={product.price}
                imageUrl={product.image_url}
                imageViews={allMedia}
                quantity={quantity}
                setQuantity={setQuantity}
                onAddToCart={handleAddToCart}
                message={message}
                type={product.type}
            />
            {/* Made in Rwanda Badge in sidebar */}
            {product.madeInRwanda && (
                <div className="fixed top-20 right-4 z-50">
                    <div className="bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                        🇷🇼 Made in Rwanda
                    </div>
                </div>
            )}
        </div>
    );
}
