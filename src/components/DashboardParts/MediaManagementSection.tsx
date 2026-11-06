import { useState } from 'react';
import ImageCarouselCard from '@/pages/ImageCarouselCard';
import { ServiceFeature } from '@/types/features';
import { Loader2 } from 'lucide-react';
import { FiVideo } from 'react-icons/fi';
import FeatureFieldRenderer from './FeatureFieldRenderer';

type MediaType = 'product' | 'service';

type FileType = 'image' | 'video' | 'mixed';

const PRICING_UNITS = [
  { value: 'Per Item / Piece', label: 'Per Item / Piece (e.g., clothes, electronics, single objects)' },
  { value: 'Per Kilogram (kg)', label: 'Per Kilogram (kg) (e.g., vegetables, meat, flour)' },
  { value: 'Per Liter (L)', label: 'Per Liter (L) (e.g., drinks, oils, liquid chemicals)' },
  { value: 'Per Square Meter (m²)', label: 'Per Square Meter (m²) (e.g., flooring, carpets, land tiles)' },
  { value: 'Per Cubic Meter (m³)', label: 'Per Cubic Meter (m³) (e.g., sand, gravel, large cargo)' },
  { value: 'Per Meter (m)', label: 'Per Meter (m) (e.g., ropes, cables, fabrics)' },
  { value: 'Per Pack / Dozen', label: 'Per Pack / Dozen (e.g., box bundles, multipacks)' }
];

export interface UploadedMedia {
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
  inStock?: boolean;
  mediaFiles?: UploadedMedia[];
}

