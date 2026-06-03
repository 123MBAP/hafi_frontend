import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useState } from "react";
import { FiEdit2, FiSave, FiSearch, FiTrash2, FiUpload, FiVideo, FiX } from "react-icons/fi";
import DashboardOverviewCards from '../components/DashboardParts/DashboardOverviewCards';
import SubscriptionBanner from '../components/DashboardParts/PlansScrollingBanner';
import RestrictionCard from '../components/PlansParts/RestrictionCards';
import { cachedFetch } from '../utils/cachedFetch';
import WhatsAppPromptBanner from '../components/DashboardParts/WhatsAppPromptBanner';

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
      <div className={`max-w-6xl mx-auto  py-2 ${darkMode
        ? "bg-gray-900" : "bg-white"}`}>
        <h1 className="text-3xl font-semibold text-center mb-4">Seller's Dashboard</h1>
      </div>

      {/* Overview Cards (Bookings, Upgrade Plan, etc.) */}
      <section className="py-4 px-0 md:p-8 ">
        <WhatsAppPromptBanner
          providerId={localStorage.getItem('userId')}
          darkMode={darkMode}
        />
        <DashboardOverviewCards />
      </section>
      {/* Conditional Modals/Sections for Cards */}
      {/* Removed modals/sections for messages, bookings, and upgrade plans as they are now separate pages */}

      <main className="max-w-full mx-auto py-8 px-0 sm:px-4">
        {/* Category Selector */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 rounded-full">
              {categories.length}
            </span>
            Product Categories
          </h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2
                  ${selectedCategoryIds.includes(cat.id)
                    ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white shadow-lg"
                    : darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-white hover:bg-gray-100 border border-gray-200"}
                  ${productUploads[cat.id]?.length ? "pr-3" : "pr-4"}`}
              >
                {cat.name}
                {productUploads[cat.id]?.length > 0 && (
                  <span className="bg-white text-purple-600 dark:bg-gray-800 dark:text-teal-300 text-xs font-bold px-2 py-0.5 rounded-full">
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
                    className={`rounded-xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}
                  >
                    <div className={`p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"} flex justify-between items-center`}>
                      <h3 className="text-xl font-semibold flex items-center gap-3">
                        {cat.name}
                        <span className={`text-sm px-2 py-1 rounded-full ${darkMode ? "bg-gray-700 text-teal-300" : "bg-purple-100 text-purple-800"}`}>
                          {productUploads[cid]?.length || 0} products
                        </span>
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowForm(prev => ({ ...prev, [cid]: !prev[cid] }))}
                          className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all ${showForm[cid]
                            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"}`}
                        >
                          {showForm[cid] ? (
                            <>
                              <FiX size={16} /> Cancel
                            </>
                          ) : (
                            <>
                              <FiUpload size={16} /> Add Product
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => toggleCategory(cid)}
                          className="flex items-center gap-1 px-3 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          <FiX size={16} /> Close
                        </button>
                      </div>
                    </div>

                    {/* Product Form */}
                    {showForm[cid] && (
                      <form
                        onSubmit={(e) => handleSubmit(e, cid)}
                        className={`p-6 ${darkMode ? "bg-gray-700/30" : "bg-purple-50"} rounded-b-xl`}
                      >
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Product Title</label>
                              <input
                                type="text"
                                value={productForms[cid]?.title || ""}
                                onChange={(e) => handleInput(cid, "title", e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 focus:border-purple-500" : "bg-white border-gray-300 focus:border-purple-400"} focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition`}
                                placeholder="Amazing Product..."
                              />
                            </div>
                            <div>
                              <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Description</label>
                              <textarea
                                value={productForms[cid]?.description || ""}
                                onChange={(e) => handleInput(cid, "description", e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 focus:border-purple-500" : "bg-white border-gray-300 focus:border-purple-400"} focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition`}
                                rows={3}
                                placeholder="Describe your product..."
                              />
                            </div>
                            <div>
                              <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Price ($)</label>
                              <input
                                type="number"
                                value={productForms[cid]?.price || ""}
                                onChange={(e) => handleInput(cid, "price", e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 focus:border-purple-500" : "bg-white border-gray-300 focus:border-purple-400"} focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition`}
                                placeholder="29.99"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={madeInRwanda[cid] || false}
                                  onChange={(e) => setMadeInRwanda(prev => ({ ...prev, [cid]: e.target.checked }))}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Made in Rwanda 🇷🇼</span>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Main Image</label>
                              <div className={`border-2 border-dashed ${darkMode ? "border-gray-600" : "border-gray-300"} rounded-lg p-4 flex flex-col items-center justify-center transition hover:border-purple-400`}>
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
                                      className="w-full h-40 object-contain rounded-lg mb-2"
                                    />
                                  ) : (
                                    <>
                                      <FiUpload size={24} className="mb-2 text-gray-400" />
                                      <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Click to upload main image</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Additional Images (Optional)</label>
                              <div className={`border-2 border-dashed ${darkMode ? "border-gray-600" : "border-gray-300"} rounded-lg p-4 transition hover:border-purple-400`}>
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
                                          className="w-16 h-16 object-cover rounded border dark:border-gray-600"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <>
                                      <FiUpload size={24} className="mb-2 text-gray-400" />
                                      <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Click to upload additional images</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Video (Optional)</label>
                              <div className={`border-2 border-dashed ${darkMode ? "border-gray-600" : "border-gray-300"} rounded-lg p-4 transition hover:border-purple-400`}>
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
                                      className="w-full h-40 object-contain rounded-lg mb-2"
                                      controls
                                    />
                                  ) : (
                                    <>
                                      <FiUpload size={24} className="mb-2 text-gray-400" />
                                      <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Click to upload video</p>
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
                            className={`px-4 py-2 rounded-lg font-medium ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} transition`}
                          >
                            Reset
                          </button>
                          <button
                            type="submit"
                            disabled={subscription?.subscription?.status !== 'active'}
                            className={`px-6 py-2 rounded-lg font-medium ${subscription?.subscription?.status === 'active'
                              ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white hover:from-purple-700 hover:to-teal-600"
                              : "bg-gray-400 cursor-not-allowed text-gray-200"
                              } transition shadow-lg`}
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
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              Your Product Collection
              <span className={`text-sm px-2 py-1 rounded-full ${darkMode ? "bg-gray-700 text-teal-300" : "bg-purple-100 text-purple-800"}`}>
                {Object.values(productUploads).flat().length} total
              </span>
            </h2>
            <div className={`relative ${darkMode ? "bg-gray-700" : "bg-white"} rounded-lg shadow-inner max-w-md`}>
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                onChange={(e) => handleSearch(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none ${darkMode ? "bg-gray-700 text-white placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500"}`}
              />
            </div>
          </div>

          {Object.keys(productUploads).length === 0 ? (
            <div className={`text-center py-12 rounded-xl ${darkMode ? "bg-gray-800/50" : "bg-purple-50"} border ${darkMode ? "border-gray-700" : "border-purple-100"}`}>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No products found. Start by adding some!</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(productUploads).map(([cid, products]) => {
                if (products.length === 0) return null;
                const cat = categories.find(c => c.id === cid);
                return (
                  <div key={cid}>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      {cat?.name}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-gray-700 text-teal-300" : "bg-purple-100 text-purple-800"}`}>
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
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
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
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition z-10"
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
                className="max-w-full max-h-[90vh] rounded-lg"
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
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}

            {/* Next Button */}
            {mediaItems.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalImageIndex((prev) => (prev + 1) % mediaItems.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition z-10"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Media Counter & Type Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
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

      <div className={`relative group rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${darkMode ? "bg-gray-800" : "bg-white"} hover:shadow-xl`}>
        {/* Made in Rwanda Badge */}
        {product.madeInRwanda && (
          <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-blue-500 to-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            🇷🇼 Made in Rwanda
          </div>
        )}

        {/* Video Badge */}
        {product.video_url && (
          <div className="absolute top-2 right-2 z-10 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
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
                    className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
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
                    className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                    aria-label="Next image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`w-2 h-2 rounded-full transition ${idx === currentImageIndex ? (darkMode ? "bg-teal-400" : "bg-purple-600") : (darkMode ? "bg-gray-600" : "bg-gray-300")}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <span className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No Image</span>
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
                className={`w-full px-3 py-2 rounded border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
              />
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className={`w-full px-3 py-2 rounded border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                rows={2}
              />
              <input
                type="number"
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                className={`w-full px-3 py-2 rounded border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
              />
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.title}</h3>
              <p className={`text-sm mb-2 line-clamp-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {product.description}
              </p>
              <p className={`font-bold ${darkMode ? "text-teal-400" : "text-purple-600"}`}>
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
              className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2 font-medium transition shadow-md"
            >
              <FiVideo size={18} /> View Video
            </button>
          )}

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                >
                  <FiX size={16} /> Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-teal-500 text-white hover:from-purple-700 hover:to-teal-600 flex items-center justify-center gap-1"
                >
                  <FiSave size={16} /> Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                >
                  <FiEdit2 size={16} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 ${darkMode ? "bg-red-900/30 hover:bg-red-900/40 text-red-400" : "bg-red-100 hover:bg-red-200 text-red-600"}`}
                >
                  {isDeleting ? (
                    <span className="animate-spin">↻</span>
                  ) : (
                    <>
                      <FiTrash2 size={16} /> Delete
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