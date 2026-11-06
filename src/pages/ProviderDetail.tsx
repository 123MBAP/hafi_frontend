import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { FaEnvelope, FaMapMarkerAlt, FaPhone, FaWhatsapp } from "react-icons/fa";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { cachedFetch } from '../utils/cachedFetch';
import ChatBox from './ChatBox';
import { ArrowLeft, Package, Briefcase, Heart, ShoppingBag, Calendar, ChevronRight, X, MapPin, Phone as PhoneIcon, Mail, MessageCircle, FileText } from 'lucide-react';
import { API_BASE } from '../api/apiClient';


const isVideoUrl = (url: string) => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') ||
    lowerUrl.includes('.avi') || lowerUrl.includes('.webm');
};

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

const getCardPreviewUrl = (item: { url?: string; views?: string[]; mediaFiles?: Array<{ url: string; type: 'image' | 'video' }> }) => {
  const imageFromMain = item.url && !isVideoUrl(item.url) ? item.url : '';
  const imageFromMediaFiles = item.mediaFiles?.find((media) => media.type === 'image')?.url || '';
  const imageFromViews = (item.views || []).find((view) => !isVideoUrl(view)) || '';

  return imageFromMain || imageFromMediaFiles || imageFromViews || item.url || '';
};

type ImageType = "product" | "service";

interface Provider {
  id: string;
  email: string;
  name: string;
  location: { lat: number; lng: number } | null;
  whatsapp_number?: string;
  phone_number?: string;
  profile_image?: string;
  profile_image_url?: string;
  address?: {
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
    known_place?: string;
  };
  bio?: string;
}

interface ProviderImage {
  productId: string;
  url: string;
  title?: string;
  desc?: string;
  price?: number;
  type: ImageType;
  visible?: boolean;
  sizes?: string[];
  fileType?: 'image' | 'video' | 'mixed';
  views?: string[];
  mediaFiles?: Array<{ url: string; type: 'image' | 'video' }>;
  madeInRwanda?: boolean;
  inStock?: boolean;
}

interface ProfileImage {
  image_url: string;
  providerId: string;
  role: string;
}

