import { useDarkMode } from "@/context/DarkMode";
import { FaEnvelope, FaPhone, FaWhatsapp } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { API_BASE } from '../api/apiClient';



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
interface ProductOrServiceDetailProps {
  productId: string;
  title: string;
  description?: string;
  price: number;
  imageUrl: string;
  imageViews?: string[]; // additional views (urls)
  onAddToCart: (item: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    imageUrl: string;
    type: string;
    description?: string;
    used?: boolean;
    pricingUnit?: string;
    serviceCustomization?: {
      needsCustomization: boolean;
      customizationRequest?: string;
      noCustomizationNeeded?: boolean;
    };
  }) => void;

  type?: string;
  minQuantity?: number;
  maxQuantity?: number;
  quantity?: number;
  setQuantity?: React.Dispatch<React.SetStateAction<number>>;
  setMessage?: (msg: string) => void;
  message?: string;
  providerId?: string;
  providerName?: string;
  providerEmail?: string;
  providerPhone?: string;
  providerWhatsapp?: string;
  providerProfileImage?: string;
  onBack?: () => void;
  madeInRwanda?: boolean;
  used?: boolean;
  pricingUnit?: string;
  pricing_unit?: string;
  inStock?: boolean;
  viewMorePath?: string;
  relatedItems?: Array<{
    productId: string;
    url: string;
    title?: string;
    price?: number;
    type: "product" | "service";
    description?: string;
    desc?: string;
  }>;
}



