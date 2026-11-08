import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useState } from "react";
import { FiEdit2, FiSave, FiSearch, FiTrash2, FiUpload, FiVideo, FiX } from "react-icons/fi";

import SubscriptionBanner from '../components/DashboardParts/PlansScrollingBanner';
import RestrictionCard from '../components/PlansParts/RestrictionCards';
import { cachedFetch } from '../utils/cachedFetch';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { API_BASE } from '../api/apiClient';
import { uploadMultipleFilesToR2 } from '../services/r2UploadService';

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
  used?: boolean;
  pricing_unit?: string;
}

const PRICING_UNITS = [
  { value: 'Per Item / Piece', label: 'Per Item / Piece (e.g., clothes, electronics, single objects)' },
  { value: 'Per Kilogram (kg)', label: 'Per Kilogram (kg) (e.g., vegetables, meat, flour)' },
  { value: 'Per Liter (L)', label: 'Per Liter (L) (e.g., drinks, oils, liquid chemicals)' },
  { value: 'Per Square Meter (m²)', label: 'Per Square Meter (m²) (e.g., flooring, carpets, land tiles)' },
  { value: 'Per Cubic Meter (m³)', label: 'Per Cubic Meter (m³) (e.g., sand, gravel, large cargo)' },
  { value: 'Per Meter (m)', label: 'Per Meter (m) (e.g., ropes, cables, fabrics)' },
  { value: 'Per Pack / Dozen', label: 'Per Pack / Dozen (e.g., box bundles, multipacks)' }
];


