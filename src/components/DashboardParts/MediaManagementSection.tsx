import ImageCarouselCard from '@/pages/ImageCarouselCard';
import { ServiceFeature } from '@/types/features';
import { Loader2 } from 'lucide-react';
import { FiVideo } from 'react-icons/fi';
import FeatureFieldRenderer from './FeatureFieldRenderer';

type MediaType = 'product' | 'service';

type FileType = 'image' | 'video' | 'mixed';

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
  setEditingFeatureValues: (v: Record<string, any>) => void;
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
}: Props) {
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
      <div className={`${hideProducts ? 'grid grid-cols-1' : 'grid grid-cols-1 md:grid-cols-2'} gap-8 px-2 mx-5 mt-12`}>
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
                    className="px-3 py-1 font-semibold text-xs uppercase tracking-wider bg-red-500 hover:bg-red-650 hover:bg-red-600 text-white transition-colors"
                    style={{ borderRadius: '2px' }}
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
                    className={`px-3 py-1 font-semibold text-xs uppercase tracking-wider border transition-colors ${darkMode
                      ? 'bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700'
                      : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50'
                      }`}
                    style={{ borderRadius: '2px' }}
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
                    className={`flex flex-col border shadow-sm transition-all duration-300 relative ${darkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                      } ${isDeleting && !isPendingUndo
                        ? 'opacity-50 pointer-events-none'
                        : 'opacity-100 hover:border-emerald-500 hover:shadow-md'
                      }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-2 left-2 z-30">
                      <input
                        type="checkbox"
                        checked={selectedProductImages.has(item.id)}
                        onChange={() => toggleSelectProduct(item.id)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        style={{ borderRadius: '2px' }}
                      />
                    </div>

                    {/* Media and modal */}
                    <button
                      onClick={() => openModal(item)}
                      className="focus:outline-none relative"
                    >
                      {/* Made in Rwanda Badge */}
                      {item.madeInRwanda && (
                        <div 
                          className="absolute top-2 left-10 z-20 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-emerald-500/20"
                          style={{ borderRadius: '2px' }}
                        >
                          🇷🇼 Made in Rwanda
                        </div>
                      )}

                      {/* Video Badge */}
                      {(item.fileType === 'video' || item.fileType === 'mixed') && (
                        <div 
                          className="absolute top-2 right-2 z-20 bg-black/70 text-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-white/10"
                          style={{ borderRadius: '2px' }}
                        >
                          <FiVideo size={12} /> Video
                        </div>
                      )}

                      <div
                        className={`w-full aspect-[4/3] flex items-center justify-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                          }`}
                        style={{ borderRadius: '2px 2px 0 0' }}
                      >
                        {item.fileType === 'mixed' && item.mediaFiles ? (
                          <div className="relative w-full h-full group cursor-pointer">
                            <ImageCarouselCard
                              images={item.mediaFiles.filter((media: any) => media.type === 'image').map((media: any) => media.url)}
                              alt={item.title}
                              API_BASE={apiBase}
                              className="w-full aspect-[4/3] flex items-center justify-center"
                              style={{ borderRadius: '2px 2px 0 0' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/60 transition-all duration-200 pointer-events-none" />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-[10px] px-2 py-1 pointer-events-none" style={{ borderRadius: '2px' }}>
                              {item.mediaFiles.filter((m: any) => m.type === 'image').length} images,{' '}
                              {item.mediaFiles.filter((m: any) => m.type === 'video').length} videos
                            </div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 p-2 group-hover:scale-110 transition-transform duration-200 pointer-events-none" style={{ borderRadius: '2px' }}>
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
                                className="w-full aspect-[4/3] flex items-center justify-center"
                                style={{ borderRadius: '2px 2px 0 0' }}
                              />
                            ) : (
                              <div className="relative w-full h-full group cursor-pointer">
                                <video
                                  className="w-full h-full object-cover pointer-events-none"
                                  style={{ borderRadius: '2px 2px 0 0' }}
                                  src={resolveUrl(item.url)}
                                  preload="metadata"
                                  muted
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black bg-opacity-70 p-3 group-hover:scale-110 transition-transform duration-200" style={{ borderRadius: '2px' }}>
                                    <svg
                                      className="w-8 h-8 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M8 5v10l8-5-8-5z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-[10px] px-2 py-0.5 pointer-events-none" style={{ borderRadius: '2px' }}>
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
                            className="w-full aspect-[4/3] flex items-center justify-center"
                            style={{ borderRadius: '2px 2px 0 0' }}
                          />
                        )}
                      </div>
                    </button>

                    {/* Info */}
                    <div className={`font-bold text-sm uppercase tracking-tight text-center mt-3 mb-1 px-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </div>
                    <div className={`text-center text-xs mb-1 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.desc}
                    </div>
                    <div className="font-bold text-sm text-center text-emerald-500 mb-2">
                      Price: ${item.price}
                    </div>

                    {/* View Video Button */}
                    {(item.fileType === 'video' || item.fileType === 'mixed') && (
                      <div className="px-4 mb-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(item, true); // Start at video
                          }}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 font-semibold text-xs transition-colors uppercase tracking-wider"
                          style={{ borderRadius: '2px' }}
                        >
                          <FiVideo size={14} /> View Video
                        </button>
                      </div>
                    )}

                    {/* Undo & Spinner */}
                    {isPendingUndo && (
                      <div
                        className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-auto ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4 text-red-650" />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                            Deleting...
                          </span>
                        </div>
                        <button
                          onClick={handleUndo}
                          className="px-2 py-1 font-semibold text-xs transition-colors uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white"
                          style={{ borderRadius: '2px' }}
                        >
                          Undo
                        </button>
                      </div>
                    )}

                    {/* Edit/Delete */}
                    <div className="flex justify-center gap-2 mb-2 mt-2 z-0 px-4">
                      <button
                        className={`flex-1 py-1.5 font-semibold text-xs border uppercase tracking-wider transition-colors ${darkMode
                          ? 'bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700'
                          : 'bg-white border-gray-250 text-gray-750 hover:bg-gray-50'
                          }`}
                        style={{ borderRadius: '2px' }}
                        onClick={() => startEditing(item)}
                        disabled={isDeleting}
                      >
                        Edit
                      </button>
                      <button
                        className="flex-1 py-1.5 font-semibold text-xs uppercase tracking-wider bg-red-500 hover:bg-red-600 text-white transition-colors"
                        style={{ borderRadius: '2px' }}
                        onClick={() => deleteImage(item)}
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </div>

                    {!item.visible && (
                      <div className={`text-[10px] font-bold uppercase text-center tracking-wider mb-2 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
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
                  className="px-3 py-1 font-semibold text-xs uppercase tracking-wider bg-red-500 hover:bg-red-650 hover:bg-red-600 text-white transition-colors"
                  style={{ borderRadius: '2px' }}
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
                  className={`px-3 py-1 font-semibold text-xs uppercase tracking-wider border transition-colors ${darkMode
                    ? 'bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700'
                    : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50'
                    }`}
                  style={{ borderRadius: '2px' }}
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
                  className={`flex flex-col border shadow-sm transition-all duration-300 relative ${darkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                    } ${isDeleting && !isPendingUndo
                      ? 'opacity-50 pointer-events-none'
                      : 'opacity-100 hover:border-emerald-500 hover:shadow-md'
                    }`}
                  style={{ borderRadius: '2px' }}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-30">
                    <input
                      type="checkbox"
                      checked={selectedServiceImages.has(item.id)}
                      onChange={() => toggleSelectService(item.id)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                      style={{ borderRadius: '2px' }}
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
                        className="absolute top-2 right-2 z-20 bg-black/70 text-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm border border-white/10"
                        style={{ borderRadius: '2px' }}
                      >
                        <FiVideo size={12} /> Video
                      </div>
                    )}

                    <div
                      className={`w-full aspect-[4/3] flex items-center justify-center relative ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                        }`}
                      style={{ borderRadius: '2px 2px 0 0' }}
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
                              className="w-full aspect-[4/3] flex items-center justify-center"
                              style={{ borderRadius: '2px 2px 0 0' }}
                            />
                          ) : (
                            <div className="relative w-full h-full group cursor-pointer">
                              <video
                                src={resolveUrl(item.url)}
                                className="w-full h-full object-cover pointer-events-none"
                                style={{ borderRadius: '2px 2px 0 0' }}
                                preload="metadata"
                                muted
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                <div className="bg-black bg-opacity-70 p-3 group-hover:scale-110 transition-transform duration-200" style={{ borderRadius: '2px' }}>
                                  <svg
                                    className="w-8 h-8 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M8 5v10l8-5-8-5z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-[10px] px-2 py-1 pointer-events-none" style={{ borderRadius: '2px' }}>
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
                          className="w-full aspect-[4/3] flex items-center justify-center"
                          style={{ borderRadius: '2px 2px 0 0' }}
                        />
                      )}
                    </div>
                  </button>

                  {/* Info */}
                  <div className={`font-bold text-sm uppercase tracking-tight text-center mt-3 mb-1 px-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </div>
                  <div className={`text-center text-xs mb-1 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.desc}
                  </div>
                  <div className="font-bold text-sm text-center text-emerald-500 mb-2">
                    Price: ${item.price}
                  </div>

                  {/* View Video Button */}
                  {item.fileType === 'video' && (
                    <div className="px-4 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(item, true); // Start at video
                        }}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 font-semibold text-xs transition-colors uppercase tracking-wider"
                        style={{ borderRadius: '2px' }}
                      >
                        <FiVideo size={14} /> View Video
                      </button>
                    </div>
                  )}

                  {/* Undo & Spinner */}
                  {isPendingUndo && (
                    <div
                      className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-auto ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4 text-red-650" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-red-400' : 'text-red-650'}`}>
                          Deleting...
                        </span>
                      </div>
                      <button
                        onClick={handleUndo}
                        className="px-2 py-1 font-semibold text-xs transition-colors uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white"
                        style={{ borderRadius: '2px' }}
                      >
                        Undo
                      </button>
                    </div>
                  )}

                  {/* Edit/Delete */}
                  <div className="flex justify-center gap-2 mb-2 mt-2 z-0 px-4">
                    <button
                      className={`flex-1 py-1.5 font-semibold text-xs border uppercase tracking-wider transition-colors ${darkMode
                        ? 'bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700'
                        : 'bg-white border-gray-250 text-gray-750 hover:bg-gray-50'
                        }`}
                      style={{ borderRadius: '2px' }}
                      onClick={() => startEditing(item)}
                      disabled={isDeleting}
                    >
                      Edit
                    </button>
                    <button
                      className="flex-1 py-1.5 font-semibold text-xs uppercase tracking-wider bg-red-500 hover:bg-red-650 hover:bg-red-600 text-white transition-colors"
                      style={{ borderRadius: '2px' }}
                      onClick={() => deleteImage(item)}
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  </div>

                  {!item.visible && (
                    <div className={`text-[10px] font-bold uppercase text-center tracking-wider mb-2 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div
            className={`shadow-lg p-8 relative w-full max-w-md max-h-[90vh] overflow-y-auto border ${darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
              }`}
            style={{ borderRadius: '2px' }}
          >
            <button
              className={`absolute top-2 right-2 p-2 transition-colors border ${darkMode
                ? 'bg-gray-800 border-gray-750 text-gray-350 hover:bg-gray-700'
                : 'bg-white border-gray-250 text-gray-750 hover:bg-gray-50'
                }`}
              style={{ borderRadius: '2px' }}
              onClick={onCloseEdit}
            >
              ✕
            </button>
            <h3 className={`text-base font-bold uppercase tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Item
            </h3>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Title
            </label>
            <input
              className={`border p-2 w-full mb-3 text-sm ${darkMode
                ? 'bg-gray-900 border-gray-750 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none'
                : 'bg-white border-gray-250 text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none'
                }`}
              style={{ borderRadius: '2px' }}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
            />
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Description
            </label>
            <textarea
              className={`border p-2 w-full mb-3 text-sm ${darkMode
                ? 'bg-gray-900 border-gray-750 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none'
                : 'bg-white border-gray-250 text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none'
                }`}
              style={{ borderRadius: '2px' }}
              rows={4}
              value={editingDesc}
              onChange={(e) => setEditingDesc(e.target.value)}
            />
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Price
            </label>
            <input
              className={`border p-2 w-full mb-3 text-sm ${darkMode
                ? 'bg-gray-900 border-gray-750 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none'
                : 'bg-white border-gray-250 text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none'
                }`}
              style={{ borderRadius: '2px' }}
              type="number"
              min={0}
              value={editingPrice ?? ''}
              onChange={(e) =>
                setEditingPrice(
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
            />

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
                        setEditingFeatureValues({ ...editingFeatureValues, [featureName]: value });
                      }}
                      darkMode={darkMode}
                    />
                  ))}
              </div>
            )}

            <button
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all uppercase tracking-wider mt-4"
              style={{ borderRadius: '2px' }}
              onClick={saveEdit}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Media Preview Modal with video support */}
      {modalOpen && modalImage && selectedModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
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
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-3 border border-white/20 transition"
                style={{ borderRadius: '2px' }}
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 border border-white/20 transition"
                    style={{ borderRadius: '2px' }}
                    aria-label="Previous"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevModalView();
                    }}
                  >
                    <svg
                      className="w-6 h-6"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 border border-white/20 transition"
                    style={{ borderRadius: '2px' }}
                    aria-label="Next"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextModalView();
                    }}
                  >
                    <svg
                      className="w-6 h-6"
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

              <div className="bg-black border border-white/10 overflow-hidden shadow-2xl" style={{ borderRadius: '2px' }}>
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
                        className="max-w-[90vw] max-h-[80vh] w-auto h-auto"
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
                      className="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain"
                    />
                  );
                })()}
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 border border-white/10 backdrop-blur-sm" style={{ borderRadius: '2px' }}>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                  <span>
                    {selectedModalItem.title}
                  </span>
                  <span className="text-gray-405">
                    View {modalViewIndex + 1} of {modalViews.length}
                  </span>
                  {selectedModalItem.fileType === 'mixed' && (
                    <span className="bg-emerald-500 px-2 py-0.5 text-[10px] font-bold">
                      MIXED MEDIA
                    </span>
                  )}
                  {selectedModalItem.fileType === 'video' && (
                    <span className="bg-emerald-500 px-2 py-0.5 text-[10px] font-bold">
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
