import FeatureFieldRenderer from '@/components/DashboardParts/FeatureFieldRenderer';
import ServiceFeaturesFields from '@/components/DashboardParts/SpecificFeatures';
import RealEstateFields from '@/components/DashboardParts/RealEstateFields';
import RestrictionCard from '@/components/PlansParts/RestrictionCards';
import { ServiceFeature } from '@/types/features';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { FiUpload } from 'react-icons/fi';

type ExtraFields = {
  pricePerHour: number;
  pricePerDay: number;
  discount: number;
  withDriverCost: number;
};

type Props = {
  darkMode: boolean;
  subscription?: any;
  subscriptionLoading: boolean;
  service: { specific_features?: boolean; features?: ServiceFeature[]; custom_type?: string } | null;
  extraFieldsData: ExtraFields;
  serviceImages: File[];
  serviceVideos: File[];
  serviceViews: File[][];
  serviceTitle: string;
  serviceDesc: string;
  servicePrice: string;
  handleServiceImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleServiceViewChange: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void;
  handleServiceVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleServiceUpload: (e: React.FormEvent) => void;
  isUploading: boolean;
  setServiceTitle: (v: string) => void;
  setServiceDesc: (v: string) => void;
  setServicePrice: (v: string) => void;
  setExtraFieldsData: (updater: ExtraFields | ((prev: ExtraFields) => ExtraFields)) => void;
  featureValues?: Record<string, any>;
  setFeatureValues?: (values: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  onReset: () => void;
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

export default function ServiceUploadCard({
  darkMode,
  subscription,
  subscriptionLoading,
  service,
  extraFieldsData,
  serviceImages,
  serviceVideos,
  serviceViews,
  serviceTitle,
  serviceDesc,
  servicePrice,
  handleServiceImageChange,
  handleServiceViewChange,
  handleServiceVideoChange,
  handleServiceUpload,
  isUploading,
  setServiceTitle,
  setServiceDesc,
  setServicePrice,
  setExtraFieldsData,
  featureValues = {},
  setFeatureValues = () => { },
  onReset,
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
  const hasFeatures = !!(service?.specific_features && service?.features && service.features.length > 0);
  const isRealEstate = service?.custom_type?.toLowerCase() === 'real_estate';
  const leftFeatures = hasFeatures && service?.features ? service.features.filter((_, idx) => idx % 2 === 0) : [];
  const rightFeatures = hasFeatures && service?.features ? service.features.filter((_, idx) => idx % 2 !== 0) : [];

  const canSubmit = (!subscriptionLoading && subscription?.subscription?.status !== 'active')
    ? false
    : (isEditing ? (serviceImages.length > 0 || !!existingImageUrl) : serviceImages.length > 0);

  return (
    <div
      id="service-upload-card"
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
          <h3 className={`text-base font-bold uppercase tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {isEditing
              ? (editingItemName ? `Editing: ${editingItemName}` : (isRealEstate ? 'Edit Property' : 'Edit Service'))
              : (isRealEstate ? 'Upload Property' : 'Upload Service')
            }
            {!isEditing && (
              <span className="text-xs px-2.5 py-0.5 rounded-full border font-semibold uppercase bg-red-50 text-brand-red border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40">
                {serviceImages.length} images
              </span>
            )}
          </h3>
        </div>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-red hover:bg-brand-red/10 border border-brand-red/30 rounded-lg transition"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form
        onSubmit={handleServiceUpload}
        className={`p-6 ${darkMode ? 'bg-zinc-900/60' : 'bg-white'}`}
      >
        {/* Top Section: Title/Description and Media Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isRealEstate ? 'Property Title' : 'Service Title'}
              </label>
              <input
                type="text"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                className={`w-full p-2.5 border rounded-lg text-sm ${darkMode
                  ? 'bg-zinc-950 border-zinc-800 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all`}
                placeholder={isRealEstate ? "E.G. BEAUTIFUL 4-BEDROOM VILLA IN KICUKIRO..." : "PROFESSIONAL SERVICE..."}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isRealEstate ? 'Property Description' : 'Description'}
              </label>
              <textarea
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                className={`w-full p-2.5 border rounded-lg text-sm ${darkMode
                  ? 'bg-zinc-950 border-zinc-800 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all`}
                rows={4}
                placeholder={isRealEstate ? "DESCRIBE THE PROPERTY, KEY FEATURES, LOCATION HIGHLIGHTS..." : "DESCRIBE YOUR SERVICE..."}
              />
            </div>
            {!isRealEstate && (
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Base Price (RWF)
                </label>
                <input
                  type="number"
                  min={0}
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-sm ${darkMode
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    } focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all`}
                  placeholder="e.g. 50000"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Main Image Uploader */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isRealEstate ? 'Property Main Image' : 'Service Main Image'}
              </label>
              <div
                className={`border-2 border-dashed rounded-xl ${darkMode
                  ? 'border-zinc-800 bg-zinc-950/30'
                  : 'border-gray-200 bg-[#F5F5F5]'
                  } p-4 transition hover:border-brand-red`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleServiceImageChange}
                  className="hidden"
                  id="service-images-upload"
                />
                {serviceImages.length > 0 ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="flex flex-wrap gap-2 w-full justify-center mb-2">
                      {serviceImages.map((img, i) => (
                        <div key={i} className="relative">
                          <img
                            src={URL.createObjectURL(img)}
                            className="w-16 h-16 object-cover border rounded-lg"
                            style={{
                              borderColor: darkMode ? '#3f3f46' : '#E5E5E5',
                            }}
                            alt="Preview"
                          />
                        </div>
                      ))}
                    </div>
                    <label
                      htmlFor="service-images-upload"
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
                      className="w-full max-h-44 object-contain rounded-lg border border-gray-200 dark:border-zinc-700 bg-black/5 dark:bg-black/20 mb-3"
                    />
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="service-images-upload"
                        className="cursor-pointer text-xs font-bold uppercase tracking-wider text-brand-red hover:underline"
                      >
                        Replace Image
                      </label>
                      {onRemoveExistingImage && (
                        <button
                          type="button"
                          onClick={onRemoveExistingImage}
                          className="text-xs text-gray-500 hover:text-brand-red font-semibold uppercase tracking-wider transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="service-images-upload"
                    className="cursor-pointer flex flex-col items-center justify-center w-full"
                  >
                    <FiUpload
                      size={24}
                      className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isRealEstate ? 'Click to upload property main image' : 'Click to upload service images'}
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
                <div className="flex flex-wrap gap-2.5 p-3 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 bg-black/5 dark:bg-zinc-950/20">
                  {existingViews.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`View ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm"
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

            {/* Additional Views in Edit Mode */}
            {isEditing && (
              <div>
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
                    onChange={(e) => handleServiceViewChange(e, 0)}
                    className="hidden"
                    id="service-edit-views-upload"
                  />
                  <label
                    htmlFor="service-edit-views-upload"
                    className="cursor-pointer flex flex-col items-center justify-center w-full"
                  >
                    {serviceViews[0]?.length ? (
                      <div className="flex flex-wrap gap-2 w-full justify-center">
                        {Array.from(serviceViews[0]).map((file, i) => (
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

            {/* View Uploaders for non-edit mode */}
            {!isEditing && serviceImages.map((img, idx) => (
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
                    multiple
                    accept="image/*"
                    onChange={(e) => handleServiceViewChange(e, idx)}
                    className="hidden"
                    id={`service-views-upload-${idx}`}
                  />
                  <label
                    htmlFor={`service-views-upload-${idx}`}
                    className="cursor-pointer flex flex-col items-center justify-center w-full"
                  >
                    {serviceViews[idx]?.length > 0 ? (
                      <div className="flex flex-wrap gap-2 w-full">
                        {serviceViews[idx].map((view, i) => (
                          <img
                            key={i}
                            src={URL.createObjectURL(view)}
                            className="w-16 h-16 object-cover border rounded-lg"
                            style={{
                              borderColor: darkMode ? '#3f3f46' : '#E5E5E5',
                            }}
                            alt="View preview"
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <FiUpload
                          size={24}
                          className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        />
                        <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRealEstate ? 'Click to upload additional views' : 'Click to upload view images'}
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            ))}

            {/* Video Section */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isRealEstate ? 'Property Video Walkthrough' : 'Service Video'}
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
                  accept="video/*"
                  onChange={handleServiceVideoChange}
                  className="hidden"
                  id="service-video-upload"
                />
                {serviceVideos.length > 0 ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="text-[11px] font-semibold uppercase tracking-wider truncate text-brand-red bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900/40 mb-2">
                      🎥 {serviceVideos[0].name}
                    </div>
                    <label
                      htmlFor="service-video-upload"
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
                      className="w-full max-h-44 rounded-lg border border-gray-200 dark:border-zinc-700 bg-black mb-3"
                    />
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="service-video-upload"
                        className="cursor-pointer text-xs font-bold uppercase tracking-wider text-brand-red hover:underline"
                      >
                        Replace Video
                      </label>
                      {onRemoveExistingVideo && (
                        <button
                          type="button"
                          onClick={onRemoveExistingVideo}
                          className="text-xs text-gray-500 hover:text-brand-red font-semibold uppercase tracking-wider transition"
                        >
                          Remove Video
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="service-video-upload"
                    className="cursor-pointer w-full flex flex-col items-center"
                  >
                    <FiUpload
                      size={24}
                      className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isRealEstate ? 'Click to upload property video walkthrough' : 'Click to upload service videos'}
                    </p>
                    <p className={`text-[10px] font-medium text-center mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Supported: MP4, MOV, AVI (Max 3GB per video)
                    </p>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upload progress indicator */}
        {uploadProgress != null && (
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs mb-1 font-semibold uppercase tracking-wider text-brand-red">
              <span>{isEditing ? 'Updating...' : 'Uploading...'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-red h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Section: Price & Features */}
        {isRealEstate ? (
          <RealEstateFields
            darkMode={darkMode}
            values={featureValues || {}}
            onChange={(keyOrObj, value) => {
              if (typeof keyOrObj === 'object' && keyOrObj !== null) {
                if ('price' in keyOrObj && keyOrObj.price !== undefined) {
                  setServicePrice(String(keyOrObj.price));
                }
                if (setFeatureValues) {
                  setFeatureValues((prev: Record<string, any> = {}) => ({ ...prev, ...keyOrObj }));
                }
              } else {
                if (keyOrObj === 'price') {
                  setServicePrice(String(value));
                }
                if (setFeatureValues) {
                  setFeatureValues((prev: Record<string, any> = {}) => ({ ...prev, [keyOrObj]: value }));
                }
              }
            }}
          />
        ) : <div className="grid md:grid-cols-2 gap-6 border-t border-gray-150 dark:border-zinc-800 pt-6">
          {leftFeatures.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  {leftFeatures[0] && (
                    <FeatureFieldRenderer
                      feature={leftFeatures[0]}
                      values={featureValues}
                      onChange={(featureName: string, value: any) => {
                        setFeatureValues({
                          ...featureValues,
                          [featureName]: value
                        });
                      }}
                      darkMode={darkMode}
                    />
                  )}
                </div>
              </div>

              {leftFeatures.slice(1).map((feature, index) => (
                <div key={index}>
                  <FeatureFieldRenderer
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
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Base Price ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-sm ${darkMode
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    } focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all`}
                  placeholder="99.99"
                />
              </div>

              {service?.specific_features && (!service?.features || service.features.length === 0) && (
                <div
                  className={`p-4 border rounded-xl mt-4 ${darkMode
                    ? 'bg-zinc-950/40 border-zinc-800'
                    : 'bg-white border-gray-200'
                    }`}
                >
                  <ServiceFeaturesFields
                    featureData={extraFieldsData}
                    setFeatureData={(newData) =>
                      setExtraFieldsData((prev) => ({ ...prev, ...newData }))
                    }
                    darkMode={darkMode}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {rightFeatures.map((feature, index) => (
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
          </div>
        </div>}

        <div className="mt-4">
          <RestrictionCard
            subscription={subscription?.subscription}
            loading={subscriptionLoading}
            requiredFeature="upload_products"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={isEditing && onCancelEdit ? onCancelEdit : onReset}
            disabled={isUploading}
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
            disabled={!canSubmit || isUploading}
            className={`px-6 py-2.5 font-semibold text-xs transition-colors uppercase tracking-wider rounded-lg
              ${canSubmit && !isUploading
                ? 'bg-brand-red hover:bg-red-700 text-white shadow-sm'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
          >
            {isUploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> {isEditing ? 'Saving...' : 'Uploading...'}
              </span>
            ) : (
              isEditing ? 'Save Changes' : (isRealEstate ? 'Upload Property' : 'Upload Service')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
