import React, { useEffect, useRef, useState } from 'react';
// import { Images } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import { ServiceFeature } from '@/types/features';// adjust path if needed
import MediaManagementSection from '../components/DashboardParts/MediaManagementSection';
import SubscriptionBanner from '../components/DashboardParts/PlansScrollingBanner';
import ProductUploadCard from '../components/DashboardParts/ProductUploadCard';
import ServiceUploadCard from '../components/DashboardParts/ServiceUploadCard';
import ServicePromptBanner from '../components/DashboardParts/ServicePromptBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { API_BASE } from '../api/apiClient';
import { uploadMultipleFilesToR2 } from '../services/r2UploadService';
type MediaType = "product" | "service";
type FileType = "image" | "video" | "mixed";

interface UploadedMedia {
  id: string;
  url: string;
  title: string;
  desc: string;
  price?: number;
  type: MediaType;
  fileType: FileType;
  visible: boolean;
  views?: string[];
  madeInRwanda?: boolean;
  used?: boolean;
  pricingUnit?: string;
  mediaFiles?: UploadedMedia[]; // For grouped products with multiple media
}

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

export default function Dashboard() {
  const { darkMode } = useDarkMode();
  const [productUploadProgress, setProductUploadProgress] = useState<number | null>(null);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productVideos, setProductVideos] = useState<File[]>([]);
  const [productViews, setProductViews] = useState<File[][]>([]);
  const [serviceImages, setServiceImages] = useState<File[]>([]);
  const [serviceVideos, setServiceVideos] = useState<File[]>([]);
  const [serviceViews, setServiceViews] = useState<File[][]>([]);
  const [uploadedProductImages, setUploadedProductImages] = useState<UploadedMedia[]>([]);
  const [uploadedServiceImages, setUploadedServiceImages] = useState<UploadedMedia[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalViews, setModalViews] = useState<string[]>([]);
  const [modalViewIndex, setModalViewIndex] = useState(0);
  const [selectedModalItem, setSelectedModalItem] = useState<UploadedMedia | null>(null);

  // For editing
  const [editingImage, setEditingImage] = useState<UploadedMedia | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [editingPrice, setEditingPrice] = useState<number | undefined>(undefined);
  const [editingFeatureValues, setEditingFeatureValues] = useState<Record<string, any>>({});
  const [editingUsed, setEditingUsed] = useState(false);
  const [editingPricingUnit, setEditingPricingUnit] = useState('Per Item / Piece');

  // For selection
  const [selectedProductImages, setSelectedProductImages] = useState<Set<string>>(new Set());
  const [selectedServiceImages, setSelectedServiceImages] = useState<Set<string>>(new Set());

  const [deletingImageIds, setDeletingImageIds] = useState<Set<string>>(new Set());
  const [pendingDeleteQueue, setPendingDeleteQueue] = useState<Map<string, UploadedMedia>>(new Map());

  // Edit product in upload fields mode
  const [editingProduct, setEditingProduct] = useState<UploadedMedia | null>(null);
  const [existingProductImageUrl, setExistingProductImageUrl] = useState<string>('');
  const [existingProductViews, setExistingProductViews] = useState<string[]>([]);
  const [existingProductVideoUrl, setExistingProductVideoUrl] = useState<string>('');

  // For upload
  const [productTitle, setProductTitle] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productMadeInRwanda, setProductMadeInRwanda] = useState(false);
  const [productUsed, setProductUsed] = useState(false);
  const [productPricingUnit, setProductPricingUnit] = useState('Per Item / Piece');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  const providerId = localStorage.getItem('providerId');
  const { fetchWithAutoLogout, user } = useAuth();

  const [selectedCard, setSelectedCard] = useState<'product' | 'service' | 'messages'>('product');

  // Subscription info used to control access/restrictions
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const [service, setService] = useState<{ id?: string; title?: string; custom_type?: string; specific_features?: boolean; features?: ServiceFeature[] } | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [featureValues, setFeatureValues] = useState<Record<string, any>>({});

  const serviceOnlyMode = String(service?.custom_type ?? 'general').trim().toLowerCase() !== 'general';

  const [extraFieldsData, setExtraFieldsData] = useState<{
    pricePerHour: number;
    pricePerDay: number;
    discount: number;
    withDriverCost: number;
  }>({
    pricePerHour: 0,
    pricePerDay: 0,
    discount: 0,
    withDriverCost: 0,
  });

  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [isUploadingService, setIsUploadingService] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<MediaType | null>(null);
  const [isBulkHiding, setIsBulkHiding] = useState<MediaType | null>(null);

  const loadMedia = () => {
    if (!providerId) return;
    fetch(`${API_BASE}/api/providers/${providerId}/media`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }
        return res.json();
      })
      .then(data => {
          if (Array.isArray(data.product)) {
          const processedProducts = data.product.map((media: any, i: number) => ({
            url: media.url,
            id: media.id,
            title: media.title ?? `Product Media ${i + 1}`,
            desc: media.desc ?? '',
            price: media.price ?? '',
            type: "product",
            fileType:
              media.fileType ??
              (media.url?.includes('.mp4') ||
                media.url?.includes('.mov') ||
                media.url?.includes('.avi')
                ? "video"
                : "image"),
            visible: media.visible !== false,
            views: Array.isArray(media.views) ? media.views : [],
            madeInRwanda: media.madeInRwanda === true,
            used: media.used === true,
            pricingUnit: media.pricingUnit || "Per Item / Piece",
            inStock: media.inStock !== false && media.in_stock !== false,
            mediaFiles: media.mediaFiles, // Include mediaFiles
          }));

               setUploadedProductImages(processedProducts);
        }

        if (Array.isArray(data.service)) {
          const processedServices = data.service.map((media: any, i: number) => ({
            id: media.id,
            url: media.url,
            title: media.title ?? `Service Media ${i + 1}`,
            desc: media.desc ?? '',
            price: media.price ?? '',
            type: "service",
            fileType: media.fileType ?? (media.url?.includes('.mp4') || media.url?.includes('.mov') || media.url?.includes('.avi') ? "video" : "image"),
            visible: media.visible !== false,
            views: Array.isArray(media.views) ? media.views : [],
            madeInRwanda: media.madeInRwanda === true,
            mediaFiles: media.mediaFiles, // Include mediaFiles
            feature_values: media.feature_values || {},
          }));
          setUploadedServiceImages(processedServices);
        }
      })
      .catch(err => {
        console.error("❌ Error fetching media:", err);
        // Fallback to old images endpoint for backward compatibility
        fetch(`${API_BASE}/api/providers/${providerId}/images`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data.product)) {
              setUploadedProductImages(
                data.product.map((img: any, i: number) => {
                  // Detect file type from URL
                  const isVideo = img.url && (
                    img.url.includes('.mp4') ||
                    img.url.includes('.mov') ||
                    img.url.includes('.avi') ||
                    img.url.includes('.webm')
                  );

                  return {
                    url: img.url,
                    id: img.id,
                    title: img.title ?? `Product Image ${i + 1}`,
                    desc: img.desc ?? '',
                    price: img.price ?? '',
                    type: "product",
                    fileType: isVideo ? "video" : "image",
                    visible: img.visible !== false,
                    views: Array.isArray(img.views) ? img.views : [],
                    madeInRwanda: img.madeInRwanda === true,
                    used: img.used === true,
                    pricingUnit: img.pricingUnit || "Per Item / Piece",
                    inStock: img.inStock !== false && img.in_stock !== false,
                  };
                }),
              );
            }

            if (Array.isArray(data.service)) {
                           setUploadedServiceImages(data.service.map((img: any, i: number) => {
                // Detect file type from URL
                const isVideo = img.url && (
                  img.url.includes('.mp4') ||
                  img.url.includes('.mov') ||
                  img.url.includes('.avi') ||
                  img.url.includes('.webm')
                );

                console.log(`📋 [DEBUG] Service ${i + 1}:`, {
                  id: img.id,
                  title: img.title,
                  has_feature_values: !!img.feature_values,
                  feature_values: img.feature_values
                });

                return {
                  id: img.id,
                  url: img.url,
                  title: img.title ?? `Service Image ${i + 1}`,
                  desc: img.desc ?? '',
                  price: img.price ?? '',
                  type: "service",
                  fileType: isVideo ? "video" : "image",
                  visible: img.visible !== false,
                  views: Array.isArray(img.views) ? img.views : [],
                  madeInRwanda: img.madeInRwanda === true,
                  feature_values: img.feature_values || {},
                };
              }));
            }
          })
          .catch(err => console.error("❌ Error fetching images:", err));
      });
  };

  useEffect(() => {
    loadMedia();
  }, [providerId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAutoLogout(`${API_BASE}/api/me`);
        await res.json(); // Data fetched but not stored for now
      } catch (err: any) {
        console.error(err.message);
      }
    };
    fetchData();
  }, [fetchWithAutoLogout]);

  // Load current subscription/plan restrictions for this provider
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
          // Shape it so ProductUploadCard/ServiceUploadCard can keep using subscription.subscription
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

  // Handlers for uploading images
  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductImages(Array.from(e.target.files));
      setProductViews(new Array(Array.from(e.target.files).length).fill([]));
    }
  };

  const handleProductVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductVideos(Array.from(e.target.files));
    }
  };

  const handleProductViewChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const files = Array.from(e.target.files || []);
    setProductViews(prev => {
      const newViews = [...prev];
      newViews[idx] = files;
      return newViews;
    });
    // For displaying previews
    setProductImages(prev => {
      const updated = [...prev];
      // Attach previews to file object (not ideal, but for UI only)
      (updated[idx] as any).previews = files.map(file => URL.createObjectURL(file));
      return updated;
    });
  };

  const handleServiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setServiceImages(Array.from(e.target.files));
      setServiceViews(new Array(Array.from(e.target.files).length).fill([]));
    }
  };

  const handleServiceVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setServiceVideos(Array.from(e.target.files));
    }
  };

  const handleServiceViewChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const files = Array.from(e.target.files || []);
    setServiceViews(prev => {
      const newViews = [...prev];
      newViews[idx] = files;
      return newViews;
    });
    // For displaying previews
    setServiceImages(prev => {
      const updated = [...prev];
      (updated[idx] as any).views = files.map(file => URL.createObjectURL(file));
      return updated;
    });
  };

  // Upload / Update handlers
  const handleProductUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;

    if (isUploadingProduct) return;

    // Handle Edit Mode submission
    if (editingProduct) {
      if (!productTitle.trim() || !productDesc.trim() || !productPrice.trim()) {
        alert('Please fill all required fields');
        return;
      }

      setIsUploadingProduct(true);
      try {
        let finalMainImageUrl = existingProductImageUrl;
        const finalViews: string[] = [...existingProductViews];
        let finalVideoUrl = existingProductVideoUrl;

        // 1. Upload new main image if selected
        if (productImages.length > 0) {
          setProductUploadProgress(10);
          const uploadedMain = await uploadMultipleFilesToR2(
            [{ file: productImages[0], isMain: true, isView: false }],
            { category: 'products', onProgress: (p) => setProductUploadProgress(Math.round(p * 0.4)) }
          );
          if (uploadedMain[0]?.url) {
            finalMainImageUrl = uploadedMain[0].url;
          }
        }

        // 2. Upload new view images if selected
        const newViewFiles = productViews.flat();
        if (newViewFiles.length > 0) {
          const uploadedViews = await uploadMultipleFilesToR2(
            newViewFiles.map(f => ({ file: f, isMain: false, isView: true })),
            { category: 'products', onProgress: (p) => setProductUploadProgress(40 + Math.round(p * 0.3)) }
          );
          uploadedViews.forEach(v => {
            if (v.url) finalViews.push(v.url);
          });
        }

        // 3. Upload new video if selected
        if (productVideos.length > 0) {
          const uploadedVideos = await uploadMultipleFilesToR2(
            [{ file: productVideos[0], isMain: false, isView: false }],
            { category: 'products', onProgress: (p) => setProductUploadProgress(70 + Math.round(p * 0.3)) }
          );
          if (uploadedVideos[0]?.url) {
            finalVideoUrl = uploadedVideos[0].url;
          }
        }

        setProductUploadProgress(100);

        const res = await fetch(`${API_BASE}/api/media/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: productTitle,
            desc: productDesc,
            price: parseFloat(productPrice),
            madeInRwanda: productMadeInRwanda,
            used: productUsed,
            pricingUnit: productPricingUnit,
            featureValues: (service?.specific_features && service?.features) || service?.custom_type?.toLowerCase() === 'real_estate' ? featureValues : undefined,
            mainImageUrl: finalMainImageUrl,
            views: finalViews,
            videoUrl: finalVideoUrl,
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update product');
        }

        const data = await res.json();
        console.log('✅ Product updated successfully:', data);

        // Update local state
        setUploadedProductImages(prev =>
          prev.map(img =>
            img.id === editingProduct.id
              ? {
                  ...img,
                  title: productTitle,
                  desc: productDesc,
                  price: parseFloat(productPrice),
                  madeInRwanda: productMadeInRwanda,
                  used: productUsed,
                  pricingUnit: productPricingUnit,
                  url: finalMainImageUrl || img.url,
                  views: finalViews,
                  mediaFiles: [
                    ...(finalMainImageUrl ? [{ id: `${img.id}-main`, url: finalMainImageUrl, type: 'image' as const, fileType: 'image' as const, size: 0, filename: 'main.jpg', title: productTitle, desc: productDesc, visible: true }] : []),
                    ...finalViews.map((v, i) => ({ id: `${img.id}-view-${i}`, url: v, type: 'image' as const, fileType: 'image' as const, size: 0, filename: `view-${i}.jpg`, title: productTitle, desc: productDesc, visible: true })),
                    ...(finalVideoUrl ? [{ id: `${img.id}-video`, url: finalVideoUrl, type: 'video' as const, fileType: 'video' as const, size: 0, filename: 'video.mp4', title: productTitle, desc: productDesc, visible: true }] : [])
                  ]
                }
              : img
          )
        );

        alert('Product updated successfully!');
        handleCancelEditProduct();
      } catch (err: any) {
        console.error('Update error:', err);
        alert(err.message || 'Failed to update product');
      } finally {
        setIsUploadingProduct(false);
        setProductUploadProgress(null);
      }
      return;
    }

    const hasImages = productImages.length > 0;
    const hasVideos = productVideos.length > 0;

    if (!hasImages && !hasVideos) {
      alert('Please select at least one image or video to upload');
      return;
    }

    if (!productTitle.trim() || !productDesc.trim() || !productPrice.trim()) {
      alert('Please fill all fields');
      return;
    }

    setIsUploadingProduct(true);
    try {
      let data: any = null;

      // Try Direct Cloudflare R2 Upload First
      try {
        const itemsToUpload: Array<{ file: File; isMain?: boolean; isView?: boolean }> = [];
        productImages.forEach((img, idx) => itemsToUpload.push({ file: img, isMain: idx === 0, isView: idx > 0 }));
        productVideos.forEach(vid => itemsToUpload.push({ file: vid, isMain: false, isView: false }));
        productViews.flat().forEach(viewImg => itemsToUpload.push({ file: viewImg, isMain: false, isView: true }));

        setProductUploadProgress(0);
        const r2Files = await uploadMultipleFilesToR2(itemsToUpload, {
          category: 'products',
          onProgress: (percent) => setProductUploadProgress(percent),
        });

        const uploadUrl = `${API_BASE}/api/upload/products/unified`;
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            title: productTitle,
            desc: productDesc,
            price: productPrice,
            madeInRwanda: productMadeInRwanda,
            used: productUsed,
            pricingUnit: productPricingUnit,
            featureValues: (service?.specific_features && service?.features) || service?.custom_type?.toLowerCase() === 'real_estate' ? featureValues : undefined,
            r2Files
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save product media to database');
        }

        data = await res.json();
      } catch (r2Error: any) {
        console.warn('Direct R2 upload not available or failed, falling back to server upload:', r2Error.message);
        
        // Fallback: Legacy uploadWithProgress
        const formData = new FormData();
        formData.append('providerId', providerId);
        formData.append('title', productTitle);
        formData.append('desc', productDesc);
        formData.append('price', productPrice);
        formData.append('madeInRwanda', String(productMadeInRwanda));
        formData.append('used', String(productUsed));
        formData.append('pricingUnit', productPricingUnit);

        if (service?.specific_features && service?.features || service?.custom_type?.toLowerCase() === 'real_estate') {
          formData.append('featureValues', JSON.stringify(featureValues));
        }

        productImages.forEach(image => formData.append('images', image));
        productVideos.forEach(video => formData.append('videos', video));
        productViews.flat().forEach(viewImage => formData.append('viewImages', viewImage));

        const uploadUrl = `${API_BASE}/api/upload/products/unified`;
        setProductUploadProgress(0);
        data = await uploadWithProgress(
          "POST",
          uploadUrl,
          formData,
          (percent) => {
            setProductUploadProgress(percent);
          }
        );
      }

      // Create unified product entry for display (typed to satisfy TS)
      const unifiedProduct: UploadedMedia = {
        id: data.groupId,
        url: data.files[0]?.url || '',
        title: productTitle,
        desc: productDesc,
        price: parseFloat(productPrice),
        type: "product",
        fileType:
          hasImages && hasVideos ? "mixed" : hasImages ? "image" : "video",
        visible: true,
        views: data.files
          .filter((f: any) => f.isView)
          .map((f: any) => f.url),
        madeInRwanda: productMadeInRwanda,
        used: productUsed,
        pricingUnit: productPricingUnit,
      };

      setUploadedProductImages(prev => [...prev, unifiedProduct]);
      alert(`Product uploaded successfully with ${data.files.length} media files!`);

      // Clear form
      setProductImages([]);
      setProductVideos([]);
      setProductViews([]);
      setProductTitle('');
      setProductDesc('');
      setProductPrice('');
      setProductMadeInRwanda(false);
      setProductUsed(false);
      setProductPricingUnit('Per Item / Piece');
      // Reset feature values
      if ((service?.specific_features && service?.features) || service?.custom_type?.toLowerCase() === 'real_estate') {
        const resetValues: Record<string, any> = {};
        if (service?.features && Array.isArray(service.features)) {
          service.features.forEach((feature) => {
            if (feature.type === 'simple') {
              resetValues[feature.name] = '';
            } else if (feature.type === 'object') {
              resetValues[feature.name] = {};
            }
          });
        }
        setFeatureValues(resetValues);
      }

    } catch (err) {
      console.error('Upload error:', err);
      alert(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploadingProduct(false);
      setProductUploadProgress(null);
    }
  };

  const handleServiceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;

    if (isUploadingService) return;
    setIsUploadingService(true);
    try {

      let uploadedGroupId: string | null = null; // Track group_id for real estate
      let uploadedSuccessfullyToR2 = false;

      // Try Direct Cloudflare R2 Upload First
      const itemsToUpload: Array<{ file: File; isMain?: boolean; isView?: boolean }> = [];
      for (let i = 0; i < serviceImages.length; i++) {
        itemsToUpload.push({ file: serviceImages[i], isMain: i === 0, isView: false });
        const views = serviceViews[i] || [];
        views.forEach(v => itemsToUpload.push({ file: v, isMain: false, isView: true }));
      }
      serviceVideos.forEach(v => itemsToUpload.push({ file: v, isMain: false, isView: false }));

      if (itemsToUpload.length > 0) {
        try {
          const r2Files = await uploadMultipleFilesToR2(itemsToUpload, {
            category: service?.custom_type?.toLowerCase() === 'real_estate' ? 'real_estate' : 'services',
          });

          const res = await fetch(`${API_BASE}/api/upload/services/unified`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId,
              title: serviceTitle,
              desc: serviceDesc,
              price: servicePrice,
              featureValues: (service?.specific_features && service?.features) || service?.custom_type?.toLowerCase() === 'real_estate' ? featureValues : undefined,
              r2Files
            })
          });

          if (res.ok) {
            const data = await res.json();
            uploadedGroupId = data.groupId || null;
            uploadedSuccessfullyToR2 = true;

            const mainFiles = data.files.filter((f: any) => f.isMain || !f.isView);
            const viewUrls = data.files.filter((f: any) => f.isView).map((f: any) => f.url);

            for (const mf of mainFiles) {
              setUploadedServiceImages(prev => [
                ...prev,
                {
                  id: mf.id,
                  url: mf.url,
                  title: serviceTitle || `Service ${mf.type} ${prev.length + 1}`,
                  desc: serviceDesc,
                  price: parseFloat(servicePrice),
                  type: "service",
                  fileType: mf.type === 'video' ? 'video' : 'image',
                  visible: true,
                  views: viewUrls,
                  ...extraFieldsData,
                }
              ]);
            }
          }
        } catch (r2Err: any) {
          console.warn('Direct R2 service upload failed or not configured, using fallback:', r2Err.message);
        }
      }

      if (!uploadedSuccessfullyToR2) {
        // Fallback: Upload images
        for (let i = 0; i < serviceImages.length; i++) {
        const mainImg = serviceImages[i];
        const views = serviceViews[i] || [];
        const formData = new FormData();
        formData.append('providerId', providerId);
        formData.append('image', mainImg);
        views.forEach((img) => formData.append('views', img));
        formData.append('title', serviceTitle);
        formData.append('desc', serviceDesc);
        formData.append('price', servicePrice);
        // Add feature values if service has specific_features
        if ((service?.specific_features && service?.features) || service?.custom_type?.toLowerCase() === 'real_estate') {
          const featureValuesJson = JSON.stringify(featureValues);
          formData.append('featureValues', featureValuesJson);
          console.log(`📤 [FRONTEND] Image ${i + 1} - Sending featureValues:`, featureValuesJson);
        } else {
          console.log(`⚠️ [FRONTEND] Image ${i + 1} - No features to send (specific_features: ${service?.specific_features})`);
        }

        try {
          const res = await fetch(`${API_BASE}/api/upload/services`, { method: "POST", body: formData });
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            continue;
          }
          if (data.url) {
            uploadedGroupId = data.groupId || data.group_id || uploadedGroupId || null;
            setUploadedServiceImages(prev => [
              ...prev,
              {
                id: data.id,
                url: data.url,
                title: serviceTitle || `Service Image ${prev.length + 1}`,
                desc: serviceDesc,
                price: parseFloat(servicePrice),
                type: "service",
                fileType: "image",
                visible: true,
                views: Array.isArray(data.views) ? data.views : [],
                ...extraFieldsData,
              }
            ]);
          }
        } catch (err) {
          // ignore
        }
      }

      // Upload videos
      for (let i = 0; i < serviceVideos.length; i++) {
        const video = serviceVideos[i];
        const formData = new FormData();
        formData.append('providerId', providerId);
        formData.append('video', video);
        formData.append('title', serviceTitle);
        formData.append('desc', serviceDesc);
        formData.append('price', servicePrice);
        // Add feature values if service has specific_features
        if ((service?.specific_features && service?.features) || service?.custom_type?.toLowerCase() === 'real_estate') {
          const featureValuesJson = JSON.stringify(featureValues);
          formData.append('featureValues', featureValuesJson);
          console.log(`📤 [FRONTEND] Video ${i + 1} - Sending featureValues:`, featureValuesJson);
        } else {
          console.log(`⚠️ [FRONTEND] Video ${i + 1} - No features to send (specific_features: ${service?.specific_features})`);
        }

        try {
          const res = await fetch(`${API_BASE}/api/upload/services/videos`, { method: "POST", body: formData });
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            continue;
          }
          if (data.url) {
            setUploadedServiceImages(prev => [
              ...prev,
              {
                id: data.id,
                url: data.url,
                title: serviceTitle || `Service Video ${prev.length + 1}`,
                desc: serviceDesc,
                price: parseFloat(servicePrice),
                type: "service",
                fileType: "video",
                visible: true,
                views: [],
                ...extraFieldsData,
              }
            ]);
          }
        } catch (err) {
          // ignore
        }
      }
      }

      // If real estate, save structured property fields to dedicated table
      if (service?.custom_type?.toLowerCase() === 'real_estate' && uploadedGroupId && providerId) {
        try {
          await fetch(`${API_BASE}/api/real-estate/properties/save-fields`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            },
            body: JSON.stringify({
              group_id: uploadedGroupId,
              provider_id: parseInt(providerId),
              title: serviceTitle,
              description: serviceDesc,
              price: featureValues.price || servicePrice,
              ...featureValues,
            }),
          });
        } catch (err) {
          console.error('⚠️ Could not save real estate fields:', err);
        }
      }

      setServiceImages([]);
      setServiceVideos([]);
      setServiceTitle('');
      setServiceDesc('');
      setServicePrice('');
      setServiceViews([]);
      // Reset feature values
      if ((service?.specific_features && service?.features) || service?.custom_type?.toLowerCase() === 'real_estate') {
        const resetValues: Record<string, any> = {};
        if (service?.features && Array.isArray(service.features)) {
          service.features.forEach((feature) => {
            if (feature.type === 'simple') {
              resetValues[feature.name] = '';
            } else if (feature.type === 'object') {
              resetValues[feature.name] = {};
            }
          });
        }
        setFeatureValues(resetValues);
      }
    } finally {
      setIsUploadingService(false);
    }
  };

  const handleCancelEditProduct = () => {
    setEditingProduct(null);
    setProductTitle('');
    setProductDesc('');
    setProductPrice('');
    setProductMadeInRwanda(false);
    setProductUsed(false);
    setProductPricingUnit('Per Item / Piece');
    setExistingProductImageUrl('');
    setExistingProductViews([]);
    setExistingProductVideoUrl('');
    setProductImages([]);
    setProductViews([]);
    setProductVideos([]);
    if ((service?.specific_features && service?.features) || service?.custom_type?.toLowerCase() === 'real_estate') {
      const resetValues: Record<string, any> = {};
      if (service?.features && Array.isArray(service.features)) {
        service.features.forEach((feature) => {
          if (feature.type === 'simple') {
            resetValues[feature.name] = '';
          } else if (feature.type === 'object') {
            resetValues[feature.name] = {};
          }
        });
      }
      setFeatureValues(resetValues);
    }
  };

  // Editing handlers
  const startEditing = (img: UploadedMedia) => {
    console.log('🔧 [EDIT] Starting edit for:', img);

    // If product, open in ProductUploadCard edit mode
    if (img.type === 'product') {
      setEditingProduct(img);
      setProductTitle(img.title || '');
      setProductDesc(img.desc || '');
      setProductPrice(img.price !== undefined && img.price !== null ? String(img.price) : '');
      setProductMadeInRwanda(img.madeInRwanda || false);
      setProductUsed(img.used || false);
      setProductPricingUnit(img.pricingUnit || 'Per Item / Piece');

      const featureVals = (img as any).feature_values || {};
      setFeatureValues(featureVals);

      setExistingProductImageUrl(img.url || '');
      setExistingProductViews(Array.isArray(img.views) ? [...img.views] : []);
      const vid = img.mediaFiles?.find(m => m.type === 'video')?.url || (img.fileType === 'video' ? img.url : '');
      setExistingProductVideoUrl(vid || '');

      setProductImages([]);
      setProductViews([]);
      setProductVideos([]);

      setSelectedCard('product');
      setTimeout(() => {
        const el = document.getElementById('product-upload-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);

      setEditingImage(null);
      return;
    }

    setEditingImage(img);
    setEditingTitle(img.title);
    setEditingDesc(img.desc);
    setEditingPrice(img.price);
    setEditingUsed(img.used || false);
    setEditingPricingUnit(img.pricingUnit || "Per Item / Piece");
    // Load feature values if they exist
    const featureVals = (img as any).feature_values || {};
    console.log('🔧 [EDIT] Setting editingFeatureValues to:', featureVals);
    setEditingFeatureValues(featureVals);
  };
  const saveEdit = async () => {
    if (!editingImage) return;

    try {
      // Send update to backend
      const res = await fetch(`${API_BASE}/api/media/${editingImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTitle,
          desc: editingDesc,
          price: editingPrice,
          featureValues: editingFeatureValues,
          used: editingUsed,
          pricingUnit: editingPricingUnit
        })
      });

      if (!res.ok) {
        console.error('Failed to update media:', res.status);
        return;
      }

      const data = await res.json();
      console.log('✅ Media updated successfully:', data);

      // Update local state
      if (editingImage.type === "product") {
        setUploadedProductImages(prev =>
          prev.map(img =>
            img.id === editingImage.id
              ? { ...img, title: editingTitle, desc: editingDesc, price: editingPrice, used: editingUsed, pricingUnit: editingPricingUnit }
              : img
          )
        );
      } else {
        setUploadedServiceImages(prev =>
          prev.map(img =>
            img.id === editingImage.id
              ? { ...img, title: editingTitle, desc: editingDesc, price: editingPrice, feature_values: editingFeatureValues }
              : img
          )
        );
      }
    } catch (err) {
      console.error('Error updating media:', err);
    }

    // Reset editing state
    setEditingImage(null);
    setEditingTitle('');
    setEditingDesc('');
    setEditingPrice(undefined);
    setEditingFeatureValues({});
    setEditingUsed(false);
    setEditingPricingUnit('Per Item / Piece');
  };

  // Delete handler (single)
  const deleteTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const deleteImage = (img: UploadedMedia) => {
    const id = img.id;

    setPendingDeleteQueue(prev => new Map(prev).set(id, img));
    setDeletingImageIds(prev => new Set(prev).add(id));

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/images/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // send ids as strings to support non-numeric ids (UUIDs/group ids)
          body: JSON.stringify({ ids: [id], type: img.type }),
        });

        if (res.ok) {
          if (img.type === 'product') {
            setUploadedProductImages(prev => prev.filter(i => i.id !== id));
          } else {
            setUploadedServiceImages(prev => prev.filter(i => i.id !== id));
          }
        }
      } catch (error) {
        console.error('Delete failed:', error);
      }

      setPendingDeleteQueue(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      setDeletingImageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      deleteTimeouts.current.delete(id);
    }, 5000);

    deleteTimeouts.current.set(id, timeoutId);
  };

  // Undo a pending delete (clear timeout and remove from pending sets)
  const undoDelete = (id: string) => {
    const t = deleteTimeouts.current.get(id);
    if (t) {
      clearTimeout(t);
      deleteTimeouts.current.delete(id);
    }

    setPendingDeleteQueue(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });

    setDeletingImageIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  useEffect(() => {
    if (!providerId) {
      setServiceLoading(false);
      return;
    }

    setServiceLoading(true);
    const cacheBuster = Date.now();
    const fetchUrl = `${API_BASE}/api/providers/${providerId}/service?t=${cacheBuster}`;

    fetch(fetchUrl, {
      cache: 'no-store'
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(async data => {
        if (!data) {
          setService(null);
          return;
        }

        setService(data);
        const isServiceOnly = String(data?.custom_type ?? 'general').trim().toLowerCase() !== 'general';
        if (isServiceOnly) {
          setSelectedCard('service');
        }

        if (data.specific_features && data.features) {
          const initialValues: Record<string, any> = {};
          data.features.forEach((feature: any) => {
            if (feature.type === 'simple') {
              initialValues[feature.name] = '';
            } else if (feature.type === 'object') {
              initialValues[feature.name] = {};
            }
          });
          setFeatureValues(initialValues);
        }
      })
      .catch((err) => {
        console.error("Error loading service configuration:", err);
      })
      .finally(() => {
        setServiceLoading(false);
      });
  }, [providerId]);

  useEffect(() => {
    if (serviceOnlyMode) {
      setSelectedCard('service');
    }
  }, [serviceOnlyMode]);

  // Selection handlers
  const toggleSelectProduct = (id: string) => {
    setSelectedProductImages(prev => {
      const set = new Set(prev);
      set.has(id) ? set.delete(id) : set.add(id);
      return set;
    });
  };

  const toggleSelectService = (id: string) => {
    setSelectedServiceImages(prev => {
      const set = new Set(prev);
      set.has(id) ? set.delete(id) : set.add(id);
      return set;
    });
  };

  // Bulk delete/visibility
  const deleteSelected = async (type: MediaType) => {
    if (isBulkDeleting) return;
    setIsBulkDeleting(type);
    const ids = Array.from(
      type === "product" ? selectedProductImages : selectedServiceImages
    );

    try {
      const res = await fetch(`${API_BASE}/api/images/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, type })
      });

      if (res.ok) {
        if (type === "product") {
          setUploadedProductImages(prev => prev.filter(img => !selectedProductImages.has(img.id)));
          setSelectedProductImages(new Set());
        } else {
          setUploadedServiceImages(prev => prev.filter(img => !selectedServiceImages.has(img.id)));
          setSelectedServiceImages(new Set());
        }
      }
    } finally {
      setIsBulkDeleting(null);
    }
  };

  const hideSelected = async (type: MediaType) => {
    if (isBulkHiding) return;
    setIsBulkHiding(type);
    const ids = Array.from(
      type === "product" ? selectedProductImages : selectedServiceImages
    );

    try {
      const res = await fetch(`${API_BASE}/api/images/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, type })
      });

      if (res.ok) {
        if (type === "product") {
          setUploadedProductImages(prev =>
            prev.map(img => selectedProductImages.has(img.id) ? { ...img, visible: false } : img)
          );
          setSelectedProductImages(new Set());
        } else {
          setUploadedServiceImages(prev =>
            prev.map(img => selectedServiceImages.has(img.id) ? { ...img, visible: false } : img)
          );
          setSelectedServiceImages(new Set());
        }
      }
    } finally {
      setIsBulkHiding(null);
    }
  };

  // Modal logic: show main image/video + views, scrollable
  const openModal = (item: UploadedMedia, startAtVideo: boolean = false) => {
    let views: string[] = Array.isArray(item.views) ? item.views : [];

    // Helper to check if URL is a video (case-insensitive)
    const isVideoUrl = (url: string) => {
      const lowerUrl = url.toLowerCase();
      return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.avi') || lowerUrl.includes('.webm');
    };

    // Get videos from mediaFiles if available (for both 'video' and 'mixed' types)
    const videoUrls: string[] = [];
    if ((item.fileType === 'mixed' || item.fileType === 'video') && Array.isArray(item.mediaFiles)) {
      item.mediaFiles.forEach((media: any) => {
        if (media.type === 'video') {
          videoUrls.push(media.url);
        }
      });
    }

    // Combine: main URL + views + videos from mediaFiles
    const allMedia = [item.url, ...views, ...videoUrls];
    const images = allMedia.filter(url => !isVideoUrl(url));
    const videos = allMedia.filter(url => isVideoUrl(url));
    const orderedMedia = [...images, ...videos];

    setModalViews(orderedMedia);

    // If startAtVideo is true, find the first video and start there
    let startIndex = 0;
    if (startAtVideo && videos.length > 0) {
      startIndex = orderedMedia.indexOf(videos[0]);
    }

    setModalImage(orderedMedia[startIndex]);
    setModalViewIndex(startIndex);
    setModalOpen(true);
    setSelectedModalItem(item); // Store the full item for video handling
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalImage(null);
    setModalViews([]);
    setModalViewIndex(0);
    setSelectedModalItem(null);
  };
  const nextModalView = () => {
    if (modalViews.length > 0) {
      setModalViewIndex(i => (i + 1) % modalViews.length);
      setModalImage(modalViews[(modalViewIndex + 1) % modalViews.length]);
    }
  };
  const prevModalView = () => {
    if (modalViews.length > 0) {
      setModalViewIndex(i => (i - 1 + modalViews.length) % modalViews.length);
      setModalImage(modalViews[(modalViewIndex - 1 + modalViews.length) % modalViews.length]);
    }
  };

  if (serviceLoading || subscriptionLoading) {
    return (
      <div className={`min-h-screen -mx-4 sm:mx-0 flex flex-col items-center justify-center ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
        <LoadingSpinner
          variant="dots"
          size="lg"
          message="Loading dashboard & fields..."
        />
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 mt-0 -mx-4 px-3 sm:mx-0 sm:px-2 overflow-x-hidden ${darkMode ? "bg-black text-white/90" : "bg-white text-black"}`}>
      <div
        className="sticky z-40 w-full overflow-x-hidden overflow-y-visible bg-red-50 border-b border-red-300 mb-2"
        style={{ top: 'var(--navbar-height)' }}
      >
        <SubscriptionBanner />
      </div>

      <h2 className={`text-2xl font-bold uppercase text-center mb-2 ${darkMode ? "text-white" : "text-black"}`}>{service?.custom_type?.toLowerCase() === 'real_estate' ? "Real Estate Dashboard" : "Service Provider's Dashboard"}</h2>
      {service?.title && (
        <p className={`text-center mb-6 text-xs font-bold uppercase tracking-wider ${darkMode ? "text-white/70" : "text-black/60"}`}>
          {service?.custom_type?.toLowerCase() === 'real_estate' ? "Category: " : "Service: "}<span className="text-red-600">{service.title}</span>
        </p>
      )}
    
      {!serviceOnlyMode && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 px-1">
          <button
            onClick={() => setSelectedCard('product')}
            className={`flex-1 sm:flex-none min-w-[145px] px-4 sm:px-5 py-2.5 font-bold text-xs transition-all uppercase tracking-wider rounded-lg border shadow-sm
              ${selectedCard === 'product'
                ? 'bg-[#E5252A] border-[#E5252A] text-white'
                : darkMode
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-[#E5252A]'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-[#E5252A]'
              }`}
          >
            {editingProduct ? 'Edit Product (Active)' : 'Product Upload'}
          </button>
          <button
            onClick={() => setSelectedCard('service')}
            className={`flex-1 sm:flex-none min-w-[145px] px-4 sm:px-5 py-2.5 font-bold text-xs transition-all uppercase tracking-wider rounded-lg border shadow-sm
              ${selectedCard === 'service'
                ? 'bg-[#E5252A] border-[#E5252A] text-white'
                : darkMode
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-[#E5252A]'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-[#E5252A]'
              }`}
          >
            Service Upload
          </button>
        </div>
      )}

      {/* Product Upload Card */}
      {!serviceOnlyMode && selectedCard === 'product' && (
        <ProductUploadCard
          darkMode={darkMode}
          subscription={subscription}
          subscriptionLoading={subscriptionLoading}
          service={service}
          productImages={productImages}
          productVideos={productVideos}
          productViews={productViews}
          productTitle={productTitle}
          productDesc={productDesc}
          productPrice={productPrice}
          productMadeInRwanda={productMadeInRwanda}
          productUsed={productUsed}
          productPricingUnit={productPricingUnit}
          handleProductImageChange={handleProductImageChange}
          handleProductViewChange={handleProductViewChange}
          handleProductVideoChange={handleProductVideoChange}
          handleProductUpload={handleProductUpload}
          isUploading={isUploadingProduct}
          setProductTitle={setProductTitle}
          setProductDesc={setProductDesc}
          setProductPrice={setProductPrice}
          setProductMadeInRwanda={setProductMadeInRwanda}
          setProductUsed={setProductUsed}
          setProductPricingUnit={setProductPricingUnit}
          featureValues={featureValues}
          setFeatureValues={setFeatureValues}
          uploadProgress={productUploadProgress}
          isEditing={!!editingProduct}
          editingItemName={editingProduct?.title}
          onCancelEdit={handleCancelEditProduct}
          existingImageUrl={existingProductImageUrl}
          onRemoveExistingImage={() => setExistingProductImageUrl('')}
          existingViews={existingProductViews}
          onRemoveExistingView={(idx) => setExistingProductViews(prev => prev.filter((_, i) => i !== idx))}
          existingVideoUrl={existingProductVideoUrl}
          onRemoveExistingVideo={() => setExistingProductVideoUrl('')}
        />
      )}

      {(serviceOnlyMode || selectedCard === 'service') && (
        <ServiceUploadCard
          darkMode={darkMode}
          subscription={subscription}
          subscriptionLoading={subscriptionLoading}
          service={service}
          extraFieldsData={extraFieldsData}
          serviceImages={serviceImages}
          serviceVideos={serviceVideos}
          serviceViews={serviceViews}
          serviceTitle={serviceTitle}
          serviceDesc={serviceDesc}
          servicePrice={servicePrice}
          handleServiceImageChange={handleServiceImageChange}
          handleServiceViewChange={handleServiceViewChange}
          handleServiceVideoChange={handleServiceVideoChange}
          handleServiceUpload={handleServiceUpload}
          isUploading={isUploadingService}
          setServiceTitle={setServiceTitle}
          setServiceDesc={setServiceDesc}
          setServicePrice={setServicePrice}
          setExtraFieldsData={setExtraFieldsData}
          featureValues={featureValues}
          setFeatureValues={setFeatureValues}
          onReset={() => {
            setServiceImages([]);
            setServiceViews([]);
            setServiceVideos([]);
            setServiceTitle('');
            setServiceDesc('');
            setServicePrice('');
            setExtraFieldsData({
              pricePerHour: 0,
              pricePerDay: 0,
              discount: 0,
              withDriverCost: 0,
            });
            // Reset feature values
            if (service?.specific_features && service?.features) {
              const resetValues: Record<string, any> = {};
              service.features.forEach((feature) => {
                if (feature.type === 'simple') {
                  resetValues[feature.name] = '';
                } else if (feature.type === 'object') {
                  resetValues[feature.name] = {};
                }
              });
              setFeatureValues(resetValues);
            }
          }}
        />
      )}

      <MediaManagementSection
        darkMode={darkMode}
        apiBase={API_BASE}
        hideProducts={serviceOnlyMode}
        uploadedProductImages={uploadedProductImages}
        uploadedServiceImages={uploadedServiceImages}
        selectedProductImages={selectedProductImages}
        selectedServiceImages={selectedServiceImages}
        deletingImageIds={deletingImageIds}
        pendingDeleteQueue={pendingDeleteQueue}
        editingImage={editingImage}
        editingTitle={editingTitle}
        editingDesc={editingDesc}
        editingPrice={editingPrice}
        editingFeatureValues={editingFeatureValues}
        editingUsed={editingUsed}
        editingPricingUnit={editingPricingUnit}
        setEditingUsed={setEditingUsed}
        setEditingPricingUnit={setEditingPricingUnit}
        service={service}
        modalOpen={modalOpen}
        modalImage={modalImage}
        modalViews={modalViews}
        modalViewIndex={modalViewIndex}
        selectedModalItem={selectedModalItem}
        isBulkDeleting={isBulkDeleting}
        isBulkHiding={isBulkHiding}
        toggleSelectProduct={toggleSelectProduct}
        toggleSelectService={toggleSelectService}
        deleteSelected={deleteSelected}
        hideSelected={hideSelected}
        deleteImage={deleteImage}
        undoDelete={undoDelete}
        startEditing={startEditing}
        saveEdit={saveEdit}
        onCloseEdit={() => setEditingImage(null)}
        openModal={openModal}
        closeModal={closeModal}
        nextModalView={nextModalView}
        prevModalView={prevModalView}
        setEditingTitle={setEditingTitle}
        setEditingDesc={setEditingDesc}
        setEditingPrice={setEditingPrice}
        setEditingFeatureValues={setEditingFeatureValues}
        onRefreshMedia={loadMedia}
      />

    </div>
  );
}