import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useState } from "react";
import { FiEdit2, FiSave, FiSearch, FiTrash2, FiUpload, FiVideo, FiX } from "react-icons/fi";

import SubscriptionBanner from '../components/DashboardParts/PlansScrollingBanner';
import RestrictionCard from '../components/PlansParts/RestrictionCards';
import { cachedFetch } from '../utils/cachedFetch';
import WhatsAppPromptBanner from '../components/DashboardParts/WhatsAppPromptBanner';
import LoadingSpinner from '@/components/LoadingSpinner';

// Types (unchanged)
interface Category { id: string; name: string; description: string; }
interface Product {
  id?: number;
  title: string;
  description: string;
  price: string;
  image_url: string;
  category_id: string;
  views?: string[];
  video_url?: string;
  madeInRwanda?: boolean;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function SellerDashboardPage() {
  const { darkMode } = useDarkMode();
  // const [darkMode, setDarkMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelected] = useState<string[]>([]);
  const [showForm, setShowForm] = useState<Record<string, boolean>>({});
  const [productForms, setProductForms] = useState<Record<string, Product>>({});
  const [previewMain, setPreviewMain] = useState<Record<string, string>>({});
  const [previewViews, setPreviewViews] = useState<Record<string, string[]>>({});
  const [mainFiles, setMainFiles] = useState<Record<string, File | null>>({});
  const [viewFiles, setViewFiles] = useState<Record<string, File[]>>({});
  const [videoFiles, setVideoFiles] = useState<Record<string, File | null>>({});
  const [previewVideo, setPreviewVideo] = useState<Record<string, string>>({});
  const [madeInRwanda, setMadeInRwanda] = useState<Record<string, boolean>>({});
  const [productUploads, setProductUploads] = useState<Record<string, Product[]>>({});
  const [originalUploads, setOriginalUploads] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  const { fetchWithAutoLogout, token } = useAuth();


  // No need for manual auth check - ProtectedRoute already handles this in App.tsx

  // Get categories with counts
  useEffect(() => {
    cachedFetch<{ uploadCategories: Category[] }>(
      `${API_BASE}/api/upload/categories?type=product`
    )
      .then(data => {
        if (data.uploadCategories) {
          setCategories(data.uploadCategories);
          const initialUploads: Record<string, Product[]> = {};
          data.uploadCategories.forEach((cat: Category) => {
            initialUploads[cat.id] = [];
          });
          setProductUploads(initialUploads);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Get products (unchanged logic)
  useEffect(() => {
    if (categories.length === 0) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/seller/products/images`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.products)) {
          const grouped: Record<string, Product[]> = {};
          data.products.forEach((p: Product) => {
            const catId = String(p.category_id);
            if (!grouped[catId]) grouped[catId] = [];
            grouped[catId].push(p);
          });
          setProductUploads(grouped);
          setOriginalUploads(grouped);
        }
      } catch (err) {
        console.error("❌ Failed to load products:", err);
      }
    })();
  }, [categories, token]);

  // Load current subscription/plan restrictions for this seller
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetchWithAutoLogout(`${API_BASE}/api/provider/restrict/features`);
        if (!res.ok) {
          console.error('Failed to load subscription status', res.status, res.statusText);
          setSubscription(null);
          return;
        }
        const data = await res.json();
        if (data.success) {
          setSubscription({ subscription: data.subscription });
        } else {
          setSubscription(null);
        }
      } catch (err) {
        console.error('Error fetching subscription status', err);
        setSubscription(null);
      }
    };

    fetchSubscription();
  }, [fetchWithAutoLogout]);

  // Helper functions (unchanged)
  const toggleCategory = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);

  const handleInput = (cid: string, field: keyof Product, value: string) =>
    setProductForms(prev => ({ ...prev, [cid]: { ...prev[cid], [field]: value } }));

  const handleMain = (cid: string, file: File | null) => {
    if (!file) return;
    setMainFiles(prev => ({ ...prev, [cid]: file }));
    setPreviewMain(prev => ({ ...prev, [cid]: URL.createObjectURL(file) }));
  };

  const handleViews = (cid: string, files: FileList | null) => {
    if (!files) return;
    const filesArray = Array.from(files);
    setViewFiles(prev => ({ ...prev, [cid]: filesArray }));
    setPreviewViews(prev => ({
      ...prev,
      [cid]: filesArray.map(file => URL.createObjectURL(file))
    }));
  };

  const handleVideo = (cid: string, file: File | null) => {
    if (!file) return;
    setVideoFiles(prev => ({ ...prev, [cid]: file }));
    setPreviewVideo(prev => ({ ...prev, [cid]: URL.createObjectURL(file) }));
  };

  // Submit handler (unchanged)
  const handleSubmit = async (e: React.FormEvent, cid: string) => {
    e.preventDefault();

    // Check if subscription is active
    if (subscription?.subscription?.status !== 'active') {
      alert("Your subscription is not active. Please upgrade your plan to upload products.");
      return;
    }

    const product = productForms[cid];
    const main = mainFiles[cid];
    if (!product?.title || !product.description || !product.price || !main) {
      alert("Please fill all fields and select a main image.");
      return;
    }

    const form = new FormData();
    form.append("title", product.title);
    form.append("description", product.description);
    form.append("price", product.price);
    form.append("categoryId", cid);
    form.append("image", main);
    (viewFiles[cid] || []).forEach(f => form.append("views", f));
    if (videoFiles[cid]) form.append("video", videoFiles[cid]!);
    form.append("madeInRwanda", String(madeInRwanda[cid] || false));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/upload/seller-product`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Update UI
      setProductUploads(prev => ({
        ...prev,
        [cid]: [...(prev[cid] || []), data.product]
      }));
      resetForm(cid);
    } catch (err) {
      alert("Upload failed. Please try again.");
    }
  };

  const resetForm = (cid: string) => {
    setProductForms(prev => ({ ...prev, [cid]: { title: "", description: "", price: "", image_url: "", category_id: cid } }));
    setPreviewMain(prev => { const { [cid]: _, ...rest } = prev; return rest; });
    setPreviewViews(prev => { const { [cid]: _, ...rest } = prev; return rest; });
    setMainFiles(prev => { const { [cid]: _, ...rest } = prev; return rest; });
    setViewFiles(prev => { const { [cid]: _, ...rest } = prev; return rest; });
    setVideoFiles(prev => { const { [cid]: _, ...rest } = prev; return rest; });
    setPreviewVideo(prev => { const { [cid]: _, ...rest } = prev; return rest; });
    setMadeInRwanda(prev => { const { [cid]: _, ...rest } = prev; return rest; });
    setShowForm(prev => ({ ...prev, [cid]: false }));
  };

  // Search filter
  const handleSearch = (term: string) => {
    if (!term) {
      setProductUploads(originalUploads);
      return;
    }
    const filtered: Record<string, Product[]> = {};
    Object.entries(originalUploads).forEach(([cid, prods]) => {
      filtered[cid] = prods.filter(p =>
        p.title.toLowerCase().includes(term.toLowerCase()) ||
        p.description.toLowerCase().includes(term.toLowerCase())
      );
    });
    setProductUploads(filtered);
  };

  if (loading) {
    return (
      <div className={`min-h-screen -mx-4 sm:mx-0 flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <LoadingSpinner variant="dots" size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen -mx-4 sm:mx-0 overflow-x-hidden transition-colors duration-200 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Subscription Banner */}
      <div
        className="sticky z-40 w-full overflow-x-hidden overflow-y-visible bg-yellow-100 border-b border-yellow-400 mb-2"
        style={{ top: 'var(--navbar-height)' }}
      >
        <SubscriptionBanner />
      </div>
      {/* Header */}
      <div className={`max-w-6xl mx-auto py-0 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
        <h1 className="text-2xl font-bold tracking-tighter uppercase text-center mb-4">Seller's Dashboard</h1>
      </div>

      <main className="max-w-full mx-auto py-4 px-0 sm:px-4">
        {/* Category Selector */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold tracking-tighter uppercase mb-4 flex items-center gap-2">
            <span 
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 px-3 py-1 text-sm font-bold"
              style={{ borderRadius: '2px' }}
            >
              {categories.length}
            </span>
            Product Categories
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            Select from the product category list to start uploading your products
          </p>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-4 py-2 font-semibold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border
                  ${selectedCategoryIds.includes(cat.id)
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                    : darkMode
                      ? "bg-gray-800 border-gray-750 hover:bg-gray-700 text-gray-300"
                      : "bg-white hover:bg-gray-100 border-gray-200 text-gray-750"}
                  ${productUploads[cat.id]?.length ? "pr-3" : "pr-4"}`}
                style={{ borderRadius: '2px' }}
              >
                {cat.name}
                {productUploads[cat.id]?.length > 0 && (
                  <span 
                    className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5"
                    style={{ borderRadius: '2px' }}
                  >
                    {productUploads[cat.id]?.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Selected Categories */}
        {selectedCategoryIds.length > 0 && (
          <section className="mb-12">
            <div className="grid gap-8">
              {selectedCategoryIds.map(cid => {
                const cat = categories.find(c => c.id === cid);
                if (!cat) return null;

                return (
                  <div
                    key={cid}
                    className={`border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}
                    style={{ borderRadius: '2px' }}
                  >
                    <div className={`p-6 border-b ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-gray-50"} flex justify-between items-center`}>
                      <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-3">
                        {cat.name}
                        <span 
                          className={`text-xs px-2 py-0.5 border font-bold uppercase ${darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-500/10"}`}
                          style={{ borderRadius: '2px' }}
                        >
                          {productUploads[cid]?.length || 0} products
                        </span>
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowForm(prev => ({ ...prev, [cid]: !prev[cid] }))}
                          className={`flex items-center gap-1 px-4 py-2 font-semibold text-xs uppercase tracking-wider transition-all border
                            ${showForm[cid]
                              ? "bg-red-500 hover:bg-red-655 hover:bg-red-600 text-white border-red-500"
                              : "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"}`}
                          style={{ borderRadius: '2px' }}
                        >
                          {showForm[cid] ? (
                            <>
                              <FiX size={14} /> Cancel
                            </>
                          ) : (
                            <>
                              <FiUpload size={14} /> Add Product
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => toggleCategory(cid)}
                          className={`flex items-center gap-1 px-3 py-2 font-semibold text-xs border uppercase tracking-wider transition-colors
                            ${darkMode
                              ? "bg-gray-850 border-gray-750 text-gray-300 hover:bg-gray-700"
                              : "bg-white border-gray-250 text-gray-700 hover:bg-gray-50"}`}
                          style={{ borderRadius: '2px' }}
                        >
                          <FiX size={14} /> Close
                        </button>
                      </div>
                    </div>

                    {/* Product Form */}
                    {showForm[cid] && (
                      <form
                        onSubmit={(e) => handleSubmit(e, cid)}
                        className={`p-6 ${darkMode ? "bg-gray-800/40" : "bg-gray-50/50"}`}
                      >
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Product Title</label>
                              <input
                                type="text"
                                value={productForms[cid]?.title || ""}
                                onChange={(e) => handleInput(cid, "title", e.target.value)}
                                className={`w-full p-2.5 border text-sm ${darkMode ? "bg-gray-900 border-gray-700 text-white placeholder-gray-550" : "bg-white border-gray-250 text-gray-900 placeholder-gray-400"} focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                                style={{ borderRadius: '2px' }}
                                placeholder="AMAZING PRODUCT..."
                              />
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Description</label>
                              <textarea
                                value={productForms[cid]?.description || ""}
                                onChange={(e) => handleInput(cid, "description", e.target.value)}
                                className={`w-full p-2.5 border text-sm ${darkMode ? "bg-gray-900 border-gray-700 text-white placeholder-gray-550" : "bg-white border-gray-250 text-gray-900 placeholder-gray-400"} focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                                style={{ borderRadius: '2px' }}
                                rows={3}
                                placeholder="DESCRIBE YOUR PRODUCT..."
                              />
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Price ($)</label>
                              <input
                                type="number"
                                value={productForms[cid]?.price || ""}
                                onChange={(e) => handleInput(cid, "price", e.target.value)}
                                className={`w-full p-2.5 border text-sm ${darkMode ? "bg-gray-900 border-gray-700 text-white placeholder-gray-550" : "bg-white border-gray-250 text-gray-900 placeholder-gray-400"} focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                                style={{ borderRadius: '2px' }}
                                placeholder="29.99"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={madeInRwanda[cid] || false}
                                  onChange={(e) => setMadeInRwanda(prev => ({ ...prev, [cid]: e.target.checked }))}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 focus:outline-none border-gray-300"
                                  style={{ borderRadius: '2px' }}
                                />
                                <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-650"}`}>Made in Rwanda 🇷🇼</span>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Main Image</label>
                              <div 
                                className={`border-2 border-dashed ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-300 bg-white"} p-4 flex flex-col items-center justify-center transition hover:border-emerald-500`}
                                style={{ borderRadius: '2px' }}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleMain(cid, e.target.files?.[0] || null)}
                                  className="hidden"
                                  id={`main-upload-${cid}`}
                                />
                                <label
                                  htmlFor={`main-upload-${cid}`}
                                  className="cursor-pointer flex flex-col items-center justify-center w-full"
                                >
                                  {previewMain[cid] ? (
                                    <img
                                      src={previewMain[cid]}
                                      alt="Preview"
                                      className="w-full h-40 object-contain mb-2"
                                      style={{ borderRadius: '2px' }}
                                    />
                                  ) : (
                                    <>
                                      <FiUpload size={24} className="mb-2 text-gray-400" />
                                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-450" : "text-gray-500"}`}>Click to upload main image</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Additional Images (Optional)</label>
                              <div 
                                className={`border-2 border-dashed ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-300 bg-white"} p-4 transition hover:border-emerald-500`}
                                style={{ borderRadius: '2px' }}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleViews(cid, e.target.files)}
                                  className="hidden"
                                  id={`views-upload-${cid}`}
                                />
                                <label
                                  htmlFor={`views-upload-${cid}`}
                                  className="cursor-pointer flex flex-col items-center justify-center"
                                >
                                  {previewViews[cid]?.length ? (
                                    <div className="flex flex-wrap gap-2 w-full">
                                      {previewViews[cid].map((src, i) => (
                                        <img
                                          key={i}
                                          src={src}
                                          className="w-16 h-16 object-cover border dark:border-gray-700"
                                          style={{ borderRadius: '2px' }}
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <>
                                      <FiUpload size={24} className="mb-2 text-gray-400" />
                                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-450" : "text-gray-500"}`}>Click to upload additional images</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Video (Optional)</label>
                              <div 
                                className={`border-2 border-dashed ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-300 bg-white"} p-4 transition hover:border-emerald-500`}
                                style={{ borderRadius: '2px' }}
                              >
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleVideo(cid, e.target.files?.[0] || null)}
                                  className="hidden"
                                  id={`video-upload-${cid}`}
                                />
                                <label
                                  htmlFor={`video-upload-${cid}`}
                                  className="cursor-pointer flex flex-col items-center justify-center"
                                >
                                  {previewVideo[cid] ? (
                                    <video
                                      src={previewVideo[cid]}
                                      className="w-full h-40 object-contain mb-2"
                                      style={{ borderRadius: '2px' }}
                                      controls
                                    />
                                  ) : (
                                    <>
                                      <FiUpload size={24} className="mb-2 text-gray-400" />
                                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-450" : "text-gray-500"}`}>Click to upload video</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <RestrictionCard
                          subscription={subscription?.subscription}
                          requiredFeature="upload_products"
                        />

                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => resetForm(cid)}
                            className={`px-4 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border
                              ${darkMode 
                                ? "bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700" 
                                : "bg-white border-gray-250 text-gray-700 hover:bg-gray-50"}`}
                            style={{ borderRadius: '2px' }}
                          >
                            Reset
                          </button>
                          <button
                            type="submit"
                            disabled={subscription?.subscription?.status !== 'active'}
                            className={`px-6 py-2 font-semibold text-xs uppercase tracking-wider transition-all
                              ${subscription?.subscription?.status === 'active'
                                ? "bg-emerald-50 text-white hover:bg-emerald-600 shadow-sm"
                                : "bg-gray-450 cursor-not-allowed text-gray-200"
                              }`}
                            style={{ borderRadius: '2px' }}
                          >
                            Upload Product
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Product Gallery */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-4 flex items-center gap-2">
              Your Product Collection
              <span 
                className={`text-xs px-2 py-0.5 border font-bold uppercase ${darkMode ? "bg-emerald-500/10 text-emerald-455 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-500/10"}`}
                style={{ borderRadius: '2px' }}
              >
                {Object.values(productUploads).flat().length} total
              </span>
            </h2>
            <div 
              className={`relative border max-w-md ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-250 text-gray-900"} focus-within:ring-1 focus-within:ring-emerald-500`}
              style={{ borderRadius: '2px' }}
            >
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="SEARCH PRODUCTS..."
                onChange={(e) => handleSearch(e.target.value)}
                className={`pl-10 pr-4 py-2.5 w-full bg-transparent focus:outline-none text-sm`}
              />
            </div>
          </div>

          {Object.keys(productUploads).length === 0 ? (
            <div 
              className={`text-center py-12 border ${darkMode ? "bg-gray-800/40 border-gray-700" : "bg-gray-50/50 border-gray-200"}`}
              style={{ borderRadius: '2px' }}
            >
              <p className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? "text-gray-450" : "text-gray-500"}`}>No products found. Start by adding some!</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(productUploads).map(([cid, products]) => {
                if (products.length === 0) return null;
                const cat = categories.find(c => c.id === cid);
                return (
                  <div key={cid}>
                    <h3 className="text-base font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
                      {cat?.name}
                      <span 
                        className={`text-xs px-2 py-0.5 border font-bold uppercase ${darkMode ? "bg-emerald-500/10 text-emerald-455 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-500/10"}`}
                        style={{ borderRadius: '2px' }}
                      >
                        {products.length} items
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          darkMode={darkMode}
                          onUpdate={() => {
                            // Refresh products after update
                            const token = localStorage.getItem("token");
                            fetch(`${API_BASE}/api/seller/products/images`, {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                              .then(res => res.json())
                              .then(data => {
                                if (data.products) {
                                  const grouped: Record<string, Product[]> = {};
                                  data.products.forEach((p: Product) => {
                                    const catId = String(p.category_id);
                                    if (!grouped[catId]) grouped[catId] = [];
                                    grouped[catId].push(p);
                                  });
                                  setProductUploads(grouped);
                                }
                              });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Enhanced Product Card Component
function ProductCard({ product, darkMode, onUpdate }: { product: Product; darkMode: boolean; onUpdate: () => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: product.title,
    description: product.description,
    price: product.price,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Helper to format URLs
  const getUrl = (path: string | undefined) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}/${path}`;
  };

  // Prepare images array
  const images = [
    getUrl(product.image_url),
    ...(product.views?.map(view => getUrl(view)) || []),
  ].filter(Boolean);

  // Prepare unified media array (images + video)
  const mediaItems = [
    ...images,
    ...(product.video_url ? [getUrl(product.video_url)] : []),
  ];

  // Helper function to check if a URL is a video
  const isVideo = (url: string) => {
    // Check if this URL is the product's video
    if (product.video_url && url.includes(product.video_url)) {
      return true;
    }
    // Fallback to extension check
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm');
  };

  // Auto-cycle through images if multiple exist
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/seller/products/${product.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      onUpdate(); // Refresh product list
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/seller/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Update failed");
      setIsEditing(false);
      onUpdate(); // Refresh product list
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update product");
    }
  };

  return (
    <>
      {/* Unified Media Modal (Images + Video) */}
      {(showImageModal || showVideoModal) && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowImageModal(false);
            setShowVideoModal(false);
          }}
        >
          <div
            className="relative max-w-6xl w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowImageModal(false);
                setShowVideoModal(false);
              }}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white p-2 border border-white/20 transition"
              style={{ borderRadius: '2px' }}
            >
              <FiX size={24} />
            </button>

            {/* Previous Button */}
            {mediaItems.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 border border-white/20 transition z-10"
                style={{ borderRadius: '2px' }}
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Media Content (Image or Video) */}
            {isVideo(mediaItems[modalImageIndex]) ? (
              <video
                src={mediaItems[modalImageIndex]}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] border border-gray-700/50"
                style={{ borderRadius: '2px' }}
                key={mediaItems[modalImageIndex]} // Force re-render when changing videos
                onError={(e) => console.error('Video load error:', e, 'URL:', mediaItems[modalImageIndex])}
              >
                <source src={mediaItems[modalImageIndex]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={mediaItems[modalImageIndex]}
                alt={product.title}
                className="max-w-full max-h-[90vh] object-contain border border-gray-700/50"
                style={{ borderRadius: '2px' }}
              />
            )}

            {/* Next Button */}
            {mediaItems.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalImageIndex((prev) => (prev + 1) % mediaItems.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 border border-white/20 transition z-10"
                style={{ borderRadius: '2px' }}
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Media Counter & Type Indicator */}
            <div 
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10"
              style={{ borderRadius: '2px' }}
            >
              <span>{modalImageIndex + 1} / {mediaItems.length}</span>
              {isVideo(mediaItems[modalImageIndex]) && (
                <span className="flex items-center gap-1">
                  <FiVideo size={14} /> Video
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div 
        className={`relative group border overflow-hidden shadow-sm transition-all duration-300 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} hover:border-emerald-500 hover:shadow-md`}
        style={{ borderRadius: '2px' }}
      >
        {/* Made in Rwanda Badge */}
        {product.madeInRwanda && (
          <div 
            className="absolute top-2 left-2 z-10 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-emerald-500/20"
            style={{ borderRadius: '2px' }}
          >
            🇷🇼 Made in Rwanda
          </div>
        )}

        {/* Video Badge */}
        {product.video_url && (
          <div 
            className="absolute top-2 right-2 z-10 bg-black/70 text-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-white/10"
            style={{ borderRadius: '2px' }}
          >
            <FiVideo size={12} /> Video
          </div>
        )}

        {/* Image Gallery */}
        <div className="relative h-48 overflow-hidden group">
          {images.length > 0 ? (
            <>
              <button
                onClick={() => {
                  setModalImageIndex(currentImageIndex);
                  setShowImageModal(true);
                }}
                className="w-full h-full focus:outline-none cursor-pointer"
              >
                <img
                  src={images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
              </button>
              {images.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                    }}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/10`}
                    style={{ borderRadius: '2px' }}
                    aria-label="Previous image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev + 1) % images.length);
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/10`}
                    style={{ borderRadius: '2px' }}
                    aria-label="Next image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`w-4 h-1 transition ${idx === currentImageIndex ? "bg-emerald-500" : "bg-white/40"}`}
                        style={{ borderRadius: '2px' }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${darkMode ? "bg-gray-750" : "bg-gray-100"}`}>
              <span className={`text-xs uppercase font-bold tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className={`w-full p-2 border text-sm ${darkMode ? "bg-gray-900 border-gray-750 text-white" : "bg-white border-gray-250 text-gray-900"} focus:ring-1 focus:ring-emerald-500 focus:outline-none`}
                style={{ borderRadius: '2px' }}
              />
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className={`w-full p-2 border text-sm ${darkMode ? "bg-gray-900 border-gray-750 text-white" : "bg-white border-gray-250 text-gray-900"} focus:ring-1 focus:ring-emerald-500 focus:outline-none`}
                style={{ borderRadius: '2px' }}
                rows={2}
              />
              <input
                type="number"
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                className={`w-full p-2 border text-sm ${darkMode ? "bg-gray-900 border-gray-750 text-white" : "bg-white border-gray-250 text-gray-900"} focus:ring-1 focus:ring-emerald-500 focus:outline-none`}
                style={{ borderRadius: '2px' }}
              />
            </div>
          ) : (
            <>
              <h3 className="font-bold text-sm uppercase tracking-tight mb-1 line-clamp-1">{product.title}</h3>
              <p className={`text-xs mb-2 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {product.description}
              </p>
              <p className="font-bold text-sm text-emerald-500">
                ${product.price}
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`px-4 pb-4 flex flex-col gap-2 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          {/* View Video Button */}
          {product.video_url && !isEditing && (
            <button
              onClick={() => {
                // Open modal at video index (last item in mediaItems)
                setModalImageIndex(mediaItems.length - 1);
                setShowVideoModal(true);
              }}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 font-semibold text-xs transition-colors uppercase tracking-wider"
              style={{ borderRadius: '2px' }}
            >
              <FiVideo size={14} /> View Video
            </button>
          )}

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className={`flex-1 py-2 border flex items-center justify-center gap-1 font-semibold text-xs transition-colors uppercase tracking-wider
                    ${darkMode ? "bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-250 text-gray-750 hover:bg-gray-50"}`}
                  style={{ borderRadius: '2px' }}
                >
                  <FiX size={14} /> Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1 font-semibold text-xs transition-all uppercase tracking-wider"
                  style={{ borderRadius: '2px' }}
                >
                  <FiSave size={14} /> Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex-1 py-2 border flex items-center justify-center gap-1 font-semibold text-xs transition-colors uppercase tracking-wider
                    ${darkMode ? "bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-250 text-gray-750 hover:bg-gray-50"}`}
                  style={{ borderRadius: '2px' }}
                >
                  <FiEdit2 size={14} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`flex-1 py-2 border flex items-center justify-center gap-1 font-semibold text-xs transition-colors uppercase tracking-wider
                    ${darkMode 
                      ? "bg-red-950/20 border-red-900/30 text-red-400 hover:bg-red-950/40" 
                      : "bg-red-50 border-red-200 text-red-650 hover:bg-red-100"}`}
                  style={{ borderRadius: '2px' }}
                >
                  {isDeleting ? (
                    <span className="animate-spin">↻</span>
                  ) : (
                    <>
                      <FiTrash2 size={14} /> Delete
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}