type Props = {
  darkMode: boolean;
  apiBase: string;
  hideProducts?: boolean;
  uploadedProductImages: UploadedMedia[];
  uploadedServiceImages: UploadedMedia[];
  selectedProductImages: Set<string>;
  selectedServiceImages: Set<string>;
  deletingImageIds: Set<string>;
  pendingDeleteQueue: Map<string, UploadedMedia>;
  editingImage: UploadedMedia | null;
  editingTitle: string;
  editingDesc: string;
  editingPrice: number | undefined;
  editingFeatureValues: Record<string, any>;
  editingUsed: boolean;
  editingPricingUnit: string;
  setEditingUsed: (v: boolean) => void;
  setEditingPricingUnit: (v: string) => void;
  service: { id?: string; title?: string; specific_features?: boolean; features?: ServiceFeature[] } | null;
  modalOpen: boolean;
  modalImage: string | null;
  modalViews: string[];
  modalViewIndex: number;
  selectedModalItem: UploadedMedia | null;
  isBulkDeleting: MediaType | null;
  isBulkHiding: MediaType | null;
  toggleSelectProduct: (id: string) => void;
  toggleSelectService: (id: string) => void;
  deleteSelected: (type: MediaType) => void;
  hideSelected: (type: MediaType) => void;
  deleteImage: (img: UploadedMedia) => void;
  undoDelete: (id: string) => void;
  startEditing: (img: UploadedMedia) => void;
  saveEdit: () => void;
  onCloseEdit: () => void;
  openModal: (img: UploadedMedia, startAtVideo?: boolean) => void;
  closeModal: () => void;
  nextModalView: () => void;
  prevModalView: () => void;
  setEditingTitle: (v: string) => void;
  setEditingDesc: (v: string) => void;
  setEditingPrice: (v: number | undefined) => void;
  setEditingFeatureValues: (v: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  onRefreshMedia?: () => void;
};

export default function MediaManagementSection({
  darkMode,
  apiBase,
  hideProducts = false,
  uploadedProductImages,
  uploadedServiceImages,
  selectedProductImages,
  selectedServiceImages,
  deletingImageIds,
  pendingDeleteQueue,
  editingImage,
  editingTitle,
  editingDesc,
  editingPrice,
  editingFeatureValues,
  editingUsed,
  editingPricingUnit,
  setEditingUsed,
  setEditingPricingUnit,
  service,
  modalOpen,
  modalImage,
  modalViews,
  modalViewIndex,
  selectedModalItem,
  isBulkDeleting,
  isBulkHiding,
  toggleSelectProduct,
  toggleSelectService,
  deleteSelected,
  hideSelected,
  deleteImage,
  undoDelete,
  startEditing,
  saveEdit,
  onCloseEdit,
  openModal,
  closeModal,
  nextModalView,
  prevModalView,
  setEditingTitle,
  setEditingDesc,
  setEditingPrice,
  setEditingFeatureValues,
  onRefreshMedia,
}: Props) {
  const [confirmStockProductId, setConfirmStockProductId] = useState<string | null>(null);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const resolveUrl = (url: string) => {
    if (!url) return url;
    return /^https?:\/\//i.test(url) ? url : `${apiBase}${url}`;
  };

  const bulkDeletingProducts = isBulkDeleting === 'product';
  const bulkDeletingServices = isBulkDeleting === 'service';
  const bulkHidingProducts = isBulkHiding === 'product';
  const bulkHidingServices = isBulkHiding === 'service';

  return (
    <>
      {/* Uploaded Images Cards */}
      <div className={`${hideProducts ? 'grid grid-cols-1' : 'grid grid-cols-1 md:grid-cols-2'} gap-6 md:gap-8 px-0 sm:px-2 mx-0 sm:mx-5 mt-8 sm:mt-12 min-w-0`}>
        {/* Products Section */}
        {!hideProducts && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Product Images
              </h2>
              {selectedProductImages.size > 0 && (
                <div className="space-x-2">
                  <button
                    className="px-3 py-1.5 font-semibold text-xs uppercase tracking-wider bg-brand-red hover:bg-red-700 text-white transition-colors rounded-lg"
                    onClick={() => deleteSelected('product')}
                    disabled={bulkDeletingProducts || bulkHidingProducts}
                  >
                    {bulkDeletingProducts ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                      </span>
                    ) : (
                      'Delete Selected'
                    )}
                  </button>
                  <button
                    className={`px-3 py-1.5 font-semibold text-xs uppercase tracking-wider rounded-lg border transition-colors ${darkMode
                      ? 'bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    onClick={() => hideSelected('product')}
                    disabled={bulkDeletingProducts || bulkHidingProducts}
                  >
                    {bulkHidingProducts ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Hiding...
                      </span>
                    ) : (
                      'Hide from Customers'
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {uploadedProductImages.map((item, idx) => {
                const isDeleting = deletingImageIds.has(item.id);
                const isPendingUndo = pendingDeleteQueue.has(item.id);

                const handleUndo = () => {
                  undoDelete(item.id);
                };

                return (
                  <div
                    key={idx}
                    className={`flex flex-col rounded-xl border shadow-sm transition-all duration-300 relative overflow-hidden ${darkMode
                      ? 'bg-zinc-900 border-zinc-800'
                      : 'bg-white border-gray-200'
                      } ${isDeleting && !isPendingUndo
                        ? 'opacity-50 pointer-events-none'
                        : 'opacity-100 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-md'
                      }`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-2 left-2 z-30">
                      <input
                        type="checkbox"
                        checked={selectedProductImages.has(item.id)}
                        onChange={() => toggleSelectProduct(item.id)}
                        className="h-4 w-4 text-brand-red focus:ring-brand-red rounded"
                      />
                    </div>

                    {/* Media and modal */}
                    <button
                      onClick={() => openModal(item)}
                      className="focus:outline-none relative"
                    >
                      {/* Out of Stock Badge */}
                      {item.inStock === false && (
                        <div 
                          className="absolute top-2 left-10 z-35 bg-brand-red text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-md"
                        >
                          Out of Stock
                        </div>
                      )}

                      {/* Made in Rwanda Badge */}
                      {item.madeInRwanda && (
                        <div 
                          className={`absolute z-20 bg-zinc-900/90 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-sm border border-white/10 ${item.inStock === false ? 'top-10' : 'top-2'} left-10`}
                        >
                          🇷🇼 Made in Rwanda
                        </div>
                      )}

                      {/* Video Badge */}
                      {(item.fileType === 'video' || item.fileType === 'mixed') && (
                        <div 
                          className="absolute top-2 right-2 z-20 bg-black/70 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-sm border border-white/10"
                        >
                          <FiVideo size={12} /> Video
                        </div>
                      )}

                      <div
                        className={`w-full aspect-[4/3] flex items-center justify-center rounded-t-xl overflow-hidden ${darkMode ? 'bg-zinc-950/50' : 'bg-[#F5F5F5]'
                          }`}
                      >
                        {item.fileType === 'mixed' && item.mediaFiles ? (
                          <div className="relative w-full h-full group cursor-pointer">
                            <ImageCarouselCard
                              images={item.mediaFiles.filter((media: any) => media.type === 'image').map((media: any) => media.url)}
                              alt={item.title}
                              API_BASE={apiBase}
                              className="w-full aspect-[4/3] flex items-center justify-center rounded-t-xl"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/60 transition-all duration-200 pointer-events-none" />
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none">
                              {item.mediaFiles.filter((m: any) => m.type === 'image').length} images,{' '}
                              {item.mediaFiles.filter((m: any) => m.type === 'video').length} videos
                            </div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 p-2 rounded-full group-hover:scale-110 transition-transform duration-200 pointer-events-none">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8 5v10l8-5-8-5z" />
                              </svg>
                            </div>
                          </div>
                        ) : item.fileType === 'video' ? (
                          (() => {
                            // Filter image views (exclude videos)
                            const imageViews = (item.views || []).filter((url: string) =>
                              !url.includes('.mp4') && !url.includes('.mov') && !url.includes('.avi') && !url.includes('.webm')
                            );

                            // If we have image views, show them; otherwise show video thumbnail
                            return imageViews.length > 0 ? (
                              <ImageCarouselCard
                                images={imageViews}
                                alt={item.title}
                                API_BASE={apiBase}
                                className="w-full aspect-[4/3] flex items-center justify-center rounded-t-xl"
                              />
                            ) : (
                              <div className="relative w-full h-full group cursor-pointer">
                                <video
                                  className="w-full h-full object-cover pointer-events-none rounded-t-xl"
                                  src={resolveUrl(item.url)}
                                  preload="metadata"
                                  muted
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/70 p-3 rounded-full group-hover:scale-110 transition-transform duration-200">
                                    <svg
                                      className="w-8 h-8 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M8 5v10l8-5-8-5z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none">
                                  Click to play
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <ImageCarouselCard
                            images={[item.url, ...(item.views ?? [])]}
                            alt={item.title}
                            API_BASE={apiBase}
                            className="w-full aspect-[4/3] flex items-center justify-center rounded-t-xl"
                          />
                        )}
                      </div>
                    </button>

                    {/* Info */}
                    <div className={`font-bold text-sm tracking-tight text-center mt-3 mb-1 px-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </div>
                    <div className={`text-center text-xs mb-1 px-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.desc}
                    </div>
                    <div className="font-bold text-sm text-center text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2 flex-wrap">
                      <span>
                        Price: {item.price ? `${item.price.toLocaleString()} RWF` : 'Free'}
                        <span className={`text-[11px] font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-1`}>
                          / {item.pricingUnit || 'Per Item / Piece'}
                        </span>
                      </span>
                      {item.used && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          USED
                        </span>
                      )}
                    </div>

                    {/* View Video Button */}
                    {(item.fileType === 'video' || item.fileType === 'mixed') && (
                      <div className="px-4 mb-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(item, true); // Start at video
                          }}
                          className="w-full py-2 bg-brand-red hover:bg-red-700 text-white flex items-center justify-center gap-2 font-semibold text-xs transition-colors uppercase tracking-wider rounded-lg"
                        >
                          <FiVideo size={14} /> View Video
                        </button>
                      </div>
                    )}

                    {/* Undo & Spinner */}
                    {isPendingUndo ? (
                      <div
                        className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-auto ${darkMode ? 'bg-zinc-900/80' : 'bg-white/80'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4 text-brand-red" />
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
                            Deleting...
                          </span>
                        </div>
                        <button
                          onClick={handleUndo}
                          className="px-3 py-1 font-semibold text-xs transition-colors uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
                        >
                          Undo
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Stock Toggle Confirm Overlay */}
                        <div className="px-4 mb-2 mt-1">
                          {confirmStockProductId === item.id ? (
                            <div className={`p-2.5 border rounded-lg ${darkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-gray-200 bg-[#F5F5F5] text-gray-900'} text-center space-y-2`}>
                              <p className="text-[10px] font-bold uppercase tracking-wider">
                                Mark as {item.inStock !== false ? 'Out of Stock' : 'In Stock'}?
                              </p>
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setIsUpdatingStock(true);
                                    try {
                                      const token = localStorage.getItem("token");
                                      const res = await fetch(`${apiBase}/api/media/${item.id}`, {
                                        method: "PUT",
                                        headers: { 
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}` 
                                        },
                                        body: JSON.stringify({
                                          inStock: !(item.inStock !== false)
                                        })
                                      });
                                      if (!res.ok) throw new Error("Failed to update stock status");
                                      onRefreshMedia?.();
                                    } catch (e: any) {
                                      alert(e.message);
                                    } finally {
                                      setIsUpdatingStock(false);
                                      setConfirmStockProductId(null);
                                    }
                                  }}
                                  disabled={isUpdatingStock}
                                  className="px-3 py-1 bg-brand-red hover:bg-red-700 text-white text-[11px] font-semibold uppercase tracking-wider rounded-md"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmStockProductId(null); }}
                                  disabled={isUpdatingStock}
                                  className={`px-3 py-1 border text-[11px] font-semibold uppercase tracking-wider rounded-md ${darkMode ? 'bg-zinc-800 border-zinc-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmStockProductId(item.id); }}
                              className={`w-full py-1.5 flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-wider transition-colors border rounded-lg
                                ${item.inStock !== false ? 'bg-red-50 text-brand-red hover:bg-red-100 border-red-200 dark:bg-red-950/30 dark:border-red-900/40' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'}`}
                            >
                              {item.inStock !== false ? 'Mark Out of Stock' : 'Mark In Stock'}
                            </button>
                          )}
                        </div>

                        {/* Edit/Delete */}
                        <div className="flex justify-center gap-2 mb-3 mt-1 px-4">
                          <button
                            className={`flex-1 py-1.5 font-semibold text-xs border uppercase tracking-wider rounded-lg transition-colors ${darkMode
                              ? 'bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            onClick={() => startEditing(item)}
                            disabled={isDeleting}
                          >
                            Edit
                          </button>
                          <button
                            className="flex-1 py-1.5 font-semibold text-xs uppercase tracking-wider bg-brand-red hover:bg-red-700 text-white rounded-lg transition-colors"
                            onClick={() => deleteImage(item)}
                            disabled={isDeleting}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                    {!item.visible && (
                      <div className="text-[10px] font-bold uppercase text-center tracking-wider mb-2 text-brand-red">
                        Hidden from customers
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Services Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-base font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Service Images
            </h2>
            {selectedServiceImages.size > 0 && (
              <div className="space-x-2">
                <button
                  className="px-3 py-1.5 font-semibold text-xs uppercase tracking-wider bg-brand-red hover:bg-red-700 text-white transition-colors rounded-lg"
                  onClick={() => deleteSelected('service')}
                  disabled={bulkDeletingServices || bulkHidingServices}
                >
                  {bulkDeletingServices ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </span>
                  ) : (
                    'Delete Selected'
                  )}
                </button>
                <button
                  className={`px-3 py-1.5 font-semibold text-xs uppercase tracking-wider rounded-lg border transition-colors ${darkMode
                    ? 'bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  onClick={() => hideSelected('service')}
                  disabled={bulkDeletingServices || bulkHidingServices}
                >
                  {bulkHidingServices ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Hiding...
                    </span>
                  ) : (
                    'Hide from Customers'
                  )}
                </button>
              </div>
            )}
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${hideProducts ? 'md:grid-cols-3 lg:grid-cols-4' : ''} gap-4`}>
            {uploadedServiceImages.map((item, idx) => {
              const isDeleting = deletingImageIds.has(item.id);
              const isPendingUndo = pendingDeleteQueue.has(item.id);

              const handleUndo = () => {
                undoDelete(item.id);
              };

              return (
                <div
                  key={idx}
                  className={`flex flex-col rounded-xl border shadow-sm transition-all duration-300 relative overflow-hidden ${darkMode
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-white border-gray-200'
                    } ${isDeleting && !isPendingUndo
                      ? 'opacity-50 pointer-events-none'
                      : 'opacity-100 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-md'
                    }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-30">
                    <input
                      type="checkbox"
                      checked={selectedServiceImages.has(item.id)}
                      onChange={() => toggleSelectService(item.id)}
                      className="h-4 w-4 text-brand-red focus:ring-brand-red rounded"
                    />
                  </div>

                  {/* Media and modal */}
                  <button
                    onClick={() => openModal(item)}
                    className="focus:outline-none relative"
                  >
                    {/* Video Badge */}
                    {item.fileType === 'video' && (
                      <div 
                        className="absolute top-2 right-2 z-20 bg-black/70 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-sm border border-white/10"
                      >
                        <FiVideo size={12} /> Video
                      </div>
                    )}

                    <div
                      className={`w-full aspect-[4/3] flex items-center justify-center relative rounded-t-xl overflow-hidden ${darkMode ? 'bg-zinc-950/50' : 'bg-[#F5F5F5]'
                        }`}
                    >
                      {item.fileType === 'video' ? (
                        (() => {
                          // Filter image views (exclude videos)
                          const imageViews = (item.views || []).filter((url: string) =>
                            !url.includes('.mp4') && !url.includes('.mov') && !url.includes('.avi') && !url.includes('.webm')
                          );

                          // If we have image views, show them; otherwise show video thumbnail
                          return imageViews.length > 0 ? (
                            <ImageCarouselCard
                              images={imageViews}
                              alt={item.title}
                              API_BASE={apiBase}
                              className="w-full aspect-[4/3] flex items-center justify-center rounded-t-xl"
                            />
                          ) : (
                            <div className="relative w-full h-full group cursor-pointer">
                              <video
                                src={resolveUrl(item.url)}
                                className="w-full h-full object-cover pointer-events-none rounded-t-xl"
                                preload="metadata"
                                muted
                              />
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/70 p-3 rounded-full group-hover:scale-110 transition-transform duration-200">
                                  <svg
                                    className="w-8 h-8 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M8 5v10l8-5-8-5z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none">
                                Click to play
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <ImageCarouselCard
                          images={[item.url, ...(item.views ?? [])]}
                          alt={item.title}
                          API_BASE={apiBase}
                          className="w-full aspect-[4/3] flex items-center justify-center rounded-t-xl"
                        />
                      )}
                    </div>
                  </button>

                  {/* Info */}
                  <div className={`font-bold text-sm tracking-tight text-center mt-3 mb-1 px-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </div>
                  <div className={`text-center text-xs mb-1 px-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.desc}
                  </div>
                  <div className="font-bold text-sm text-center text-gray-900 dark:text-white mb-2">
                    Price: {item.price ? `${item.price.toLocaleString()} RWF` : 'Free'}
                  </div>

                  {/* View Video Button */}
                  {item.fileType === 'video' && (
                    <div className="px-4 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(item, true); // Start at video
                        }}
                        className="w-full py-2 bg-brand-red hover:bg-red-700 text-white flex items-center justify-center gap-2 font-semibold text-xs transition-colors uppercase tracking-wider rounded-lg"
                      >
                        <FiVideo size={14} /> View Video
                      </button>
                    </div>
                  )}

                  {/* Undo & Spinner */}
                  {isPendingUndo && (
                    <div
                      className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-auto ${darkMode ? 'bg-zinc-900/80' : 'bg-white/80'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4 text-brand-red" />
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
                          Deleting...
                        </span>
                      </div>
                      <button
                        onClick={handleUndo}
                        className="px-3 py-1 font-semibold text-xs transition-colors uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
                      >
                        Undo
                      </button>
                    </div>
                  )}

                  {/* Edit/Delete */}
                  <div className="flex justify-center gap-2 mb-3 mt-1 px-4">
                    <button
                      className={`flex-1 py-1.5 font-semibold text-xs border uppercase tracking-wider rounded-lg transition-colors ${darkMode
                        ? 'bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      onClick={() => startEditing(item)}
                      disabled={isDeleting}
                    >
                      Edit
                    </button>
                    <button
                      className="flex-1 py-1.5 font-semibold text-xs uppercase tracking-wider bg-brand-red hover:bg-red-700 text-white rounded-lg transition-colors"
                      onClick={() => deleteImage(item)}
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  </div>

                  {!item.visible && (
                    <div className="text-[10px] font-bold uppercase text-center tracking-wider mb-2 text-brand-red">
                      Hidden from customers
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`shadow-xl p-6 sm:p-8 relative w-full max-w-md max-h-[90vh] overflow-y-auto border rounded-xl ${darkMode
              ? 'bg-zinc-900 border-zinc-800'
              : 'bg-white border-gray-200'
              }`}
          >
            <button
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              onClick={onCloseEdit}
            >
              ✕
            </button>
            <h3 className={`text-base font-bold uppercase tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Item
            </h3>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Title
            </label>
            <input
              className={`border rounded-lg p-2.5 w-full mb-3 text-sm ${darkMode
                ? 'bg-zinc-950 border-zinc-800 text-white focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                : 'bg-white border-gray-200 text-gray-900 focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                }`}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
            />
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Description
            </label>
            <textarea
              className={`border rounded-lg p-2.5 w-full mb-3 text-sm ${darkMode
                ? 'bg-zinc-950 border-zinc-800 text-white focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                : 'bg-white border-gray-200 text-gray-900 focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                }`}
              rows={4}
              value={editingDesc}
              onChange={(e) => setEditingDesc(e.target.value)}
            />
            {editingImage.type === 'product' ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Price
                    </label>
                    <input
                      className={`border rounded-lg p-2.5 w-full text-sm ${darkMode
                        ? 'bg-zinc-950 border-zinc-800 text-white focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                        : 'bg-white border-gray-200 text-gray-900 focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                        }`}
                      type="number"
                      min={0}
                      value={editingPrice ?? ''}
                      onChange={(e) =>
                        setEditingPrice(
                          e.target.value === '' ? undefined : Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Pricing Unit
                    </label>
                    <select
                      className={`border rounded-lg p-2.5 w-full text-sm ${darkMode
                        ? 'bg-zinc-950 border-zinc-800 text-white focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                        : 'bg-white border-gray-200 text-gray-900 focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                        }`}
                      value={editingPricingUnit}
                      onChange={(e) => setEditingPricingUnit(e.target.value)}
                    >
                      {PRICING_UNITS.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mb-3 mt-1">
                  <div className="flex items-center">
                    <input
                      id="edit-product-used"
                      type="checkbox"
                      checked={editingUsed}
                      onChange={(e) => setEditingUsed(e.target.checked)}
                      className="mr-2 text-brand-red focus:ring-brand-red rounded"
                    />
                    <label
                      htmlFor="edit-product-used"
                      className={`text-xs font-bold uppercase tracking-wider cursor-pointer select-none ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Used / Second Hand
                    </label>
                  </div>
                  <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} pl-6 leading-tight`}>
                    This product has been used before (second-hand item).
                  </p>
                </div>
              </>
            ) : (
              <>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Price
                </label>
                <input
                  className={`border rounded-lg p-2.5 w-full mb-3 text-sm ${darkMode
                    ? 'bg-zinc-950 border-zinc-800 text-white focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                    : 'bg-white border-gray-200 text-gray-900 focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none'
                    }`}
                  type="number"
                  min={0}
                  value={editingPrice ?? ''}
                  onChange={(e) =>
                    setEditingPrice(
                      e.target.value === '' ? undefined : Number(e.target.value),
                    )
                  }
                />
              </>
            )}

            {/* Feature Fields for Services */}
            {editingImage.type === 'service' && service?.specific_features && service?.features && (
              <div className="mt-4 space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Service Features
                </h4>
                {service.features
                  .map((feature) => (
                    <FeatureFieldRenderer
                      key={feature.name}
                      feature={feature}
                      values={editingFeatureValues}
                      onChange={(featureName, value) => {
                        setEditingFeatureValues(prev => ({ ...prev, [featureName]: value }));
                      }}
                      darkMode={darkMode}
                    />
                  ))}
              </div>
            )}

            <button
              className="w-full py-2.5 bg-brand-red hover:bg-red-700 text-white font-semibold text-xs transition-all uppercase tracking-wider rounded-lg mt-4 shadow-sm"
              onClick={saveEdit}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Media Preview Modal with video support */}
      {modalOpen && modalImage && selectedModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={closeModal}
          >
            <div
              className="relative max-w-[95vw] max-h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full border border-white/20 transition shadow-lg"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {modalViews.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full border border-white/20 transition shadow-lg"
                    aria-label="Previous"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevModalView();
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full border border-white/20 transition shadow-lg"
                    aria-label="Next"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextModalView();
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}

              <div className="bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                {(() => {
                  const currentUrl = modalViews[modalViewIndex] || '';
                  const lowerUrl = currentUrl.toLowerCase();
                  const isVideo = selectedModalItem.fileType === 'video' ||
                    lowerUrl.includes('.mp4') ||
                    lowerUrl.includes('.mov') ||
                    lowerUrl.includes('.avi') ||
                    lowerUrl.includes('.webm');

                  return isVideo ? (
                    <div className="relative">
                      <video
                        className="max-w-[90vw] max-h-[80vh] w-auto h-auto rounded-xl"
                        src={resolveUrl(currentUrl)}
                        controls
                        autoPlay={false}
                        preload="metadata"
                        style={{
                          maxWidth: '90vw',
                          maxHeight: '80vh',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  ) : (
                    <img
                      src={resolveUrl(currentUrl)}
                      alt={selectedModalItem.title}
                      className="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain rounded-xl"
                    />
                  );
                })()}
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 border border-white/10 rounded-full backdrop-blur-sm shadow-lg">
                <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider">
                  <span>
                    {selectedModalItem.title}
                  </span>
                  <span className="text-gray-400">
                    View {modalViewIndex + 1} of {modalViews.length}
                  </span>
                  {selectedModalItem.fileType === 'mixed' && (
                    <span className="bg-brand-red px-2 py-0.5 rounded text-[10px] font-bold text-white">
                      MIXED MEDIA
                    </span>
                  )}
                  {selectedModalItem.fileType === 'video' && (
                    <span className="bg-brand-red px-2 py-0.5 rounded text-[10px] font-bold text-white">
                      VIDEO
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
