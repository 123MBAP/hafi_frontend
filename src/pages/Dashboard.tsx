import React, { useEffect, useRef, useState } from 'react';
// import { Images } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import { ServiceFeature } from '@/types/features';
import DashboardOverviewCards from '../components/DashboardParts/DashboardOverviewCards'; // adjust path if needed
import MediaManagementSection from '../components/DashboardParts/MediaManagementSection';
import SubscriptionBanner from '../components/DashboardParts/PlansScrollingBanner';
import ProductUploadCard from '../components/DashboardParts/ProductUploadCard';
import ServiceUploadCard from '../components/DashboardParts/ServiceUploadCard';
import WhatsAppPromptBanner from '../components/DashboardParts/WhatsAppPromptBanner';
import ServicePromptBanner from '../components/DashboardParts/ServicePromptBanner';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
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
  mediaFiles?: UploadedMedia[]; // For grouped products with multiple media
}

export default function Dashboard() {
  const { darkMode } = useDarkMode();
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

  // For selection
  const [selectedProductImages, setSelectedProductImages] = useState<Set<string>>(new Set());
  const [selectedServiceImages, setSelectedServiceImages] = useState<Set<string>>(new Set());

  const [deletingImageIds, setDeletingImageIds] = useState<Set<string>>(new Set());
  const [pendingDeleteQueue, setPendingDeleteQueue] = useState<Map<string, UploadedMedia>>(new Map());

  // For upload
  const [productTitle, setProductTitle] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productMadeInRwanda, setProductMadeInRwanda] = useState(false);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  const providerId = localStorage.getItem('providerId');
  const { fetchWithAutoLogout, user } = useAuth();

  const [selectedCard, setSelectedCard] = useState<'product' | 'service' | 'messages'>('product');

  // Subscription info used to control access/restrictions
  const [subscription, setSubscription] = useState<any>(null);

  const [service, setService] = useState<{ id?: string; title?: string; custom_type?: string; specific_features?: boolean; features?: ServiceFeature[] } | null>(null);
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

  useEffect(() => {
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
        console.log('📦 RAW DATA FROM BACKEND:', data);

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
            mediaFiles: media.mediaFiles, // Include mediaFiles
          }));

          console.log('🔧 PROCESSED PRODUCTS:', processedProducts);
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

          console.log('🔧 PROCESSED SERVICES:', processedServices);
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
                  };
                }),
              );
            }

            if (Array.isArray(data.service)) {
              console.log('🔍 [DEBUG] Raw service data from backend:', data.service);
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
  }, [providerId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAutoLogout('http://localhost:5000/api/me');
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
        const res = await fetchWithAutoLogout('http://localhost:5000/api/provider/restrict/features');
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

  // Upload handlers
  const handleProductUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;

    if (isUploadingProduct) return;

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
      const formData = new FormData();
      formData.append('providerId', providerId);
      formData.append('title', productTitle);
      formData.append('desc', productDesc);
      formData.append('price', productPrice);
      formData.append('madeInRwanda', String(productMadeInRwanda));

      // Add feature values if service has specific_features
      if (service?.specific_features && service?.features) {
        formData.append('featureValues', JSON.stringify(featureValues));
      }

      // Add images
      productImages.forEach(image => formData.append('images', image));

      // Add videos
      productVideos.forEach(video => formData.append('videos', video));

      // Add view images
      productViews.flat().forEach(viewImage => formData.append('viewImages', viewImage));

      const uploadUrl = `${API_BASE}/api/upload/products/unified`;
      console.log('Upload URL:', uploadUrl);
      console.log('API_BASE:', API_BASE);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();

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
      } else {
        // Check if response has content before trying to parse JSON
        const contentType = response.headers.get('content-type');
        let errorMessage = `Upload failed with status: ${response.status} ${response.statusText}`;

        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = `Upload failed: ${error.error || error.message || 'Unknown error'}`;
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = `Upload failed: ${errorText}`;
          }
        }

        alert(errorMessage);
      }

    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploadingProduct(false);
    }
  };

  const handleServiceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;

    if (isUploadingService) return;
    setIsUploadingService(true);

    // Debug logging for feature data
    // console.log('═══════════════════════════════════════════════════════');
    // console.log('🚀 [FRONTEND] Starting Service Upload');
    // console.log('═══════════════════════════════════════════════════════');
    // console.log('📦 Service has specific_features:', service?.specific_features);
    // console.log('📦 Service features defined:', service?.features);
    // console.log('📦 Current featureValues state:', JSON.stringify(featureValues, null, 2));
    // console.log('═══════════════════════════════════════════════════════');

    try {

      // Upload images
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
        if (service?.specific_features && service?.features) {
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
        if (service?.specific_features && service?.features) {
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

      setServiceImages([]);
      setServiceVideos([]);
      setServiceTitle('');
      setServiceDesc('');
      setServicePrice('');
      setServiceViews([]);
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
    } finally {
      setIsUploadingService(false);
    }
  };

  // Editing handlers
  const startEditing = (img: UploadedMedia) => {
    console.log('🔧 [EDIT] Starting edit for:', img);
    console.log('🔧 [EDIT] Image has feature_values:', (img as any).feature_values);

    setEditingImage(img);
    setEditingTitle(img.title);
    setEditingDesc(img.desc);
    setEditingPrice(img.price);
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
          featureValues: editingFeatureValues
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
              ? { ...img, title: editingTitle, desc: editingDesc, price: editingPrice }
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
    console.log('🚀 [DASHBOARD] useEffect triggered');
    console.log('🆔 Provider ID:', providerId);

    if (!providerId) {
      console.warn('⚠️ [DASHBOARD] No providerId found, skipping service fetch');
      return;
    }

    // Add timestamp to bust cache and ensure fresh data
    const cacheBuster = Date.now();
    const fetchUrl = `${API_BASE}/api/providers/${providerId}/service?t=${cacheBuster}`;

    console.log('🌐 [DASHBOARD] Starting service fetch...');
    console.log('📍 Fetch URL:', fetchUrl);
    console.log('🔧 API_BASE:', API_BASE);

    fetch(fetchUrl, {
      cache: 'no-store' // Prevent browser from caching this request
    })
      .then(res => {
        console.log('📥 [DASHBOARD] Fetch response received');
        console.log('   Status:', res.status);
        console.log('   Status Text:', res.statusText);
        console.log('   OK:', res.ok);

        if (!res.ok) {
          if (res.status === 404) {
            console.warn('⚠️ Provider is not linked to any service. Please contact admin to assign a service.');
            return null;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        console.log('✅ [DASHBOARD] Response OK, parsing JSON...');
        return res.json();
      })
      .then(async data => {
        console.log('📦 [DASHBOARD] JSON parsed, data received');
        console.log('   Data is null?', data === null);
        console.log('   Data is undefined?', data === undefined);

        if (!data) {
          // Provider not linked to service
          console.log('ℹ️ [DASHBOARD] No data returned (provider not linked to service)');
          setService(null);
          return;
        }
        console.log('🔍 Service data loaded:', data);
        console.log('📝 Has specific_features:', data.specific_features);
        console.log('📋 Features array:', data.features);

        // Enhanced debugging - print exact data structure
        console.log('═══════════════════════════════════════════════════════');
        console.log('🐛 DETAILED SERVICE DATA DEBUG:');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📦 Full Service Object (JSON):');
        console.log(JSON.stringify(data, null, 2));
        console.log('───────────────────────────────────────────────────────');
        console.log('🔑 Service Properties:');
        console.log('  - ID:', data.id);
        console.log('  - Title:', data.title);
        console.log('  - Specific Features Enabled:', data.specific_features);
        console.log('  - Features Type:', typeof data.features);
        console.log('  - Features Is Array:', Array.isArray(data.features));
        console.log('  - Features Length:', data.features?.length || 0);
        console.log('───────────────────────────────────────────────────────');

        if (data.features && Array.isArray(data.features)) {
          console.log('📋 FEATURES BREAKDOWN:');
          data.features.forEach((feature: any, index: number) => {
            console.log(`\n  Feature #${index + 1}:`);
            console.log('    - Type:', feature.type);
            console.log('    - Name:', feature.name);
            if (feature.type === 'object' && feature.schema) {
              console.log('    - Schema Fields:', Object.keys(feature.schema));
              console.log('    - Full Schema:', JSON.stringify(feature.schema, null, 6));
            }
            console.log('    - Full Feature Object:', JSON.stringify(feature, null, 6));
          });
        } else {
          console.log('⚠️ Features is not an array or is undefined/null');
        }
        console.log('═══════════════════════════════════════════════════════');

        setService(data);
        // Initialize feature values with empty strings or empty objects
        if (data.specific_features && data.features) {
          const initialValues: Record<string, any> = {};
          data.features.forEach((feature: any) => {
            if (feature.type === 'simple') {
              initialValues[feature.name] = '';
            } else if (feature.type === 'object') {
              // Initialize nested object with empty values for each field
              initialValues[feature.name] = {};
            }
          });
          setFeatureValues(initialValues);
          console.log('✅ Feature values initialized:', initialValues);
        } else {
          console.log('ℹ️ Service does not have custom features enabled');
          if (!data.specific_features) {
            console.log('   Reason: specific_features is', data.specific_features);
          }
          if (!data.features) {
            console.log('   Reason: features is', data.features);
          }
        }
      })
      .catch(err => console.error("❌ Error loading service data:", err));
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

  return (
    <div className={`w-full mt-0 -mx-4 sm:mx-0 px-0 sm:px-2 overflow-x-hidden ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"}`}>
      <div
        className="sticky z-40 w-full overflow-x-hidden overflow-y-visible bg-yellow-100 border-b border-yellow-400 mb-2"
        style={{ top: 'var(--navbar-height)' }}
      >
        <SubscriptionBanner />
      </div>

      <h2 className={`text-4xl font-bold mb-2 text-center ${darkMode ? "text-teal-300" : "text-hafi-teal"}`}>Service Provider's Dashboard</h2>
      {service?.title && (
        <p className={`text-center mb-6 text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Service: <span className={`font-semibold ${darkMode ? "text-teal-400" : "text-hafi-teal"}`}>{service.title}</span>
        </p>
      )}
      <section className="py-4 px-0 md:p-8 ">
        {user?.roles?.includes('service_provider') && !service ? (
          <ServicePromptBanner darkMode={darkMode} />
        ) : (
          <WhatsAppPromptBanner providerId={providerId} darkMode={darkMode} />
        )}
        <DashboardOverviewCards />
      </section>

      {!serviceOnlyMode && (
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setSelectedCard('product')}
            className={`px-4 py-2 rounded transition-colors ${selectedCard === 'product'
              ? darkMode
                ? 'bg-teal-600 text-white'
                : 'bg-hafi-green text-white'
              : darkMode
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Product Upload
          </button>
          <button
            onClick={() => setSelectedCard('service')}
            className={`px-4 py-2 rounded transition-colors ${selectedCard === 'service'
              ? darkMode
                ? 'bg-teal-600 text-white'
                : 'bg-hafi-green text-white'
              : darkMode
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-200 hover:bg-gray-300'
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
          service={service}
          productImages={productImages}
          productVideos={productVideos}
          productTitle={productTitle}
          productDesc={productDesc}
          productPrice={productPrice}
          productMadeInRwanda={productMadeInRwanda}
          handleProductImageChange={handleProductImageChange}
          handleProductViewChange={handleProductViewChange}
          handleProductVideoChange={handleProductVideoChange}
          handleProductUpload={handleProductUpload}
          isUploading={isUploadingProduct}
          setProductTitle={setProductTitle}
          setProductDesc={setProductDesc}
          setProductPrice={setProductPrice}
          setProductMadeInRwanda={setProductMadeInRwanda}
          featureValues={featureValues}
          setFeatureValues={setFeatureValues}
        />
      )}

      {(serviceOnlyMode || selectedCard === 'service') && (
        <ServiceUploadCard
          darkMode={darkMode}
          subscription={subscription}
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
      />

    </div>
  );
}