const getUrl = (path: string | undefined | null) => {
  if (!path) return '';
  const trimmed = String(path).trim();
  if (/^(https?:|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }
  const normalized = trimmed.replace(/\\/g, '/');
  if (normalized.startsWith('/')) {
    return `${API_BASE}${normalized}`;
  }
  return `${API_BASE}/${normalized}`;
};

function uploadWithProgress(
  method: string,
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    const token = localStorage.getItem("token");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      let responseBody;
      try {
        responseBody = JSON.parse(xhr.responseText);
      } catch (e) {
        responseBody = xhr.responseText;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseBody);
      } else {
        reject(new Error(responseBody?.error || `Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

export default function SellerDashboardPage() {
  const { darkMode } = useDarkMode();
  // const [darkMode, setDarkMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
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
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [uploadingCids, setUploadingCids] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [editUploadProgress, setEditUploadProgress] = useState<number | null>(null);

  // Edit modal states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [editMainFile, setEditMainFile] = useState<File | null>(null);
  const [editPreviewMain, setEditPreviewMain] = useState<string>("");
  const [editViewFiles, setEditViewFiles] = useState<File[]>([]);
  const [editPreviewViews, setEditPreviewViews] = useState<string[]>([]);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editPreviewVideo, setEditPreviewVideo] = useState<string>("");
  const [editMadeInRwanda, setEditMadeInRwanda] = useState<boolean>(false);
  const [editUsed, setEditUsed] = useState<boolean>(false);
  const [editPricingUnit, setEditPricingUnit] = useState<string>("Per Item / Piece");
  const [editIsSaving, setEditIsSaving] = useState<boolean>(false);
  const canUploadProducts = subscription?.subscription?.status === 'active';

  useEffect(() => {
    if (editingProduct) {
      setEditForm(editingProduct);
      setEditMainFile(null);
      setEditPreviewMain(getUrl(editingProduct.image_url));
      setEditViewFiles([]);
      setEditPreviewViews(editingProduct.views?.map(v => getUrl(v)) || []);
      setEditVideoFile(null);
      setEditPreviewVideo(getUrl(editingProduct.video_url));
      setEditMadeInRwanda(editingProduct.madeInRwanda || false);
      setEditUsed(editingProduct.used || false);
      setEditPricingUnit(editingProduct.pricing_unit || "Per Item / Piece");
    } else {
      setEditForm(null);
      setEditMainFile(null);
      setEditPreviewMain("");
      setEditViewFiles([]);
      setEditPreviewViews([]);
      setEditVideoFile(null);
      setEditPreviewVideo("");
      setEditMadeInRwanda(false);
      setEditUsed(false);
      setEditPricingUnit("Per Item / Piece");
    }
  }, [editingProduct]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editForm) return;

    setEditIsSaving(true);
    setEditUploadProgress(0);

    try {
      let r2MainImage = undefined;
      let r2ViewImages = undefined;
      let r2Video = undefined;

      // 1. Upload main image to R2 if selected
      if (editMainFile) {
        setEditUploadProgress(15);
        const uploadedMain = await uploadMultipleFilesToR2(
          [{ file: editMainFile, isMain: true, isView: false }],
          {
            category: 'products',
            onProgress: (p) => setEditUploadProgress(Math.round(p * 0.4)),
          }
        );
        if (uploadedMain[0]?.url) {
          r2MainImage = uploadedMain[0];
        }
      }

      // 2. Upload additional views to R2 if selected
      if (editViewFiles.length > 0) {
        const uploadedViews = await uploadMultipleFilesToR2(
          editViewFiles.map((file) => ({ file, isMain: false, isView: true })),
          {
            category: 'products',
            onProgress: (p) => setEditUploadProgress(40 + Math.round(p * 0.3)),
          }
        );
        r2ViewImages = uploadedViews;
      }

      // 3. Upload video to R2 if selected
      if (editVideoFile) {
        const uploadedVideos = await uploadMultipleFilesToR2(
          [{ file: editVideoFile, isMain: false, isView: false }],
          {
            category: 'products',
            onProgress: (p) => setEditUploadProgress(70 + Math.round(p * 0.3)),
          }
        );
        if (uploadedVideos[0]?.url) {
          r2Video = uploadedVideos[0];
        }
      }

      setEditUploadProgress(100);

      const payload = {
        title: editForm.title,
        description: editForm.description,
        price: editForm.price,
        madeInRwanda: editMadeInRwanda,
        used: editUsed,
        pricingUnit: editPricingUnit,
        categoryId: editForm.category_id || "uncategorized",
        ...(r2MainImage ? { r2MainImage } : { mainImageUrl: editPreviewMain || editingProduct.image_url }),
        ...(r2ViewImages ? { r2ViewImages } : { views: editPreviewViews }),
        ...(r2Video ? { r2Video } : { videoUrl: editPreviewVideo || editingProduct.video_url || null })
      };

      const res = await fetch(`${API_BASE}/api/seller/product/${editingProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save product changes.");
      }

      // Re-fetch products to ensure correct grouping
      await loadProducts();

      setEditingProduct(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save product changes.");
    } finally {
      setEditIsSaving(false);
      setEditUploadProgress(null);
    }
  };

  const { fetchWithAutoLogout, token } = useAuth();


  // Load profile and categories
  useEffect(() => {
    let active = true;
    const initData = async () => {
      try {
        setLoading(true);
        // 1. Fetch profile first
        const profileRes = await fetchWithAutoLogout(`${API_BASE}/api/profile`);
        if (!profileRes.ok) throw new Error("Failed to load profile");
        const profileData = await profileRes.json();
        console.log("DEBUG: Fetched profileData:", profileData);
        if (!active) return;
        setSellerProfile(profileData);

        // Always fetch all product upload categories for selection dropdowns
        try {
          const allCatRes = await fetch(`${API_BASE}/api/upload/categories?type=product`);
          if (allCatRes.ok) {
            const allCatData = await allCatRes.json();
            if (allCatData.uploadCategories) {
              setAllCategories(allCatData.uploadCategories);
            }
          }
        } catch (e) {
          console.error("Error fetching all categories:", e);
        }

        // 2. Determine categories
        if (profileData.shopping_type_id && profileData.shopping_type_key !== 'other') {
          console.log("DEBUG: User has specific shop category:", profileData.shopping_type_name);
          // If seller has a specific category (other than 'other'), use that as their single category!
          const sellerCat: Category = {
            id: String(profileData.shopping_type_id),
            name: profileData.shopping_type_name || "My Shop Category",
            description: `Products under ${profileData.shopping_type_name}`
          };
          setCategories([sellerCat]);
          setSelected([sellerCat.id]);
          setShowForm({ [sellerCat.id]: true }); // Auto-open the upload form for convenience!
          setProductUploads({ [sellerCat.id]: [] });
        } else {
          console.log("DEBUG: User has other category or no category:", profileData.shopping_type_key);
          // Otherwise fetch all product upload categories
          const catRes = await fetch(`${API_BASE}/api/upload/categories?type=product`);
          if (!catRes.ok) throw new Error("Failed to load categories");
          const catData = await catRes.json();
          if (!active) return;
          if (catData.uploadCategories) {
            setCategories(catData.uploadCategories);
            const initialUploads: Record<string, Product[]> = {};
            catData.uploadCategories.forEach((cat: Category) => {
              initialUploads[cat.id] = [];
            });
            setProductUploads(initialUploads);
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    initData();
    return () => { active = false; };
  }, [fetchWithAutoLogout]);

  const loadProducts = async () => {
    if (!token) return;
    try {
      setProductsLoading(true);
      const res = await fetch(`${API_BASE}/api/seller/products/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.products)) {
        const isPremium = sellerProfile?.shopping_type_id && sellerProfile.shopping_type_key !== 'other';
        const grouped: Record<string, Product[]> = {};

        if (isPremium) {
          const mainCid = String(sellerProfile.shopping_type_id);
          grouped[mainCid] = data.products;
        } else {
          data.products.forEach((p: Product) => {
            const catId = String(p.category_id || 'uncategorized');
            if (!grouped[catId]) grouped[catId] = [];
            grouped[catId].push(p);
          });
        }
        setProductUploads(grouped);
        setOriginalUploads(grouped);
      }
    } catch (err) {
      console.error("❌ Failed to load products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (categories.length > 0) {
      loadProducts();
    }
  }, [categories, token, sellerProfile]);

  // Load current subscription/plan restrictions for this seller
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setSubscriptionLoading(true);
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
      } finally {
        setSubscriptionLoading(false);
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

    if (!canUploadProducts) {
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
    form.append("used", String(product.used === 'true' || product.used === true));
    form.append("pricingUnit", product.pricing_unit || "Per Item / Piece");
    
    const isPremium = sellerProfile?.shopping_type_id && sellerProfile.shopping_type_key !== 'other';
    const targetCategoryId = product.category_id || (isPremium ? "uncategorized" : cid);
    form.append("categoryId", targetCategoryId);
    form.append("image", main);
    (viewFiles[cid] || []).forEach(f => form.append("views", f));
    if (videoFiles[cid]) form.append("video", videoFiles[cid]!);
    form.append("madeInRwanda", String(madeInRwanda[cid] || false));

    try {
      setUploadingCids(prev => ({ ...prev, [cid]: true }));
      setUploadProgress(prev => ({ ...prev, [cid]: 0 }));

      let directR2Success = false;

      // Try Direct Cloudflare R2 Upload First
      try {
        const itemsToUpload: Array<{ file: File; isMain?: boolean; isView?: boolean }> = [];
        itemsToUpload.push({ file: main, isMain: true });
        (viewFiles[cid] || []).forEach(f => itemsToUpload.push({ file: f, isView: true }));
        if (videoFiles[cid]) itemsToUpload.push({ file: videoFiles[cid]! });

        const r2Files = await uploadMultipleFilesToR2(itemsToUpload, {
          category: 'seller_products',
          onProgress: (percent) => {
            setUploadProgress(prev => ({ ...prev, [cid]: percent }));
          }
        });

        const r2Main = r2Files.find(f => f.isMain) || r2Files[0];
        const r2Views = r2Files.filter(f => f.isView);
        const r2Video = r2Files.find(f => f.type === 'video');

        const res = await fetch(`${API_BASE}/api/upload/seller-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify({
            title: product.title,
            description: product.description,
            price: product.price,
            used: product.used === 'true' || product.used === true,
            pricingUnit: product.pricing_unit || "Per Item / Piece",
            categoryId: targetCategoryId,
            madeInRwanda: Boolean(madeInRwanda[cid]),
            r2MainImage: r2Main,
            r2ViewImages: r2Views,
            r2Video: r2Video || null,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save product with R2 media');
        }

        directR2Success = true;
      } catch (r2Err: any) {
        console.warn('Direct R2 upload error, falling back to server upload:', r2Err.message);
      }

      if (!directR2Success) {
        // Fallback: Legacy uploadWithProgress
        await uploadWithProgress(
          "POST",
          `${API_BASE}/api/upload/seller-product`,
          form,
          (percent) => {
            setUploadProgress(prev => ({ ...prev, [cid]: percent }));
          }
        );
      }

      // Re-fetch products to ensure correct grouping
      await loadProducts();
      resetForm(cid);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploadingCids(prev => ({ ...prev, [cid]: false }));
      setUploadProgress(prev => { const { [cid]: _, ...rest } = prev; return rest; });
    }
  };

  const resetForm = (cid: string) => {
    const isPremium = sellerProfile?.shopping_type_id && sellerProfile.shopping_type_key !== 'other';
    setProductForms(prev => ({ ...prev, [cid]: { title: "", description: "", price: "", image_url: "", category_id: isPremium ? "uncategorized" : cid, used: false, pricing_unit: "Per Item / Piece" } }));
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

  if (loading || subscriptionLoading) {
    return (
      <div className={`min-h-screen -mx-4 sm:mx-0 flex items-center justify-center ${darkMode ? "bg-black" : "bg-white"}`}>
        <LoadingSpinner variant="dots" size="lg" message="Loading dashboard & fields..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen -mx-4 sm:mx-0 overflow-x-hidden transition-colors duration-200 ${darkMode ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-[#151515]"}`}>
      <div
        className="sticky z-40 w-full overflow-x-hidden overflow-y-visible bg-red-50 border-b border-red-300 mb-2"
        style={{ top: 'var(--navbar-height)' }}
      >
        <SubscriptionBanner />
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <PageHeader
          badge="Merchant Studio"
          title="Seller Dashboard"
          subtitle="Manage product categories, upload inventory items, and track storefront visibility"
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Seller Studio' }]}
        />
      </div>

      <main className="max-w-7xl mx-auto py-2 px-4">
        {/* Category Selector */}
        {(!sellerProfile?.shopping_type_id || sellerProfile.shopping_type_key === 'other') && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-4 flex items-center gap-2">
              <span 
                className="bg-red-600/10 text-red-700 dark:text-red-400 border border-red-600/20 px-3 py-1 text-sm font-bold"
               
              >
                {categories.length}
              </span>
              Product Categories
            </h2>
            <p className='text-black/70 dark:text-white/70 mb-6'>
              Select from the product category list to start uploading your products
            </p>
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-4 py-2 font-semibold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border
                    ${selectedCategoryIds.includes(cat.id)
                      ? "bg-[#E5252A] border-[#E5252A] text-white rounded-xl shadow-xs"
                      : darkMode
                        ? "bg-black border-white/30 hover:bg-black text-white/80"
                        : "bg-white dark:bg-gray-900 border-[#E5E5E5] dark:border-gray-800 text-[#151515] dark:text-gray-200 rounded-xl hover:border-[#E5252A]/50"}
                    ${productUploads[cat.id]?.length ? "pr-3" : "pr-4"}`}
                 
                >
                  {cat.name}
                  {productUploads[cat.id]?.length > 0 && (
                    <span 
                      className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5"
                     
                    >
                      {productUploads[cat.id]?.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

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
                    className={`border ${darkMode ? "bg-gray-900 border-gray-800 rounded-2xl" : "bg-white border-[#E5E5E5] rounded-2xl"} shadow-sm overflow-hidden`}
                   
                  >
                    <div className={`p-6 border-b ${darkMode ? "border-gray-800 bg-gray-900" : "border-[#E5E5E5] bg-[#F5F5F5]/40"} flex justify-between items-center`}>
                      <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-3">
                        {cat.name}
                        <span 
                          className={`text-xs px-2 py-0.5 border font-bold uppercase ${darkMode ? "bg-red-600/10 text-red-400 border-red-600/20" : "bg-red-50 text-red-700 border-red-600/10"}`}
                         
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
                              : "bg-red-600 hover:bg-red-700 text-white border-red-600"}`}
                         
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
                        {(!sellerProfile?.shopping_type_id || sellerProfile.shopping_type_key === 'other') && (
                          <button
                            onClick={() => toggleCategory(cid)}
                            className={`flex items-center gap-1 px-3 py-2 font-semibold text-xs border uppercase tracking-wider transition-colors
                              ${darkMode
                                ? "bg-black border-white/30 text-white/80 hover:bg-black"
                                : "bg-white border-[#E5E5E5] text-[#151515] rounded-lg hover:bg-gray-100"}`}
                           
                          >
                            <FiX size={14} /> Close
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Product Form */}
                    {showForm[cid] && (
                      <form
                        onSubmit={(e) => handleSubmit(e, cid)}
                        className={`p-6 ${darkMode ? "bg-black/40" : "bg-white/50"}`}
                      >
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">                             <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-white/80" : "text-black/70"}`}>Product Title</label>
                              <input
                                type="text"
                                value={productForms[cid]?.title || ""}
                                onChange={(e) => handleInput(cid, "title", e.target.value)}
                                className={`w-full p-2.5 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400"} focus:ring-1 focus:ring-red-600 focus:outline-none transition-all`}
                               
                                placeholder="AMAZING PRODUCT..."
                              />
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-white/80" : "text-black/70"}`}>Description</label>
                              <textarea
                                value={productForms[cid]?.description || ""}
                                onChange={(e) => handleInput(cid, "description", e.target.value)}
                                className={`w-full p-2.5 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400"} focus:ring-1 focus:ring-red-600 focus:outline-none transition-all`}
                               
                                rows={3}
                                placeholder="DESCRIBE YOUR PRODUCT..."
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-white/80" : "text-black/70"}`}>Price ($)</label>
                                <input
                                  type="number"
                                  value={productForms[cid]?.price || ""}
                                  onChange={(e) => handleInput(cid, "price", e.target.value)}
                                  className={`w-full p-2.5 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400"} focus:ring-1 focus:ring-red-600 focus:outline-none transition-all`}
                                 
                                  placeholder="29.99"
                                />
                              </div>
                              <div>
                                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-white/80" : "text-black/70"}`}>Pricing Unit</label>
                                <select
                                  value={productForms[cid]?.pricing_unit || "Per Item / Piece"}
                                  onChange={(e) => handleInput(cid, "pricing_unit", e.target.value)}
                                  className={`w-full p-2.5 border text-sm ${darkMode ? "bg-gray-900 border-gray-700 text-white rounded-lg" : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] rounded-lg"} focus:ring-1 focus:ring-red-600 focus:outline-none transition-all`}
                                 
                                >
                                  {PRICING_UNITS.map(unit => (
                                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-white/80" : "text-black/70"}`}>Category</label>
                              <select
                                value={productForms[cid]?.category_id || (sellerProfile?.shopping_type_id && sellerProfile.shopping_type_key !== 'other' ? "uncategorized" : cid)}
                                onChange={(e) => handleInput(cid, "category_id", e.target.value)}
                                className={`w-full p-2.5 border text-sm ${darkMode ? "bg-gray-900 border-gray-700 text-white rounded-lg" : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] rounded-lg"} focus:ring-1 focus:ring-red-600 focus:outline-none transition-all`}
                               
                              >
                                <option value="uncategorized">Uncategorised</option>
                                {allCategories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-col gap-3">
                              <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={madeInRwanda[cid] || false}
                                    onChange={(e) => setMadeInRwanda(prev => ({ ...prev, [cid]: e.target.checked }))}
                                    className="w-4 h-4 rounded text-[#E5252A] focus:ring-[#E5252A] focus:outline-none border-gray-300"
                                  />
                                  <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-[#151515]"}`}>Made in Rwanda 🇷🇼</span>
                                </label>
                              </div>
                              <div className="space-y-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={productForms[cid]?.used === 'true' || productForms[cid]?.used === true}
                                    onChange={(e) => handleInput(cid, "used", e.target.checked ? "true" : "false")}
                                    className="w-4 h-4 rounded text-[#E5252A] focus:ring-[#E5252A] focus:outline-none border-gray-300"
                                  />
                                  <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-[#151515]"}`}>Used / Second Hand</span>
                                </label>
                                <p className={`text-[10.5px] ${darkMode ? "text-white/70" : "text-black/60"} pl-6 leading-tight`}>
                                  This product has been used before (second-hand item).
                                </p>
                              </div>
                            </div>
                          </div>                           <div className="space-y-4">
                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-white/80" : "text-black/70"}`}>Main Image</label>
                              <div 
                                className={`border-2 border-dashed ${darkMode ? "border-gray-700 bg-gray-900 rounded-xl" : "border-[#E5E5E5] bg-[#F5F5F5] rounded-xl"} p-4 flex flex-col items-center justify-center transition hover:border-red-600`}
                               
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
                                     
                                    />
                                  ) : (
                                    <>
                                      <FiUpload size={24} className="mb-2 text-white/70" />
                                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-white/70" : "text-black/60"}`}>Click to upload main image</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-white/80" : "text-black/70"}`}>Additional Images (Optional)</label>
                              <div 
                                className={`border-2 border-dashed ${darkMode ? "border-gray-700 bg-gray-900 rounded-xl" : "border-[#E5E5E5] bg-[#F5F5F5] rounded-xl"} p-4 transition hover:border-red-600`}
                               
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
                                          className="w-16 h-16 object-cover border dark:border-white/30"
                                         
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <>
                                      <FiUpload size={24} className="mb-2 text-white/70" />
                                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-white/70" : "text-black/60"}`}>Click to upload additional images</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? "text-white/80" : "text-black/70"}`}>Video (Optional)</label>
                              <div 
                                className={`border-2 border-dashed ${darkMode ? "border-gray-700 bg-gray-900 rounded-xl" : "border-[#E5E5E5] bg-[#F5F5F5] rounded-xl"} p-4 transition hover:border-red-600`}
                               
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
                                     
                                      controls
                                    />
                                  ) : (
                                    <>
                                      <FiUpload size={24} className="mb-2 text-white/70" />
                                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-white/70" : "text-black/60"}`}>Click to upload video</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                        <RestrictionCard
                      
                          subscription={subscription?.subscription}
                          requiredFeature="upload_products"
                        />
                        </div>
                        {uploadProgress[cid] !== undefined && (
                          <div className="w-full mt-4 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className={darkMode ? "text-white/70" : "text-black/60"}>
                                {uploadProgress[cid] < 100 
                                  ? "Uploading Files..." 
                                  : "Processing and optimizing media in storage..."}
                              </span>
                              <span className="text-red-600">{uploadProgress[cid]}%</span>
                            </div>
                            <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-black" : "bg-black/10"}`}>
                              <div 
                                className="h-full bg-red-600 transition-all duration-300 ease-out" 
                                style={{ width: `${uploadProgress[cid]}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => resetForm(cid)}
                            className={`px-4 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border
                              ${darkMode 
                                ? "bg-black border-white/30 text-white/80 hover:bg-black" 
                                : "bg-white border-[#E5E5E5] text-[#151515] rounded-lg hover:bg-gray-100"}`}
                           
                          >
                            Reset
                          </button>
                          <button
                            type="submit"
                            disabled={uploadingCids[cid] || !canUploadProducts}
                            className={`px-6 py-2 font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2
                              ${canUploadProducts
                                ? "bg-red-300 text-white hover:bg-red-700 shadow-sm"
                                : "bg-black/40 cursor-not-allowed text-white/90"
                              }`}
                           
                          >
                            {uploadingCids[cid] ? (
                              <>
                                <span className="animate-spin">↻</span> Uploading...
                              </>
                            ) : (
                              "Upload Product"
                            )}
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
                className={`text-xs px-2 py-0.5 border font-bold uppercase ${darkMode ? "bg-red-600/10 text-red-400 border-red-600/20" : "bg-red-50 text-red-700 border-red-600/10"}`}
               
              >
                {Object.values(productUploads).flat().length} total
              </span>
            </h2>
            <div 
              className={`relative border max-w-md ${darkMode ? "bg-gray-900 border-gray-700 text-white rounded-lg" : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] rounded-lg"} focus-within:ring-1 focus-within:ring-red-600`}
             
            >
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" />
              <input
                type="text"
                placeholder="SEARCH PRODUCTS..."
                onChange={(e) => handleSearch(e.target.value)}
                className={`pl-10 pr-4 py-2.5 w-full bg-transparent focus:outline-none text-sm`}
              />
            </div>
          </div>

          {productsLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner variant="dots" size="md" message="Loading your products..." />
            </div>
          ) : Object.keys(productUploads).length === 0 ? (
            <div 
              className={`text-center py-12 border ${darkMode ? "bg-gray-900 border-gray-800 rounded-2xl" : "bg-white border-[#E5E5E5] rounded-2xl"}`}
             
            >
              <p className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? "text-white/70" : "text-black/60"}`}>No products found. Start by adding some!</p>
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
                        className={`text-xs px-2 py-0.5 border font-bold uppercase ${darkMode ? "bg-red-600/10 text-red-400 border-red-600/20" : "bg-red-50 text-red-700 border-red-600/10"}`}
                       
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
                          onEdit={(p) => setEditingProduct(p)}
                          onUpdate={loadProducts}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      {/* Product Edit Modal */}
      {editingProduct && editForm && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div 
            className={`w-full max-w-2xl border ${darkMode ? "bg-gray-900 border-gray-700 text-white rounded-lg" : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] rounded-lg"} max-h-[90vh] flex flex-col shadow-2xl`}
            
          >
            {/* Modal Header */}
            <div className={`p-4 border-b ${darkMode ? "border-gray-800" : "border-[#E5E5E5]"} flex items-center justify-between`}>
              <h3 className="font-bold text-lg uppercase tracking-tight">Edit Product</h3>
              <button 
                onClick={() => setEditingProduct(null)}
                className={`p-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors`}
               
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className={`w-full p-3 border text-sm focus:ring-1 focus:ring-red-600 focus:outline-none ${darkMode ? "bg-gray-900 border-gray-800 rounded-2xl" : "bg-white border-[#E5E5E5] rounded-2xl"}`}
                   
                  />
                </div>

                {/* Price and Pricing Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className={`w-full p-3 border text-sm focus:ring-1 focus:ring-red-600 focus:outline-none ${darkMode ? "bg-gray-900 border-gray-800 rounded-2xl" : "bg-white border-[#E5E5E5] rounded-2xl"}`}
                     
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider mb-1">Pricing Unit</label>
                    <select
                      value={editPricingUnit}
                      onChange={(e) => setEditPricingUnit(e.target.value)}
                      className={`w-full p-3 border text-sm focus:ring-1 focus:ring-red-600 focus:outline-none ${darkMode ? "bg-gray-900 border-gray-700 text-white rounded-lg" : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] rounded-lg"}`}
                     
                    >
                      {PRICING_UNITS.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider mb-1">Category</label>
                  <select
                    value={editForm.category_id || "uncategorized"}
                    onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                    className={`w-full p-3 border text-sm focus:ring-1 focus:ring-red-600 focus:outline-none ${darkMode ? "bg-gray-900 border-gray-700 text-white rounded-lg" : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] rounded-lg"}`}
                   
                  >
                    <option value="uncategorized">Uncategorised</option>
                    {allCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider mb-1">Description</label>
                  <textarea
                    required
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className={`w-full p-3 border text-sm focus:ring-1 focus:ring-red-600 focus:outline-none ${darkMode ? "bg-gray-900 border-gray-800 rounded-2xl" : "bg-white border-[#E5E5E5] rounded-2xl"}`}
                   
                  />
                </div>

                {/* Made in Rwanda & Used */}
                <div className="flex flex-col gap-3 py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-madeInRwanda"
                      checked={editMadeInRwanda}
                      onChange={(e) => setEditMadeInRwanda(e.target.checked)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-[#E5252A]"
                    />
                    <label htmlFor="edit-madeInRwanda" className="text-sm font-semibold select-none cursor-pointer">
                      🇷🇼 Made in Rwanda
                    </label>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit-used"
                        checked={editUsed}
                        onChange={(e) => setEditUsed(e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-[#E5252A]"
                      />
                      <label htmlFor="edit-used" className="text-sm font-semibold select-none cursor-pointer">
                        Used / Second Hand
                      </label>
                    </div>
                    <p className={`text-[10.5px] ${darkMode ? "text-white/70" : "text-black/60"} pl-6 leading-tight`}>
                      This product has been used before (second-hand item).
                    </p>
                  </div>
                </div>

                <div className={`h-[1px] ${darkMode ? "bg-white/30" : "bg-black/20"} my-4`} />

                {/* Main Image Upload */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider mb-1">Main Image</label>
                  <div className="flex gap-4 items-center">
                    {editPreviewMain && (
                      <div className="relative w-20 h-20 border border-white/30/30 bg-black/10 flex items-center justify-center overflow-hidden">
                        <img src={editPreviewMain} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditMainFile(file);
                          setEditPreviewMain(URL.createObjectURL(file));
                        }
                      }}
                      className="text-xs text-[#666666] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E5252A] file:text-white hover:file:bg-[#c91d22]"
                    />
                  </div>
                </div>

                {/* Additional View Images */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider mb-1">Additional Views (Optional)</label>
                  <div className="space-y-3">
                    {editPreviewViews.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editPreviewViews.map((url, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg border border-[#E5E5E5] bg-black/5 flex items-center justify-center overflow-hidden">
                            <img src={url} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          setEditViewFiles(files);
                          setEditPreviewViews(files.map(f => URL.createObjectURL(f)));
                        }
                      }}
                      className="text-xs text-[#666666] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E5252A] file:text-white hover:file:bg-[#c91d22]"
                    />
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider mb-1">Product Video (Optional)</label>
                  <div className="space-y-3">
                    {editPreviewVideo && (
                      <div className="relative w-full max-h-48 rounded-lg border border-[#E5E5E5] bg-black/10 flex items-center justify-center overflow-hidden">
                        <video src={editPreviewVideo} controls className="max-w-full max-h-48" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditVideoFile(file);
                          setEditPreviewVideo(URL.createObjectURL(file));
                        }
                      }}
                      className="text-xs text-[#666666] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E5252A] file:text-white hover:file:bg-[#c91d22]"
                    />
                  </div>
                </div>

                {editUploadProgress !== null && (
                  <div className="w-full space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                      <span className={darkMode ? "text-white/70" : "text-black/60"}>
                        {editUploadProgress < 100 
                          ? "Saving and Uploading..." 
                          : "Processing and optimizing media in storage..."}
                      </span>
                      <span className="text-red-600 font-bold">{editUploadProgress}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-black" : "bg-black/10"}`}>
                      <div 
                        className="h-full bg-red-600 transition-all duration-300 ease-out" 
                        style={{ width: `${editUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-white/30">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    disabled={editIsSaving}
                    className={`px-5 py-2.5 border font-bold text-xs uppercase tracking-wider transition-colors
                      ${darkMode ? "bg-black border-gray-800 text-gray-300 rounded-lg hover:bg-gray-800" : "bg-white border-[#E5E5E5] text-[#151515] rounded-lg hover:bg-gray-100"}`}
                   
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editIsSaving}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                   
                  >
                    {editIsSaving ? (
                      <>
                        <span className="animate-spin">↻</span> Saving...
                      </>
                    ) : (
                      <>
                        <FiSave size={14} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}

// Enhanced Product Card Component
function ProductCard({ product, darkMode, onUpdate, onEdit }: { product: Product; darkMode: boolean; onUpdate: () => void; onEdit: (product: Product) => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [showConfirmStock, setShowConfirmStock] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);



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
                className="max-w-full max-h-[90vh] border border-white/30/50"
               
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
                className="max-w-full max-h-[90vh] object-contain border border-white/30/50"
               
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
        className={`relative group border overflow-hidden shadow-sm transition-all duration-300 ${darkMode ? "bg-gray-900 border-gray-800 rounded-2xl" : "bg-white border-[#E5E5E5] rounded-2xl"} hover:border-red-600 hover:shadow-md`}
       
      >
        {/* Out of Stock Badge */}
        {product.in_stock === false && (
          <div 
            className="absolute top-2 left-2 z-20 bg-red-600 text-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider shadow-md"
           
          >
            Out of Stock
          </div>
        )}

        {/* Made in Rwanda Badge */}
        {product.madeInRwanda && (
          <div 
            className={`absolute z-10 bg-gradient-to-r from-red-700 to-red-600 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-red-600/20 ${product.in_stock === false ? 'top-10' : 'top-2'} left-2`}
           
          >
            🇷🇼 Made in Rwanda
          </div>
        )}

        {/* Video Badge */}
        {product.video_url && (
          <div 
            className="absolute top-2 right-2 z-10 bg-black/70 text-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-white/10"
           
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
                        className={`w-4 h-1 transition ${idx === currentImageIndex ? "bg-red-600" : "bg-white/40"}`}
                       
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${darkMode ? "bg-black" : "bg-white"}`}>
              <span className={`text-xs uppercase font-bold tracking-wider ${darkMode ? "text-black/60" : "text-white/70"}`}>No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-bold text-sm uppercase tracking-tight mb-1 line-clamp-1">{product.title}</h3>
          <p className={`text-xs mb-2 line-clamp-2 ${darkMode ? "text-white/70" : "text-black/60"}`}>
            {product.description}
          </p>
          <p className="font-bold text-sm text-red-600 flex items-center justify-between">
            <span>
              ${product.price}
              <span className={`text-[11px] font-normal ${darkMode ? 'text-white/70' : 'text-black/60'} ml-1`}>
                / {product.pricing_unit || 'Item'}
              </span>
            </span>
            {product.used && (
              <span className="text-[9px] bg-red-600/10 text-red-600 border border-red-600/20 px-1.5 py-0.5 font-bold uppercase tracking-wider">
                USED
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`px-4 pb-4 flex flex-col gap-2 ${darkMode ? "bg-black" : "bg-white"}`}>
          {/* Stock Toggle Confirm Overlay */}
          {showConfirmStock ? (
            <div className={`p-3 mb-1 border rounded-xl ${darkMode ? 'border-gray-800 bg-gray-900 text-white' : 'border-[#E5E5E5] bg-[#F5F5F5] text-[#151515]'} text-center space-y-2`}>
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Mark as {product.in_stock !== false ? 'Out of Stock' : 'In Stock'}?
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsUpdatingStock(true);
                    try {
                      const token = localStorage.getItem("token");
                      const form = new FormData();
                      form.append("in_stock", String(product.in_stock !== false ? 'false' : 'true'));
                      
                      const res = await fetch(`${API_BASE}/api/seller/product/${product.id}`, {
                        method: "PATCH",
                        headers: { Authorization: `Bearer ${token}` },
                        body: form
                      });
                      if (!res.ok) throw new Error("Failed to update stock status");
                      onUpdate();
                    } catch (e: any) {
                      alert(e.message);
                    } finally {
                      setIsUpdatingStock(false);
                      setShowConfirmStock(false);
                    }
                  }}
                  disabled={isUpdatingStock}
                  className="px-3 py-1 rounded-lg bg-[#E5252A] hover:bg-[#c91d22] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs"
                >
                  Yes
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowConfirmStock(false); }}
                  disabled={isUpdatingStock}
                  className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-[#E5E5E5] text-[#151515]'}`}
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfirmStock(true); }}
              className={`w-full py-2 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-colors border
                ${product.in_stock !== false ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/25' : 'bg-red-600/10 text-red-600 hover:bg-red-600/20 border-red-600/25'}`}
             
            >
              {product.in_stock !== false ? 'Mark Out of Stock' : 'Mark In Stock'}
            </button>
          )}

          {/* View Video Button */}
          {product.video_url && (
            <button
              onClick={() => {
                // Open modal at video index (last item in mediaItems)
                setModalImageIndex(mediaItems.length - 1);
                setShowVideoModal(true);
              }}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 font-semibold text-xs transition-colors uppercase tracking-wider"
             
            >
              <FiVideo size={14} /> View Video
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(product)}
              className={`flex-1 py-2 border flex items-center justify-center gap-1 font-semibold text-xs transition-colors uppercase tracking-wider
                ${darkMode ? "bg-black border-gray-800 text-gray-300 rounded-lg hover:bg-gray-800" : "bg-white border-[#E5E5E5] text-[#151515] rounded-lg hover:bg-gray-100"}`}
             
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
             
            >
              {isDeleting ? (
                <span className="animate-spin">↻</span>
              ) : (
                <>
                  <FiTrash2 size={14} /> Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
