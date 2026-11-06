import FeatureFieldRenderer from '@/components/DashboardParts/FeatureFieldRenderer';
import RestrictionCard from '@/components/PlansParts/RestrictionCards';
import { ServiceFeature } from '@/types/features';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { FiUpload } from 'react-icons/fi';

const PRICING_UNITS = [
  { value: 'Per Item / Piece', label: 'Per Item / Piece (e.g., clothes, electronics, single objects)' },
  { value: 'Per Kilogram (kg)', label: 'Per Kilogram (kg) (e.g., vegetables, meat, flour)' },
  { value: 'Per Liter (L)', label: 'Per Liter (L) (e.g., drinks, oils, liquid chemicals)' },
  { value: 'Per Square Meter (m²)', label: 'Per Square Meter (m²) (e.g., flooring, carpets, land tiles)' },
  { value: 'Per Cubic Meter (m³)', label: 'Per Cubic Meter (m³) (e.g., sand, gravel, large cargo)' },
  { value: 'Per Meter (m)', label: 'Per Meter (m) (e.g., ropes, cables, fabrics)' },
  { value: 'Per Pack / Dozen', label: 'Per Pack / Dozen (e.g., box bundles, multipacks)' }
];

type Props = {
  darkMode: boolean;
  subscription?: any;
  subscriptionLoading: boolean;
  service?: { specific_features?: boolean; features?: ServiceFeature[] } | null;
  productImages: File[];
  productVideos: File[];
  productViews: File[][];
  productTitle: string;
  productDesc: string;
  productPrice: string;
  productMadeInRwanda: boolean;
  productUsed: boolean;
  productPricingUnit: string;
  handleProductImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProductViewChange: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void;
  handleProductVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProductUpload: (e: React.FormEvent) => void;
  isUploading: boolean;
  setProductTitle: (v: string) => void;
  setProductDesc: (v: string) => void;
  setProductPrice: (v: string) => void;
  setProductMadeInRwanda: (v: boolean) => void;
  setProductUsed: (v: boolean) => void;
  setProductPricingUnit: (v: string) => void;
  featureValues?: Record<string, any>;
  setFeatureValues?: (values: Record<string, any>) => void;
  uploadProgress?: number | null;
  // Edit mode props
  isEditing?: boolean;
  editingItemName?: string;
  onCancelEdit?: () => void;
  existingImageUrl?: string;
  onRemoveExistingImage?: () => void;
  existingViews?: string[];
  onRemoveExistingView?: (index: number) => void;
  existingVideoUrl?: string;
  onRemoveExistingVideo?: () => void;
};

