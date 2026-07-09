import { useDarkMode } from "@/context/DarkMode";
import { FaEnvelope, FaPhone, FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
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
    serviceCustomization?: {
      needsCustomization: boolean;
      customizationRequest?: string;
      noCustomizationNeeded?: boolean;
    };
  }) => void;

  type: string;
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
  type,
  providerId,
  providerName,
  providerEmail,
  providerPhone,
  providerWhatsapp,
  providerProfileImage,
}: ProductOrServiceDetailProps) {
  const [quantity, setQuantity] = useState(minQuantity);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [customizationRequest, setCustomizationRequest] = useState("");
  const [noCustomizationNeeded, setNoCustomizationNeeded] = useState(false);
  const [customizationError, setCustomizationError] = useState("");
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

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
    <div className={`w-full px-4 py-10 mx-auto ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {(providerId || providerName || providerEmail || providerPhone || providerWhatsapp) && (
        <div className={`mb-6 p-4 border ${darkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`} style={{ borderRadius: '2px' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={providerProfileImage || '/default-profile.png'}
                alt={providerName || providerEmail || 'Provider profile'}
                className="w-14 h-14 object-cover flex-shrink-0"
                style={{ borderRadius: '2px' }}
              />
              <div className="min-w-0 flex-1">
                <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Service provider
                </div>
                <h3 className={`text-base font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {providerName || providerEmail?.split('@')[0] || 'Provider'}
                </h3>
                <button
                  type="button"
                  onClick={() => providerId && navigate(`/provider/${providerId}/uploads`)}
                  className={`mt-2 inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold transition-colors md:w-auto w-full
                      ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                  style={{ borderRadius: '2px' }}
                >
                  View more products and services by {providerName || 'this provider'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-shrink-0">
              {providerPhone && (
                <a
                  href={`tel:${providerPhone}`}
                  className={`flex items-center gap-2 text-sm transition-colors ${darkMode ? 'text-gray-200 hover:text-emerald-400' : 'text-gray-700 hover:text-emerald-600'}`}
                >
                  <FaPhone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{providerPhone}</span>
                </a>
              )}
              {providerEmail && (
                <a
                  href={`mailto:${providerEmail}`}
                  className={`flex items-center gap-2 text-sm transition-colors ${darkMode ? 'text-gray-200 hover:text-emerald-400' : 'text-gray-700 hover:text-emerald-600'}`}
                >
                  <FaEnvelope className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="truncate">{providerEmail}</span>
                </a>
              )}
              {providerWhatsapp && (
                <a
                  href={`https://wa.me/${providerWhatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm transition-colors ${darkMode ? 'text-gray-200 hover:text-emerald-400' : 'text-gray-700 hover:text-emerald-600'}`}
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
              className="relative group cursor-pointer"
              onClick={() => {
                setCurrentImageIndex(index);
                setShowFullImage(true);
              }}
            >
              {isVideo(img) ? (
                <div className="relative w-full h-full max-h-80">
                  <video
                    src={img.startsWith("http") ? img : `${API_BASE}${img}`}
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
                  src={img.startsWith("http") ? img : `${API_BASE}${img}`}
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
                      src={img.startsWith("http") ? img : `${API_BASE}${img}`}
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
                    src={img.startsWith("http") ? img : `${API_BASE}${img}`}
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
      <div className={`w-full md:w-1/3 flex flex-col font-sans p-4 shadow-lg  ${darkMode ? "bg-gray-800 border border-gray-700 text-gray-100" : "bg-white border border-gray-200 text-gray-900"}`}>
        <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h2>

        {description && (
          <div className={`mb-4 text-base whitespace-pre-line leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{description}</div>
        )}

        <p className={`text-lg font-medium mb-1 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
          Price: {formatFrw(price)}
        </p>

        <p className={`text-base font-medium mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
          Total: {formatFrw(price * quantity)}
        </p>

        <div className={`mb-4 text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Read more at the bottom of the page
        </div>

        {/* Quantity selector */}
        <div className={`flex items-center overflow-hidden max-w-[200px] mb-5 ${darkMode ? "border border-gray-700" : "border border-gray-200"}`}>
          <button
            onClick={handleDecrease}
            className={`flex-1 py-2 text-xl font-bold ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition`}
            type="button"
          >
            &minus;
          </button>
          <div className={`flex-1 text-center text-base font-medium py-2 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{quantity}</div>
          <button
            onClick={handleIncrease}
            className={`flex-1 py-2 text-xl font-bold ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition`}
            type="button"
          >
            +
          </button>
        </div>

        {message && (
          <div className={`${darkMode ? "mb-4 p-2 bg-green-900 text-green-200 rounded text-sm" : "mb-4 p-2 bg-green-100 text-green-700 rounded text-sm"}`}>
            {message}
          </div>
        )}

        {/* Service Customization Form */}
        {type === "service" && (
          <div className={`mb-4 p-4 rounded-lg border ${darkMode ? "border-blue-600 bg-blue-900/20" : "border-blue-300 bg-blue-50"}`}>
            {/* Info Tag */}
            <div className={`mb-4 p-3 rounded text-sm font-medium ${darkMode ? "bg-blue-800 text-blue-100" : "bg-blue-100 text-blue-800"}`}>
              ℹ️ The service provider will review and adjust the price based on your customization needs
            </div>

            {/* Customization Text Area */}
            <div className="mb-4">
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-100" : "text-gray-700"}`}>
                Please specify your needs and customize them <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customizationRequest}
                onChange={(e) => {
                  setCustomizationRequest(e.target.value);
                  setCustomizationError("");
                }}
                placeholder="Describe your specific requirements, preferences, or customizations..."
                className={`w-full px-3 py-2 rounded border text-sm resize-none focus:outline-none focus:ring-2 ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-white focus:ring-hafi-teal"
                    : "border-gray-300 bg-white text-gray-900 focus:ring-hafi-teal"
                }`}
                rows={4}
              />
            </div>

            {/* No Customization Option */}
            <div className="mb-3 flex items-center gap-3">
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
                className={`h-4 w-4 rounded ${darkMode ? "accent-hafi-teal-light" : "accent-hafi-teal"}`}
              />
              <label htmlFor="noCustomization" className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                No customization needed
              </label>
            </div>

            {/* Error Message */}
            {customizationError && (
              <div className={`p-2 rounded text-sm font-medium ${darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-700"}`}>
                {customizationError}
              </div>
            )}
          </div>
        )}

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-3 text-base font-semibold shadow transition 
             ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
        >
          {type === "service" ? "Add service to cart" : "Add to cart"}
        </button>
      </div>

      </div>

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
                src={allImages[currentImageIndex].startsWith("http")
                  ? allImages[currentImageIndex]
                  : `${API_BASE}${allImages[currentImageIndex]}`}
                controls
                autoPlay={false}
                className="max-w-full max-h-[90vh] object-contain"
              />
            ) : (
              <img
                src={allImages[currentImageIndex].startsWith("http")
                  ? allImages[currentImageIndex]
                  : `${API_BASE}${allImages[currentImageIndex]}`}
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