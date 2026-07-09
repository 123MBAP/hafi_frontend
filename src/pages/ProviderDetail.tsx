import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { FaEnvelope, FaMapMarkerAlt, FaPhone, FaWhatsapp } from "react-icons/fa";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { cachedFetch } from '../utils/cachedFetch';
import ChatBox from './ChatBox';
import { Package, Briefcase, Heart, ShoppingBag, Calendar, ChevronRight, X, MapPin, Phone as PhoneIcon, Mail, MessageCircle } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const isVideoUrl = (url: string) => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') ||
    lowerUrl.includes('.avi') || lowerUrl.includes('.webm');
};

const toAbsoluteMediaUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return '';

  const trimmed = String(rawUrl).trim();
  if (!trimmed) return '';

  if (/^(https?:|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, '/');

  if (normalized.startsWith('/')) {
    return `${API_BASE}${normalized}`;
  }

  return `${API_BASE}/${normalized.replace(/^\/+/, '')}`;
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
  address?: {
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
    known_place?: string;
  };
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
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-emerald-500 text-white rounded-sm">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm ${cardBg} shadow-sm`}
            style={{ borderRadius: '2px' }}
          >
            <MapPin className="w-4 h-4" />
            Contact Info
          </button>
          <div className={`text-sm ${mutedText}`}>
            {filteredImages.length} items
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Contact Info */}
          <div className={`lg:w-64 flex-shrink-0 ${sidebarOpen ? 'fixed inset-0 z-50 lg:relative lg:z-auto' : 'hidden lg:block'}`}>
            {sidebarOpen && (
              <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}
            <div className={`relative z-50 w-72 lg:w-full h-full lg:h-auto overflow-y-auto ${cardBg} border-0 shadow-sm p-4 ${sidebarOpen ? 'fixed left-0 top-0' : ''}`} style={{ borderRadius: '2px' }}>
              <div className="flex justify-between items-center mb-4 lg:hidden">
                <h3 className={`font-semibold ${textColor}`}>Contact Info</h3>
                <button onClick={() => setSidebarOpen(false)} className="p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Image */}
              <div className="flex justify-center mb-4">
                <img
                  src={profileImageUrl || '/default-profile.png'}
                  alt={provider.name || provider.email}
                  className="w-20 h-20 object-cover"
                  style={{ borderRadius: '2px' }}
                />
              </div>

              <h2 className={`text-center text-lg font-bold mb-4 ${textColor}`}>
                {provider.name || provider.email.split('@')[0]}
              </h2>

              {/* Contact Information */}
              <div className="space-y-3">
                {provider.phone_number && (
                  <a
                    href={`tel:${provider.phone_number}`}
                    className={`flex items-center gap-3 p-2 transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <PhoneIcon className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className={`text-xs ${mutedText}`}>Phone</div>
                      <div className={`text-sm ${textColor}`}>{provider.phone_number}</div>
                    </div>
                  </a>
                )}

                {provider.email && (
                  <a
                    href={`mailto:${provider.email}`}
                    className={`flex items-center gap-3 p-2 transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className={`text-xs ${mutedText}`}>Email</div>
                      <div className={`text-sm ${textColor} truncate max-w-[180px]`}>{provider.email}</div>
                    </div>
                  </a>
                )}

                {provider.whatsapp_number && (
                  <a
                    href={`https://wa.me/${provider.whatsapp_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-2 transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <FaWhatsapp className="w-4 h-4 text-green-500" />
                    <div>
                      <div className={`text-xs ${mutedText}`}>WhatsApp</div>
                      <div className={`text-sm ${textColor}`}>{provider.whatsapp_number}</div>
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
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span className={`text-xs font-medium uppercase ${mutedText}`}>Location</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {addressParts.map((part, idx) => (
                          <span key={idx} className={`text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`} style={{ borderRadius: '2px' }}>
                            {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t ${borderColor} space-y-2">
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                    style={{ borderRadius: '2px' }}
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                <button
                  onClick={handleChatClick}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${darkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}
                  style={{ borderRadius: '2px' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Type Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedType("all")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${selectedType === "all"
                    ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                  } shadow-sm`}
                style={{ borderRadius: '2px' }}
              >
                All ({images.length})
              </button>
              <button
                onClick={() => setSelectedType("product")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${selectedType === "product"
                    ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                  } shadow-sm`}
                style={{ borderRadius: '2px' }}
              >
                <Package className="w-3.5 h-3.5" />
                Products ({images.filter(i => i.type === "product").length})
              </button>
              <button
                onClick={() => setSelectedType("service")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${selectedType === "service"
                    ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                  } shadow-sm`}
                style={{ borderRadius: '2px' }}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Services ({images.filter(i => i.type === "service").length})
              </button>
            </div>

            {/* Items Grid */}
            {filteredImages.length === 0 ? (
              <div className={`text-center py-16 ${mutedText}`}>
                No items found in this category.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full ${cardBg} border-0 shadow-sm`}
                    style={{ borderRadius: '2px' }}
                  >
                    {/* Image */}
                    <div
                      className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-700"
                      onClick={() => navigate(`/product-or-service-detail/${providerId}/${img.productId}`)}
                    >
                      {(() => {
                        const previewUrl = toAbsoluteMediaUrl(getCardPreviewUrl(img));
                        return (
                      <img
                        src={previewUrl || '/default-profile.png'}
                        alt={img.title || `item-${idx}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/default-profile.png';
                        }}
                      />
                        );
                      })()}
                      {img.type === "product" ? (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500 text-white" style={{ borderRadius: '2px' }}>
                          Product
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-blue-500 text-white" style={{ borderRadius: '2px' }}>
                          Service
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className={`text-sm font-semibold line-clamp-1 mb-1 ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors`}>
                        {img.title || 'Untitled'}
                      </h3>
                      
                      {img.desc && (
                        <p className={`text-xs line-clamp-2 mb-2 ${mutedText}`}>
                          {img.desc}
                        </p>
                      )}

                      <div className="mt-auto">
                        <div className={`text-base font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {img.price ? `RWF ${img.price.toLocaleString()}` : "Contact for price"}
                        </div>
                        
                        <div className="mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); img.type === "product" ? handleBuyProduct(img) : handleBookService(img); }}
                            className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors 
                              ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                            style={{ borderRadius: '2px' }}
                          >
                            {img.type === "product" ? (
                              <>
                                <ShoppingBag className="w-3 h-3" />
                                Buy
                              </>
                            ) : (
                              <>
                                <Calendar className="w-3 h-3" />
                                Book
                              </>
                            )}
                          </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
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
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
              style={{ borderRadius: '2px' }}
            >
              <X className="w-5 h-5" />
            </button>

            {modalViews.length > 1 && (
              <>
                <button
                  onClick={prevModalView}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white transition-colors"
                  style={{ borderRadius: '2px' }}
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <button
                  onClick={nextModalView}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white transition-colors"
                  style={{ borderRadius: '2px' }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="bg-black overflow-hidden">
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
                    className="max-w-[90vw] max-h-[80vh]"
                    style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={toAbsoluteMediaUrl(currentUrl)}
                    alt={selectedModalItem.title || 'Full size'}
                    className="max-w-[90vw] max-h-[80vh]"
                    style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }}
                  />
                );
              })()}
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1.5" style={{ borderRadius: '2px' }}>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-medium">{selectedModalItem.title}</span>
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