export default function ProductUploadCard({
  darkMode,
  subscription,
  subscriptionLoading,
  service,
  productImages,
  productVideos,
  productViews,
  productTitle,
  productDesc,
  productPrice,
  productMadeInRwanda,
  productUsed,
  productPricingUnit,
  handleProductImageChange,
  handleProductViewChange,
  handleProductVideoChange,
  handleProductUpload,
  isUploading,
  setProductTitle,
  setProductDesc,
  setProductPrice,
  setProductMadeInRwanda,
  setProductUsed,
  setProductPricingUnit,
  featureValues = {},
  setFeatureValues = () => { },
  uploadProgress,
  isEditing = false,
  editingItemName,
  onCancelEdit,
  existingImageUrl,
  onRemoveExistingImage,
  existingViews = [],
  onRemoveExistingView,
  existingVideoUrl,
  onRemoveExistingVideo,
}: Props) {
  return (
    <div
      id="product-upload-card"
      className={`border rounded-xl transition-all duration-300 ${
        isEditing
          ? darkMode
            ? 'bg-zinc-900 border-brand-red/60 ring-1 ring-brand-red/40'
            : 'bg-white border-brand-red/60 ring-1 ring-brand-red/30'
          : darkMode
            ? 'bg-zinc-900 border-zinc-800'
            : 'bg-white border-gray-200'
      } shadow-sm overflow-hidden`}
    >
      <div
        className={`px-6 py-4 border-b ${
          isEditing
            ? darkMode
              ? 'border-zinc-800 bg-red-950/20'
              : 'border-red-100 bg-red-50/50'
            : darkMode
              ? 'border-zinc-800 bg-zinc-950/50'
              : 'border-gray-200 bg-[#F5F5F5]'
        } flex justify-between items-center`}
      >
        <div className="flex items-center gap-2">
          {isEditing && (
            <span className="px-2 py-0.5 rounded bg-brand-red text-white text-[10px] font-bold uppercase tracking-wider">
              Edit Mode
            </span>
          )}
          <h3 className={`text-base font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
            {isEditing ? (editingItemName ? `Editing: ${editingItemName}` : 'Edit Product') : 'Upload Product'}
          </h3>
        </div>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form
        onSubmit={handleProductUpload}
        className={`p-6 ${darkMode ? 'bg-zinc-900/60' : 'bg-white'}`}
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Product Title
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className={`w-full p-2.5 border rounded-lg text-sm ${darkMode
                  ? 'bg-zinc-950 border-zinc-800 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all`}
                placeholder="PRODUCT NAME"
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Description
              </label>
              <textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                className={`w-full p-2.5 border rounded-lg text-sm ${darkMode
                  ? 'bg-zinc-950 border-zinc-800 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all`}
                rows={3}
                placeholder="WRITE ABOUT THE PRODUCT..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Price (RWF)
                </label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-sm ${darkMode
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    } focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all`}
                  placeholder="1000"
                  min={0}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Pricing Unit
                </label>
                <select
                  value={productPricingUnit}
                  onChange={(e) => setProductPricingUnit(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-sm ${darkMode
                    ? 'bg-zinc-950 border-zinc-800 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                    } focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all`}
                >
                  {PRICING_UNITS.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-3">
              <div className="flex items-center">
                <input
                  id="made-in-rwanda"
                  type="checkbox"
                  checked={productMadeInRwanda}
                  onChange={(e) => setProductMadeInRwanda(e.target.checked)}
                  className="mr-2 text-brand-red focus:ring-brand-red rounded"
                />
                <label
                  htmlFor="made-in-rwanda"
                  className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Made in Rwanda 🇷🇼
                </label>
              </div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <input
                    id="product-used"
                    type="checkbox"
                    checked={productUsed}
                    onChange={(e) => setProductUsed(e.target.checked)}
                    className="mr-2 text-brand-red focus:ring-brand-red rounded"
                  />
                  <label
                    htmlFor="product-used"
                    className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Used / Second Hand
                  </label>
                </div>
                <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} pl-6 leading-tight`}>
                  This product has been used before (second-hand item).
                </p>
              </div>
            </div>

            {service?.specific_features && service?.features && service.features.length > 0 && (
              <>
                {service.features.map((feature, index) => (
                  <FeatureFieldRenderer
                    key={index}
                    feature={feature}
                    values={featureValues}
                    onChange={(featureName: string, value: any) => {
                      setFeatureValues({
                        ...featureValues,
                        [featureName]: value
                      });
                    }}
                    darkMode={darkMode}
                  />
                ))}
              </>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Main Product Image
              </label>
              <div
                className={`border-2 border-dashed rounded-xl ${darkMode
                  ? 'border-zinc-800 bg-zinc-950/30'
                  : 'border-gray-200 bg-[#F5F5F5]'
                  } p-4 flex flex-col items-center justify-center transition hover:border-brand-red`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleProductImageChange}
                  className="hidden"
                  id="product-main-upload"
                />
                {productImages.length > 0 ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="flex flex-wrap gap-2 w-full justify-center mb-2">
                      {productImages.map((img, i) => (
                        <p
                          key={i}
                          className={`text-xs truncate font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          📷 {img.name}
                        </p>
                      ))}
                    </div>
                    <label
                      htmlFor="product-main-upload"
                      className="cursor-pointer text-xs font-bold uppercase tracking-wider text-brand-red hover:underline"
                    >
                      Choose Different Image
                    </label>
                  </div>
                ) : isEditing && existingImageUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <img
                      src={existingImageUrl}
                      alt="Current Main"
                      className="w-full max-h-40 object-contain rounded-lg border border-gray-200 dark:border-zinc-700 bg-black/5 mb-3"
                    />
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="product-main-upload"
                        className="cursor-pointer text-xs font-bold uppercase tracking-wider text-brand-red hover:underline"
                      >
                        Replace Image
                      </label>
                      {onRemoveExistingImage && (
                        <button
                          type="button"
                          onClick={onRemoveExistingImage}
                          className="text-xs text-gray-500 hover:text-red-500 font-semibold uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="product-main-upload"
                    className="cursor-pointer w-full flex flex-col items-center"
                  >
                    <FiUpload
                      size={24}
                      className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Click to upload main image
                    </p>
                  </label>
                )}
              </div>
            </div>

            {/* Existing Views in Edit Mode */}
            {isEditing && existingViews.length > 0 && (
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Current View Images ({existingViews.length})
                </label>
                <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-800 bg-black/5 dark:bg-zinc-950/20">
                  {existingViews.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`View ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-zinc-700"
                      />
                      {onRemoveExistingView && (
                        <button
                          type="button"
                          onClick={() => onRemoveExistingView(i)}
                          className="absolute -top-1.5 -right-1.5 bg-brand-red text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow hover:bg-red-700 transition"
                          title="Remove view"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Views Uploader */}
            {isEditing && (
              <div className="mb-4">
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Add New View Images
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl ${darkMode
                    ? 'border-zinc-800 bg-zinc-950/30'
                    : 'border-gray-200 bg-[#F5F5F5]'
                    } p-4 transition hover:border-brand-red`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleProductViewChange(e, 0)}
                    className="hidden"
                    id="product-edit-views-upload"
                  />
                  <label
                    htmlFor="product-edit-views-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    {productViews[0]?.length ? (
                      <div className="flex flex-wrap gap-2 w-full justify-center">
                        {Array.from(productViews[0]).map((file, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-semibold text-brand-red bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded"
                          >
                            📷 {file.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <>
                        <FiUpload size={20} className={`mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Click to add additional view images
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {!isEditing && productImages.map((img, idx) => (
              <div key={idx} className="mb-4">
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Views for {img.name}
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl ${darkMode
                    ? 'border-zinc-800 bg-zinc-950/30'
                    : 'border-gray-200 bg-[#F5F5F5]'
                    } p-4 transition hover:border-brand-red`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleProductViewChange(e, idx)}
                    className="hidden"
                    id={`product-view-upload-${idx}`}
                  />
                  <label
                    htmlFor={`product-view-upload-${idx}`}
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    {(img as any).previews?.length ? (
                      <div className="flex flex-wrap gap-2 w-full">
                        {(img as any).previews.map((src: string, i: number) => (
                          <img
                            key={i}
                            src={src}
                            className="w-16 h-16 object-cover border rounded-lg"
                            style={{ borderColor: darkMode ? '#3f3f46' : '#E5E5E5' }}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <FiUpload
                          size={24}
                          className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        />
                        <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Click to upload images for {img.name}
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            ))}

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Product Video
              </label>
              <div
                className={`border-2 border-dashed rounded-xl ${darkMode
                  ? 'border-zinc-800 bg-zinc-950/30'
                  : 'border-gray-200 bg-[#F5F5F5]'
                  } p-4 flex flex-col items-center justify-center transition hover:border-brand-red`}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleProductVideoChange}
                  className="hidden"
                  id="product-video-upload"
                />
                {productVideos.length > 0 ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="text-[11px] font-semibold uppercase tracking-wider truncate text-brand-red bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900/40 mb-2">
                      🎥 {productVideos[0].name}
                    </div>
                    <label
                      htmlFor="product-video-upload"
                      className="cursor-pointer text-xs font-bold uppercase tracking-wider text-brand-red hover:underline"
                    >
                      Choose Different Video
                    </label>
                  </div>
                ) : isEditing && existingVideoUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <video
                      src={existingVideoUrl}
                      controls
                      className="w-full max-h-40 rounded-lg border border-gray-200 dark:border-zinc-700 bg-black mb-3"
                    />
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="product-video-upload"
                        className="cursor-pointer text-xs font-bold uppercase tracking-wider text-brand-red hover:underline"
                      >
                        Replace Video
                      </label>
                      {onRemoveExistingVideo && (
                        <button
                          type="button"
                          onClick={onRemoveExistingVideo}
                          className="text-xs text-gray-500 hover:text-red-500 font-semibold uppercase tracking-wider"
                        >
                          Remove Video
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="product-video-upload"
                    className="cursor-pointer w-full flex flex-col items-center"
                  >
                    <FiUpload
                      size={24}
                      className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Click to upload product video
                    </p>
                    <p
                      className={`text-[10px] font-medium text-center mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      Supported: MP4, MOV, WEBM (Max 500MB per video)
                    </p>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='mt-4'>
            <RestrictionCard
          subscription={subscription?.subscription}
          loading={subscriptionLoading}
          requiredFeature="upload_products"
        />
        {uploadProgress !== null && uploadProgress !== undefined && (
          <div className="w-full mb-4 px-6 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {uploadProgress < 100 
                  ? "Uploading to Cloudflare R2..." 
                  : "Finalizing and securing media..."}
              </span>
              <span className="text-brand-red font-bold">{uploadProgress}%</span>
            </div>
            <div className={`w-full h-2 ${darkMode ? 'bg-zinc-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
              <div 
                className="h-full bg-brand-red rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
         </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={isEditing && onCancelEdit ? onCancelEdit : () => {
              setProductTitle('');
              setProductDesc('');
              setProductPrice('');
              setProductMadeInRwanda(false);
              setProductUsed(false);
            }}
            className={`px-4 py-2 font-semibold text-xs transition-colors uppercase tracking-wider rounded-lg border
              ${darkMode
                ? 'bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
          >
            {isEditing ? 'Cancel Edit' : 'Reset'}
          </button>
          <button
            type="submit"
            disabled={(!subscriptionLoading && subscription?.subscription?.status !== 'active') || isUploading}
            className={`px-6 py-2.5 font-semibold text-xs transition-colors uppercase tracking-wider rounded-lg
              ${subscriptionLoading || subscription?.subscription?.status === 'active'
                ? 'bg-brand-red hover:bg-red-700 text-white shadow-sm'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
          >
            {isUploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> {isEditing ? 'Saving Changes...' : 'Uploading...'}
              </span>
            ) : (
              isEditing ? 'Save Changes' : 'Upload Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