export default function ProviderDetail() {
  const { darkMode } = useDarkMode();
  const { isLoggedIn } = useAuth();
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [images, setImages] = useState<ProviderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalViews, setModalViews] = useState<string[]>([]);
  const [modalViewIndex, setModalViewIndex] = useState(0);
  const [selectedModalItem, setSelectedModalItem] = useState<ProviderImage | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedType, setSelectedType] = useState<ImageType | "all">("all");
  const [customerId, setCustomerId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isContactCollapsed, setIsContactCollapsed] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.roles && decoded.roles.includes('customer')) {
          setCustomerId(decoded.id);
        }
      } catch (e) {
        console.error("Failed to decode JWT", e);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (!providerId) return;

        const data = await cachedFetch<any>(`${API_BASE}/api/providers/${providerId}/uploads/images`);

        const imgs: ProviderImage[] = [];
        if (Array.isArray(data.product)) {
          imgs.push(...data.product.map((img: any) => ({
            productId: img.id || img.productId,
            url: img.url,
            title: img.title,
            desc: img.desc,
            price: img.price,
            type: "product",
            visible: img.visible !== false,
            sizes: img.sizes || [],
            fileType: img.fileType || 'image',
            views: img.views || [],
            mediaFiles: img.mediaFiles || [],
            madeInRwanda: img.madeInRwanda || false,
            inStock: img.inStock !== false && img.in_stock !== false,
          })));
        }
        if (Array.isArray(data.service)) {
          imgs.push(...data.service.map((img: any) => ({
            productId: img.id || img.productId,
            url: img.url,
            title: img.title,
            desc: img.desc,
            price: img.price,
            type: "service",
            visible: img.visible !== false,
            sizes: img.sizes || [],
            fileType: img.fileType || 'image',
            views: img.views || [],
            mediaFiles: img.mediaFiles || [],
            madeInRwanda: img.madeInRwanda || false,
          })));
        }
        setImages(imgs);

        const providerData = await cachedFetch<Provider>(`${API_BASE}/api/providers/${providerId}`);
        setProvider(providerData);
      } catch (err) {
        console.error("Fetch error", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [providerId]);

  useEffect(() => {
    if (provider) {
      const directImg = provider.profile_image || provider.profile_image_url;
      if (directImg) {
        setProfileImageUrl(toAbsoluteMediaUrl(directImg));
      }
    }
  }, [provider]);

  useEffect(() => {
    async function fetchProfileImages() {
      try {
        const data = await cachedFetch<ProfileImage[]>(`${API_BASE}/api/profile-images`);

        if (!provider) return;

        // Match by provider id first, fall back to email or name if necessary
        const matched = data.find(p => String(p.providerId) === String(provider.id)
          || String(p.providerId) === String(provider.email)
          || String(p.providerId) === String(provider.name)
        );
        if (matched?.image_url) {
          // reuse existing helper to normalize relative and absolute media URLs
          const absolute = toAbsoluteMediaUrl(matched.image_url);
          setProfileImageUrl(absolute || matched.image_url);
        }
      } catch (error) {
        console.error("Error fetching profile images:", error);
      }
    }

    fetchProfileImages();
  }, [provider]);

  const filteredImages = images.filter(img => selectedType === "all" || img.type === selectedType);

  const handleImageClick = (item: ProviderImage) => {
    const videoUrls: string[] = [];
    if ((item.fileType === 'mixed' || item.fileType === 'video') && Array.isArray(item.mediaFiles)) {
      item.mediaFiles.forEach((media: any) => {
        if (media.type === 'video') {
          videoUrls.push(media.url);
        }
      });
    }

    const views = Array.isArray(item.views) ? item.views : [];
    const allMedia = [item.url, ...views, ...videoUrls].filter(Boolean) as string[];
    const imagesList = allMedia.filter(url => !isVideoUrl(url));
    const videos = allMedia.filter(url => isVideoUrl(url));
    const orderedMedia = [...imagesList, ...videos];

    setModalViews(orderedMedia);
    setModalImage(orderedMedia[0]);
    setModalViewIndex(0);
    setSelectedModalItem(item);
    setModalOpen(true);
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
      const newIndex = (modalViewIndex + 1) % modalViews.length;
      setModalViewIndex(newIndex);
      setModalImage(modalViews[newIndex]);
    }
  };

  const prevModalView = () => {
    if (modalViews.length > 0) {
      const newIndex = (modalViewIndex - 1 + modalViews.length) % modalViews.length;
      setModalViewIndex(newIndex);
      setModalImage(modalViews[newIndex]);
    }
  };

  const handleBuyProduct = (image: ProviderImage) => {
    navigate(`/product-or-service-detail/${providerId}/${image.productId}`);
  };

  const handleBookService = (image: ProviderImage) => {
    navigate(`/product-or-service-detail/${providerId}/${image.productId}`);
  };

  const handleChatClick = () => {
    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          from: location.pathname + location.search,
          message: 'Please log in to start a chat'
        }
      });
      return;
    }

    if (!customerId) {
      alert('Only customers can initiate chats. Please ensure you are logged in with a customer account.');
      return;
    }

    setShowChat(true);
  };

  const whatsappNumber = provider?.whatsapp_number || "";
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : undefined;
  const emailLink = provider?.email ? `mailto:${provider.email}` : undefined;

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${bgColor}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" message="Loading provider details..." variant="dots" />
      </div>
    </div>
  );

  if (!provider) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor}`}>
        <div className="text-center">
          <h2 className={`text-xl font-bold mb-2 ${textColor}`}>Provider Not Found</h2>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-[#E5252A] hover:bg-[#c91d22] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`mb-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            darkMode
              ? 'border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800'
              : 'border-[#E5E5E5] bg-white text-[#151515] hover:bg-[#F5F5F5]'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-[#E5E5E5] dark:border-gray-800 ${cardBg} shadow-xs`}
          >
            <MapPin className="w-4 h-4 text-[#E5252A]" />
            Contact Info
          </button>
          <div className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
            {filteredImages.length} items
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Contact Info */}
          <div className={`lg:w-72 flex-shrink-0 ${sidebarOpen ? 'fixed inset-0 z-50 lg:relative lg:z-auto' : 'hidden lg:block'}`}>
            {sidebarOpen && (
              <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
            )}
            <div className={`relative z-50 w-72 lg:w-full h-full lg:h-auto overflow-y-auto ${cardBg} border border-[#E5E5E5] dark:border-gray-800 rounded-2xl shadow-xs p-5 ${sidebarOpen ? 'fixed left-0 top-0' : ''}`}>
              <div className="flex justify-between items-center mb-4 lg:hidden">
                <h3 className={`font-bold text-sm uppercase tracking-wider ${textColor}`}>Contact Info</h3>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg text-gray-500 hover:text-[#151515]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Image */}
              <div className="flex justify-center mb-4">
                <img
                  src={profileImageUrl || '/default-profile.png'}
                  alt={provider.name || provider.email}
                  className="w-20 h-20 object-cover rounded-2xl border border-[#E5E5E5] dark:border-gray-800 shadow-xs"
                />
              </div>

              <h2 className={`text-center text-base font-bold mb-4 ${textColor}`}>
                {provider.name || provider.email.split('@')[0]}
              </h2>

              {/* Contact Information */}
              <div className="space-y-2">
                {provider.phone_number && (
                  <a
                    href={`tel:${provider.phone_number}`}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-[#F5F5F5] text-gray-700'}`}
                  >
                    <PhoneIcon className="w-4 h-4 text-[#E5252A] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>Phone</div>
                      <div className="text-xs font-semibold truncate">{provider.phone_number}</div>
                    </div>
                  </a>
                )}

                {provider.email && (
                  <a
                    href={`mailto:${provider.email}`}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-[#F5F5F5] text-gray-700'}`}
                  >
                    <Mail className="w-4 h-4 text-[#E5252A] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>Email</div>
                      <div className="text-xs font-semibold truncate max-w-[170px]">{provider.email}</div>
                    </div>
                  </a>
                )}

                {provider.whatsapp_number && (
                  <a
                    href={`https://wa.me/${provider.whatsapp_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-[#F5F5F5] text-gray-700'}`}
                  >
                    <FaWhatsapp className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>WhatsApp</div>
                      <div className="text-xs font-semibold truncate">{provider.whatsapp_number}</div>
                    </div>
                  </a>
                )}
              </div>

              {/* Address */}
              {provider.address && (() => {
                const addr = typeof provider.address === "string"
                  ? JSON.parse(provider.address)
                  : provider.address;
                const addressParts = [addr.district, addr.sector, addr.cell].filter(Boolean);
                if (addressParts.length > 0) {
                  return (
                    <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-[#E5252A]" />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>Location</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {addressParts.map((part, idx) => (
                          <span key={idx} className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-[#F5F5F5] text-[#151515]'}`}>
                            {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Bio */}
              {provider.bio && (
                <div className={`mt-4 pt-4 border-t ${borderColor} text-xs leading-relaxed`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-[#E5252A]" />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>About Provider</span>
                  </div>
                  <p className={`${
                    isBioExpanded ? '' : 'line-clamp-4'
                  } ${textColor} text-xs leading-relaxed`}>
                    {provider.bio}
                  </p>
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-[#E5252A] hover:text-[#c91d22] font-bold mt-1.5 text-[10px] uppercase tracking-wider block"
                  >
                    {isBioExpanded ? 'View Less' : 'View More'}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className={`mt-6 pt-4 border-t ${borderColor} space-y-2.5`}>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-xs"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                <div className="w-full">
                  <button
                    onClick={handleChatClick}
                    className="w-full py-3 bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 rounded-xl"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Instant Chat Dialog</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Type Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedType("all")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl ${selectedType === "all"
                    ? 'bg-[#E5252A] text-white shadow-xs'
                    : darkMode ? 'bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-white border border-[#E5E5E5] text-gray-700 hover:bg-[#F5F5F5]'
                  }`}
              >
                All ({images.length})
              </button>
              <button
                onClick={() => setSelectedType("product")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl ${selectedType === "product"
                    ? 'bg-[#E5252A] text-white shadow-xs'
                    : darkMode ? 'bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-white border border-[#E5E5E5] text-gray-700 hover:bg-[#F5F5F5]'
                  }`}
              >
                <Package className="w-3.5 h-3.5" />
                Products ({images.filter(i => i.type === "product").length})
              </button>
              <button
                onClick={() => setSelectedType("service")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl ${selectedType === "service"
                    ? 'bg-[#E5252A] text-white shadow-xs'
                    : darkMode ? 'bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-white border border-[#E5E5E5] text-gray-700 hover:bg-[#F5F5F5]'
                  }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Services ({images.filter(i => i.type === "service").length})
              </button>
            </div>

            {/* Items Grid */}
            {filteredImages.length === 0 ? (
              <div className={`text-center py-16 text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                No items found in this category.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full ${cardBg} border border-[#E5E5E5] dark:border-gray-800 rounded-2xl hover:border-[#E5252A]/40`}
                  >
                    {/* Image */}
                    <div
                      className="relative h-44 overflow-hidden bg-[#F5F5F5] dark:bg-gray-950"
                      onClick={() => navigate(`/product-or-service-detail/${providerId}/${img.productId}`)}
                    >
                      {(() => {
                        const previewUrl = toAbsoluteMediaUrl(getCardPreviewUrl(img));
                        return (
                      <img
                        src={previewUrl || '/default-profile.png'}
                        alt={img.title || `item-${idx}`}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${img.type === 'product' && img.inStock === false ? 'opacity-60' : ''}`}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/default-profile.png';
                        }}
                      />
                        );
                      })()}
                      {img.type === 'product' && img.inStock === false && (
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[10px] font-bold bg-[#E5252A] text-white z-10 rounded-full shadow-xs uppercase tracking-wider">
                          OUT OF STOCK
                        </div>
                      )}
                      {img.type === "product" ? (
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-white rounded-full shadow-xs">
                          Product
                        </div>
                      ) : (
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full shadow-xs">
                          Service
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className={`text-sm font-bold line-clamp-1 mb-1 ${darkMode ? 'text-white group-hover:text-[#E5252A]' : 'text-[#151515] group-hover:text-[#E5252A]'} transition-colors`}>
                          {img.title || 'Untitled'}
                        </h3>
                        
                        {img.desc && (
                          <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${mutedText}`}>
                            {img.desc}
                          </p>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#E5E5E5] dark:border-gray-800">
                        <div className={`text-sm font-extrabold mb-2.5 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                          {img.price ? `RWF ${img.price.toLocaleString()}` : "Contact for price"}
                        </div>
                        
                        <div>
                          {img.type === 'product' && img.inStock === false ? (
                            <button
                              disabled
                              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-xl cursor-not-allowed"
                            >
                              Out of Stock
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); img.type === "product" ? handleBuyProduct(img) : handleBookService(img); }}
                              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl bg-[#E5252A] text-white hover:bg-[#c91d22] shadow-xs"
                            >
                              {img.type === "product" ? (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  Buy
                                </>
                              ) : (
                                <>
                                  <Calendar className="w-3.5 h-3.5" />
                                  Book
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && providerId && customerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh]">
            <ChatBox
              providerId={providerId}
              customerId={customerId}
              currentUserRole='customer'
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* Media Modal */}
      {modalOpen && modalImage && selectedModalItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4" onClick={closeModal}>
          <div className="relative max-w-5xl max-h-[95vh]" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {modalViews.length > 1 && (
              <>
                <button
                  onClick={prevModalView}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <button
                  onClick={nextModalView}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="bg-black overflow-hidden rounded-2xl">
              {(() => {
                const currentUrl = modalViews[modalViewIndex] || modalImage;
                const isVideo = selectedModalItem.fileType === 'video' ||
                  currentUrl.toLowerCase().includes('.mp4') ||
                  currentUrl.toLowerCase().includes('.mov');

                return isVideo ? (
                  <video
                    src={toAbsoluteMediaUrl(currentUrl)}
                    controls
                    autoPlay={false}
                    className="max-w-[90vw] max-h-[80vh] rounded-2xl"
                    style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={toAbsoluteMediaUrl(currentUrl)}
                    alt={selectedModalItem.title || 'Full size'}
                    className="max-w-[90vw] max-h-[80vh] rounded-2xl"
                    style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }}
                  />
                );
              })()}
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full border border-white/10 shadow-lg">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold">{selectedModalItem.title}</span>
                {modalViews.length > 1 && (
                  <span className="text-gray-300">{modalViewIndex + 1} / {modalViews.length}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}