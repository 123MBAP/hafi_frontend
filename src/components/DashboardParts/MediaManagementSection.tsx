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
            <div className="flex items-center justify-between mb-2">
              <h2
                className={`text-2xl font-bold ${darkMode ? 'text-teal-300' : 'text-hafi-teal'
                  }`}
              >
                Product Images
              </h2>
              {selectedProductImages.size > 0 && (
                <div className="space-x-2">
                  <button
                    className={`px-3 py-1 rounded transition-colors ${darkMode
                      ? 'bg-red-700 hover:bg-red-600'
                      : 'bg-red-600 hover:bg-red-700'
                      } text-white`}
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
                    className={`px-3 py-1 rounded transition-colors ${darkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-500 hover:bg-gray-600'
                      } text-white`}
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
                    className={`flex flex-col border shadow-md rounded-lg overflow-hidden transition-all duration-300 relative ${darkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                      } ${isDeleting && !isPendingUndo
                        ? 'opacity-50 pointer-events-none'
                        : 'opacity-100 hover:shadow-lg'
                      }`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-2 left-2 z-30">
                      <input
                        type="checkbox"
                        checked={selectedProductImages.has(item.id)}
                        onChange={() => toggleSelectProduct(item.id)}
                        className={`h-4 w-4 rounded ${darkMode ? 'text-teal-500' : 'text-hafi-teal'
                          }`}
                      />
                    </div>

                    {/* Media and modal */}
                    <button
                      onClick={() => openModal(item)}
                      className="focus:outline-none relative"
                    >
                      {/* Made in Rwanda Badge */}
                      {item.madeInRwanda && (
                        <div className="absolute top-2 left-10 z-20 bg-gradient-to-r from-blue-500 to-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                          🇷🇼 Made in Rwanda
                        </div>
                      )}

                      {/* Video Badge */}
                      {(item.fileType === 'video' || item.fileType === 'mixed') && (
                        <div className="absolute top-2 right-2 z-20 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                          <FiVideo size={12} /> Video
                        </div>
                      )}

                      <div
                        className={`w-full aspect-[4/3] flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'
                          }`}
                      >
                        {item.fileType === 'mixed' && item.mediaFiles ? (
                          <div className="relative w-full h-full group cursor-pointer">
                            <ImageCarouselCard
                              images={item.mediaFiles.filter((media: any) => media.type === 'image').map((media: any) => media.url)}
                              alt={item.title}
                              API_BASE={apiBase}
                              className="w-full aspect-[4/3] flex items-center justify-center rounded-t"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/60 transition-all duration-200 pointer-events-none" />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                              {item.mediaFiles.filter((m: any) => m.type === 'image').length} images,{' '}
                              {item.mediaFiles.filter((m: any) => m.type === 'video').length} videos
                            </div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 rounded-full p-2 group-hover:scale-110 transition-transform duration-200 pointer-events-none">
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
                                className="w-full aspect-[4/3] flex items-center justify-center rounded-t"
                              />
                            ) : (
                              <div className="relative w-full h-full group cursor-pointer">
                                <video
                                  className="w-full h-full object-cover rounded-t pointer-events-none"
                                  src={resolveUrl(item.url)}
                                  preload="metadata"
                                  muted
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black bg-opacity-70 rounded-full p-3 group-hover:scale-110 transition-transform duration-200">
                                    <svg
                                      className="w-8 h-8 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M8 5v10l8-5-8-5z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded pointer-events-none">
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
                            className="w-full aspect-[4/3] flex items-center justify-center rounded-t"
                          />
                        )}
                      </div>
                    </button>

                    {/* Info */}
                    <div
                      className={`text-base font-bold text-center mt-3 mb-1 px-2 ${darkMode ? 'text-teal-300' : 'text-hafi-teal'
                        }`}
                    >
                      {item.title}
                    </div>
                    <div
                      className={`text-center text-sm mb-1 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                    >
                      {item.desc}
                    </div>
                    <div
                      className={`font-semibold text-center mb-2 ${darkMode ? 'text-teal-400' : 'text-hafi-green'
                        }`}
                    >
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
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2 font-medium transition shadow-md"
                        >
                          <FiVideo size={18} /> View Video
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
                          <Loader2 className="animate-spin w-4 h-4 text-red-600" />
                          <span
                            className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'
                              }`}
                          >
                            Deleting...
                          </span>
                        </div>
                        <button
                          onClick={handleUndo}
                          className={`px-2 py-1 text-xs rounded transition-colors ${darkMode
                            ? 'bg-teal-600 hover:bg-teal-500'
                            : 'bg-hafi-teal hover:bg-teal-600'
                            } text-white`}
                        >
                          Undo
                        </button>
                      </div>
                    )}

                    {/* Edit/Delete */}
                    <div className="flex justify-center gap-2 mb-2 mt-2 z-0">
                      <button
                        className={`px-3 py-1 rounded transition-colors ${darkMode
                          ? 'bg-teal-600 hover:bg-teal-500'
                          : 'bg-hafi-teal hover:bg-teal-600'
                          } text-white`}
                        onClick={() => startEditing(item)}
                        disabled={isDeleting}
                      >
                        Edit
                      </button>
                      <button
                        className={`px-3 py-1 rounded transition-colors ${darkMode
                          ? 'bg-red-700 hover:bg-red-600'
                          : 'bg-red-600 hover:bg-red-700'
                          } text-white`}
                        onClick={() => deleteImage(item)}
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </div>

                    {!item.visible && (
                      <div
                        className={`text-xs text-center italic mb-2 ${darkMode ? 'text-red-400' : 'text-red-500'
                          }`}
                      >
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
          <div className="flex items-center justify-between mb-2">
            <h2
              className={`text-2xl font-bold ${darkMode ? 'text-teal-300' : 'text-hafi-teal'
                }`}
            >
              Service Images
            </h2>
            {selectedServiceImages.size > 0 && (
              <div className="space-x-2">
                <button
                  className={`px-3 py-1 rounded transition-colors ${darkMode
                    ? 'bg-red-700 hover:bg-red-600'
                    : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
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
                  className={`px-3 py-1 rounded transition-colors ${darkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-500 hover:bg-gray-600'
                    } text-white`}
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
                  className={`flex flex-col border shadow-md rounded-lg overflow-hidden transition-all duration-300 relative ${darkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                    } ${isDeleting && !isPendingUndo
                      ? 'opacity-50 pointer-events-none'
                      : 'opacity-100 hover:shadow-lg'
                    }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-30">
                    <input
                      type="checkbox"
                      checked={selectedServiceImages.has(item.id)}
                      onChange={() => toggleSelectService(item.id)}
                      className={`h-4 w-4 rounded ${darkMode ? 'text-teal-500' : 'text-hafi-teal'
                        }`}
                    />
                  </div>

                  {/* Media and modal */}
                  <button
                    onClick={() => openModal(item)}
                    className="focus:outline-none relative"
                  >
                    {/* Video Badge */}
                    {item.fileType === 'video' && (
                      <div className="absolute top-2 right-2 z-20 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                        <FiVideo size={12} /> Video
                      </div>
                    )}

                    <div
                      className={`w-full aspect-[4/3] flex items-center justify-center relative ${darkMode ? 'bg-gray-700' : 'bg-gray-100'
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
                              className="w-full aspect-[4/3] flex items-center justify-center rounded-t"
                            />
                          ) : (
                            <div className="relative w-full h-full group cursor-pointer">
                              <video
                                src={resolveUrl(item.url)}
                                className="w-full h-full object-cover rounded-t pointer-events-none"
                                preload="metadata"
                                muted
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                <div className="bg-black bg-opacity-70 rounded-full p-3 group-hover:scale-110 transition-transform duration-200">
                                  <svg
                                    className="w-8 h-8 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M8 5v10l8-5-8-5z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded pointer-events-none">
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
                          className="w-full aspect-[4/3] flex items-center justify-center rounded-t"
                        />
                      )}
                    </div>
                  </button>

                  {/* Info */}
                  <div
                    className={`text-base font-bold text-center mt-3 mb-1 px-2 ${darkMode ? 'text-teal-300' : 'text-hafi-teal'
                      }`}
                  >
                    {item.title}
                  </div>
                  <div
                    className={`text-center text-sm mb-1 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                  >
                    {item.desc}
                  </div>
                  <div
                    className={`font-semibold text-center mb-2 ${darkMode ? 'text-teal-400' : 'text-hafi-green'
                      }`}
                  >
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
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2 font-medium transition shadow-md"
                      >
                        <FiVideo size={18} /> View Video
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
                        <Loader2 className="animate-spin w-4 h-4 text-red-600" />
                        <span
                          className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'
                            }`}
                        >
                          Deleting...
                        </span>
                      </div>
                      <button
                        onClick={handleUndo}
                        className={`px-2 py-1 text-xs rounded transition-colors ${darkMode
                          ? 'bg-teal-600 hover:bg-teal-500'
                          : 'bg-hafi-teal hover:bg-teal-600'
                          } text-white`}
                      >
                        Undo
                      </button>
                    </div>
                  )}

                  {/* Edit/Delete */}
                  <div className="flex justify-center gap-2 mb-2 mt-2 z-0">
                    <button
                      className={`px-3 py-1 rounded transition-colors ${darkMode
                        ? 'bg-teal-600 hover:bg-teal-500'
                        : 'bg-hafi-teal hover:bg-teal-600'
                        } text-white`}
                      onClick={() => startEditing(item)}
                      disabled={isDeleting}
                    >
                      Edit
                    </button>
                    <button
                      className={`px-3 py-1 rounded transition-colors ${darkMode
                        ? 'bg-red-700 hover:bg-red-600'
                        : 'bg-red-600 hover:bg-red-700'
                        } text-white`}
                      onClick={() => deleteImage(item)}
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  </div>

                  {!item.visible && (
                    <div
                      className={`text-xs text-center italic mb-2 ${darkMode ? 'text-red-400' : 'text-red-500'
                        }`}
                    >
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
            className={`rounded-lg shadow-lg p-8 relative w-full max-w-md max-h-[90vh] overflow-y-auto border ${darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
              }`}
          >
            <button
              className={`absolute top-2 right-2 rounded-full p-2 transition-colors ${darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300'
                }`}
              onClick={onCloseEdit}
            >
              ✕
            </button>
            <h3
              className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-teal-300' : 'text-hafi-teal'
                }`}
            >
              Edit Image
            </h3>
            <label
              className={`block font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
            >
              Title
            </label>
            <input
              className={`border rounded px-2 py-1 w-full mb-2 ${darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
                }`}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
            />
            <label
              className={`block font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
            >
              Description
            </label>
            <input
              className={`border rounded px-2 py-1 w-full mb-2 ${darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
                }`}
              value={editingDesc}
              onChange={(e) => setEditingDesc(e.target.value)}
            />
            <label
              className={`block font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
            >
              Price
            </label>
            <input
              className={`border rounded px-2 py-1 w-full mb-2 ${darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
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

            {/* Feature Fields for Services */}
            {editingImage.type === 'service' && service?.specific_features && service?.features && (
              <div className="mt-4 space-y-3">
                <h4 className={`text-lg font-semibold ${darkMode ? 'text-teal-300' : 'text-hafi-teal'}`}>
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
              className={`px-4 py-2 rounded transition-colors mt-4 ${darkMode
                ? 'bg-teal-600 hover:bg-teal-500'
                : 'bg-hafi-green hover:bg-green-600'
                } text-white`}
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
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
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

              <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
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

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">
                    {selectedModalItem.title}
                  </span>
                  <span className="text-gray-300">
                    View {modalViewIndex + 1} of {modalViews.length}
                  </span>
                  {selectedModalItem.fileType === 'mixed' && (
                    <span className="bg-purple-600 px-2 py-1 rounded text-xs">
                      🎭 MIXED MEDIA
                    </span>
                  )}
                  {selectedModalItem.fileType === 'video' && (
                    <span className="bg-red-600 px-2 py-1 rounded text-xs">
                      🎥 VIDEO
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