export default function ProductOrServiceDetail({
  productId,
  title = "Product Title",
  description,
  price = 1000,
  imageUrl = "",
  imageViews = [],
  onAddToCart,
  minQuantity = 1,
  maxQuantity = 100,
  setMessage,
  message,
  type = "product",
  providerId,
  providerName,
  providerEmail,
  providerPhone,
  providerWhatsapp,
  providerProfileImage,
  onBack,
  madeInRwanda,
  used,
  pricingUnit,
  pricing_unit,
  inStock,
  viewMorePath,
  relatedItems = [],
}: ProductOrServiceDetailProps) {
  const [quantity, setQuantity] = useState(minQuantity);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [customizationRequest, setCustomizationRequest] = useState("");
  const [noCustomizationNeeded, setNoCustomizationNeeded] = useState(false);
  const [customizationError, setCustomizationError] = useState("");
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  const isOutOfStock = inStock === false || String(inStock) === 'false';
  const handleBack = onBack || (() => navigate(-1));

  const descriptionLines = description ? description.split('\n') : [];
  const hasLongDescription = descriptionLines.length > 15 || (description && description.length > 500);

  // Format amounts as Rwandan Francs (RWF) without decimals
  const formatFrw = (amount: number) => `${Math.round(amount).toLocaleString('en-US')} RWF`;

  const allImages = [
    imageUrl,
    ...(imageViews ?? [])
  ];

  // Helper to detect if URL is a video (case-insensitive)
  const isVideo = (url: string) => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') ||
      lowerUrl.includes('.avi') || lowerUrl.includes('.webm');
  };

  const handleAddToCart = () => {
    // Validate customization for services
    if (type === "service") {
      if (!customizationRequest.trim() && !noCustomizationNeeded) {
        setCustomizationError("Please specify your customization needs or select 'No customization needed'");
        return;
      }
    }
    setCustomizationError("");

    onAddToCart({
      productId,
      title,
      price,
      quantity,
      imageUrl: allImages[0],
      type,
      description,
      used,
      pricingUnit: pricingUnit || pricing_unit || 'Per Item / Piece',
      ...(type === "service" && {
        serviceCustomization: {
          needsCustomization: !!customizationRequest.trim(),
          customizationRequest: customizationRequest.trim() || undefined,
          noCustomizationNeeded,
        },
      }),
    });
    
    // Reset customization fields
    setCustomizationRequest("");
    setNoCustomizationNeeded(false);
    setMessage?.(type === "service" ? "Service added to cart successfully" : "Product added to cart successfully");
  };

  const handleDecrease = () => setQuantity(q => Math.max(minQuantity, q - 1));
  const handleIncrease = () => setQuantity(q => Math.min(maxQuantity, q + 1));

  const navigateImages = (direction: 'prev' | 'next') => {
    setCurrentImageIndex(prev => {
      if (direction === 'prev') {
        return prev === 0 ? allImages.length - 1 : prev - 1;
      } else {
        return prev === allImages.length - 1 ? 0 : prev + 1;
      }
    });
  };

  return (
    <div className={`w-full px-4 py-10 mx-auto ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <button
        type="button"
        onClick={handleBack}
        className={`mb-6 inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
          darkMode
            ? 'border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {(providerId || providerName || providerEmail || providerPhone || providerWhatsapp) && (
        <div className={`mb-6 p-5 rounded-2xl border shadow-xs ${darkMode ? "border-gray-800 bg-gray-900" : "border-[#E5E5E5] bg-white"}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={providerProfileImage || '/default-profile.png'}
                alt={providerName || providerEmail || 'Provider profile'}
                className="w-14 h-14 object-cover flex-shrink-0 rounded-xl border border-[#E5E5E5] dark:border-gray-800"
              />
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Service provider
                </div>
                <h3 className={`text-base font-bold truncate ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                  {providerName || providerEmail?.split('@')[0] || 'Provider'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (!providerId) return;
                    if (viewMorePath) {
                      navigate(viewMorePath);
                    } else if (madeInRwanda) {
                      navigate(`/made-in-rwanda?providerId=${providerId}`);
                    } else {
                      navigate(`/provider/${providerId}/uploads`);
                    }
                  }}
                  className="mt-2 inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors md:w-auto w-full rounded-xl bg-[#E5252A] text-white hover:bg-[#c91d22] shadow-xs"
                >
                  View more by {providerName || 'this provider'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-shrink-0">
              {providerPhone && (
                <a
                  href={`tel:${providerPhone}`}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? 'text-gray-200 hover:text-[#E5252A]' : 'text-gray-700 hover:text-[#E5252A]'}`}
                >
                  <FaPhone className="w-3.5 h-3.5 text-[#E5252A]" />
                  <span>{providerPhone}</span>
                </a>
              )}
              {providerEmail && (
                <a
                  href={`mailto:${providerEmail}`}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? 'text-gray-200 hover:text-[#E5252A]' : 'text-gray-700 hover:text-[#E5252A]'}`}
                >
                  <FaEnvelope className="w-3.5 h-3.5 text-[#E5252A]" />
                  <span className="truncate">{providerEmail}</span>
                </a>
              )}
              {providerWhatsapp && (
                <a
                  href={`https://wa.me/${providerWhatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? 'text-gray-200 hover:text-green-400' : 'text-gray-700 hover:text-green-600'}`}
                >
                  <FaWhatsapp className="w-3.5 h-3.5 text-green-500" />
                  <span>{providerWhatsapp}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Image Grid */}
        <div className="w-full md:w-2/3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-4">
          {allImages.slice(0, 2).map((img, index) => (
            <div
              key={index}
              className={`relative group cursor-pointer ${type === "product" && isOutOfStock ? "opacity-60" : ""}`}
              onClick={() => {
                setCurrentImageIndex(index);
                setShowFullImage(true);
              }}
            >
              {index === 0 && type === "product" && isOutOfStock && (
                <div className="absolute top-4 left-4 bg-[#E5252A] text-white font-extrabold text-xs px-3.5 py-1.5 z-10 uppercase tracking-wider rounded-full shadow-md">
                  OUT OF STOCK
                </div>
              )}
              {isVideo(img) ? (
                <div className="relative w-full h-full max-h-80">
                  <video
                    src={toAbsoluteMediaUrl(img)}
                    className="object-cover w-full h-full max-h-80"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-black bg-opacity-70 rounded-full p-3">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 5v10l8-5-8-5z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={toAbsoluteMediaUrl(img)}
                  alt={`${title} view ${index + 1}`}
                  className="object-cover w-full h-full max-h-80 transition duration-300"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-300 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition duration-300 font-semibold">
                  {isVideo(img) ? 'Play Video' : 'View Image'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {allImages.length > 2 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {allImages.slice(2).map((img, index) => (
              <div
                key={index + 2}
                className="relative group cursor-pointer"
                onClick={() => {
                  setCurrentImageIndex(index + 2);
                  setShowFullImage(true);
                }}
              >
                {isVideo(img) ? (
                  <div className="relative w-full h-full max-h-32">
                    <video
                      src={toAbsoluteMediaUrl(img)}
                      className="object-cover w-full h-full max-h-32"
                      preload="metadata"
                      muted
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <div className="bg-black bg-opacity-70 rounded-full p-2">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={toAbsoluteMediaUrl(img)}
                    alt={`${title} view ${index + 3}`}
                    className="object-cover w-full h-full max-h-32 transition duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition duration-300 text-sm font-semibold">
                    {isVideo(img) ? 'Play' : 'View'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className={`w-full md:w-1/3 flex flex-col font-sans p-6 rounded-2xl border shadow-xs ${darkMode ? "bg-gray-900 border-gray-800 text-gray-100" : "bg-white border-[#E5E5E5] text-[#151515]"}`}>
        <h2 className={`text-2xl font-bold tracking-tight mb-4 ${darkMode ? "text-white" : "text-[#151515]"}`}>{title}</h2>

        {description && (
          <div className="mb-5">
            <div 
              className={`text-sm whitespace-pre-line leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              style={!isDescExpanded ? {
                display: '-webkit-box',
                WebkitLineClamp: 15,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              } : {}}
            >
              {description}
            </div>
            {hasLongDescription && (
              <button
                type="button"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="mt-2 text-xs font-bold uppercase tracking-wider text-[#E5252A] hover:text-[#c91d22] focus:outline-none transition-colors"
              >
                {isDescExpanded ? "View Less" : "View More"}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-2">
          <p className={`text-xl font-extrabold ${darkMode ? "text-white" : "text-[#151515]"}`}>
            {formatFrw(price)}
            <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-1.5`}>
              / {pricingUnit || pricing_unit || 'Per Item / Piece'}
            </span>
          </p>
          {used && (
            <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              USED
            </span>
          )}
          {type === "product" && isOutOfStock && (
            <span className="text-xs bg-red-500/10 text-[#E5252A] border border-red-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              OUT OF STOCK
            </span>
          )}
        </div>

        <p className={`text-sm font-semibold mb-5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Total: <span className="text-[#E5252A]">{formatFrw(price * quantity)}</span>
        </p>

        {/* Quantity selector */}
        {!(type === "product" && isOutOfStock) && (
          <div className={`flex items-center overflow-hidden max-w-[180px] mb-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-[#E5E5E5] bg-[#F5F5F5]"}`}>
            <button
              onClick={handleDecrease}
              className={`flex-1 py-2 text-lg font-bold ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"} transition`}
              type="button"
            >
              &minus;
            </button>
            <div className={`flex-1 text-center text-sm font-bold py-2 ${darkMode ? "text-white" : "text-[#151515]"}`}>{quantity}</div>
            <button
              onClick={handleIncrease}
              className={`flex-1 py-2 text-lg font-bold ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"} transition`}
              type="button"
            >
              +
            </button>
          </div>
        )}

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${darkMode ? "bg-green-950/40 border border-green-900 text-green-300" : "bg-green-50 border border-green-200 text-green-700"}`}>
            {message}
          </div>
        )}

        {/* Service Customization Form */}
        {type === "service" && (
          <div className={`mb-5 p-4 rounded-xl border ${darkMode ? "border-gray-800 bg-gray-800/40" : "border-[#E5E5E5] bg-[#F5F5F5]/60"}`}>
            {/* Info Tag */}
            <div className={`mb-3 p-3 rounded-lg text-xs leading-relaxed font-medium ${darkMode ? "bg-gray-800 text-gray-300 border border-gray-700" : "bg-white text-gray-700 border border-[#E5E5E5]"}`}>
              The service provider will review and adjust the price based on your customization needs.
            </div>

            {/* Customization Text Area */}
            <div className="mb-4">
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Specify Requirements <span className="text-[#E5252A]">*</span>
              </label>
              <textarea
                value={customizationRequest}
                onChange={(e) => {
                  setCustomizationRequest(e.target.value);
                  setCustomizationError("");
                }}
                placeholder="Describe your specific requirements, preferences, or customizations..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 ${
                  darkMode
                    ? "border-gray-700 bg-gray-900 text-white focus:ring-[#E5252A]/20 focus:border-[#E5252A]"
                    : "border-[#E5E5E5] bg-white text-[#151515] focus:ring-[#E5252A]/20 focus:border-[#E5252A]"
                }`}
                rows={4}
              />
            </div>

            {/* No Customization Option */}
            <div className="mb-2 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="noCustomization"
                checked={noCustomizationNeeded}
                onChange={(e) => {
                  setNoCustomizationNeeded(e.target.checked);
                  if (e.target.checked) {
                    setCustomizationRequest("");
                  }
                  setCustomizationError("");
                }}
                className="h-4 w-4 rounded accent-[#E5252A]"
              />
              <label htmlFor="noCustomization" className={`text-xs font-medium cursor-pointer ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                No customization needed
              </label>
            </div>

            {/* Error Message */}
            {customizationError && (
              <div className="p-2.5 rounded-lg text-xs font-semibold bg-red-500/10 text-[#E5252A] border border-red-500/20">
                {customizationError}
              </div>
            )}
          </div>
        )}

        {/* Add to cart / Contact seller info if out of stock */}
        {type === "product" && isOutOfStock ? (
          <div className={`mt-2 p-5 border-2 border-dashed rounded-xl transition-all ${
            darkMode 
              ? "bg-red-950/20 border-red-900/60 text-gray-200" 
              : "bg-red-50/50 border-red-200 text-gray-800"
          }`}>
            <h3 className="text-sm font-bold text-[#E5252A] mb-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E5252A] animate-pulse"></span>
              Temporarily Out of Stock
            </h3>
            <p className={`text-xs mb-4 leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              This product is currently out of stock. Contact the service provider or seller to get details on when it will be available.
            </p>
            
            <div className="flex flex-col gap-2.5">
              {providerPhone && (
                <a
                  href={`tel:${providerPhone}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs bg-[#E5252A] text-white hover:bg-[#c91d22]"
                >
                  <FaPhone className="w-3.5 h-3.5" />
                  Call Seller: {providerPhone}
                </a>
              )}
              {providerWhatsapp && (
                <a
                  href={`https://wa.me/${providerWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello! I'm interested in "${title}" which is out of stock. When will it be available in stock?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all shadow-xs bg-green-600 hover:bg-green-500"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  WhatsApp: {providerWhatsapp}
                </a>
              )}
              {!providerPhone && !providerWhatsapp && providerEmail && (
                <a
                  href={`mailto:${providerEmail}?subject=${encodeURIComponent(`Inquiry about ${title}`)}&body=${encodeURIComponent(`Hello, I would like to know when the product "${title}" will be back in stock.`)}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all shadow-xs bg-[#0A0A0A] hover:bg-black border border-gray-700"
                >
                  <FaEnvelope className="w-3.5 h-3.5" />
                  Email Seller: {providerEmail}
                </a>
              )}
              {!providerPhone && !providerWhatsapp && !providerEmail && (
                <p className="text-xs text-gray-500 italic">No contact information is available for this seller.</p>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all bg-[#E5252A] text-white hover:bg-[#c91d22]"
          >
            {type === "service" ? "Add service to cart" : "Add to cart"}
          </button>
        )}
      </div>

      </div>

      {/* Related Products & Services */}
      {relatedItems && relatedItems.length > 0 && (
        <div className="mt-16 border-t pt-10 border-[#E5E5E5] dark:border-gray-800">
          <h3 className={`text-lg font-bold uppercase tracking-wider mb-6 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
            Other products and services from this provider
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedItems.slice(0, 4).map((item) => (
              <div
                key={item.productId}
                onClick={() => {
                  let targetPath = `/product-or-service-detail/${providerId}/${item.productId}`;
                  if (location.pathname.startsWith('/made-in-rwanda/product/')) {
                    targetPath = `/made-in-rwanda/product/${item.productId}`;
                  } else if (location.pathname.startsWith('/product/')) {
                    targetPath = `/product/${item.productId}`;
                  }
                  navigate(targetPath);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`group cursor-pointer rounded-2xl border p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                  darkMode ? 'bg-gray-900 border-gray-800 hover:border-[#E5252A]/40' : 'bg-white border-[#E5E5E5] hover:border-[#E5252A]/40'
                }`}
              >
                <div>
                  <div className="aspect-square w-full mb-3 overflow-hidden rounded-xl bg-[#F5F5F5] dark:bg-gray-950 flex items-center justify-center">
                    <img
                      src={toAbsoluteMediaUrl(item.url)}
                      alt={item.title || 'Related item'}
                      className="object-contain w-full h-full max-h-36 transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.png';
                      }}
                    />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#E5252A]">
                    {item.type}
                  </div>
                  <h5 className={`font-bold text-sm mb-1 group-hover:text-[#E5252A] transition-colors line-clamp-1 ${
                    darkMode ? 'text-white' : 'text-[#151515]'
                  }`}>
                    {item.title || 'Untitled'}
                  </h5>
                  {(item.description || item.desc) && (
                    <p className={`text-xs line-clamp-2 leading-relaxed mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {item.description || item.desc}
                    </p>
                  )}
                </div>
                <div>
                  <div className={`text-sm font-extrabold mt-2 ${darkMode ? 'text-gray-200' : 'text-[#151515]'}`}>
                    {item.price ? formatFrw(item.price) : 'Contact for price'}
                  </div>
                  <span className="mt-3 inline-flex text-xs font-bold items-center gap-1 transition-colors text-[#E5252A] group-hover:text-[#c91d22]">
                    View Details &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Image Modal */}
      {showFullImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
          >
            &times;
          </button>

          <button
            onClick={() => navigateImages('prev')}
            className="absolute left-4 text-white text-4xl hover:text-gray-300 z-10"
          >
            &lt;
          </button>

          <div className="relative max-w-full max-h-full">
            {isVideo(allImages[currentImageIndex]) ? (
              <video
                src={toAbsoluteMediaUrl(allImages[currentImageIndex])}
                controls
                autoPlay={false}
                className="max-w-full max-h-[90vh] object-contain"
              />
            ) : (
              <img
                src={toAbsoluteMediaUrl(allImages[currentImageIndex])}
                alt={`${title} full view`}
                className="max-w-full max-h-[90vh] object-contain"
              />
            )}
            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          </div>

          <button
            onClick={() => navigateImages('next')}
            className="absolute right-4 text-white text-4xl hover:text-gray-300 z-10"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}