import FeatureFieldRenderer from '@/components/DashboardParts/FeatureFieldRenderer';
import ServiceFeaturesFields from '@/components/DashboardParts/SpecificFeatures';
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
  service: { specific_features?: boolean; features?: ServiceFeature[] } | null;
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
  setFeatureValues?: (values: Record<string, any>) => void;
  onReset: () => void;
};

export default function ServiceUploadCard({
  darkMode,
  subscription,
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
}: Props) {
  const hasFeatures = !!(service?.specific_features && service?.features && service.features.length > 0);
  const leftFeatures = hasFeatures && service?.features ? service.features.filter((_, idx) => idx % 2 === 0) : [];
  const rightFeatures = hasFeatures && service?.features ? service.features.filter((_, idx) => idx % 2 !== 0) : [];

  return (
    <div
      className={`border transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } shadow-sm overflow-hidden`}
      style={{ borderRadius: '2px' }}
    >
      <div
        className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
          } flex justify-between items-center`}
      >
        <h3 className={`text-base font-bold uppercase tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Upload Service
          <span
            className={`text-xs px-2 py-0.5 border font-bold uppercase ${darkMode ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'}`}
            style={{ borderRadius: '2px' }}
          >
            {serviceImages.length} images
          </span>
        </h3>
      </div>

      <form
        onSubmit={handleServiceUpload}
        className={`p-6 ${darkMode ? 'bg-gray-800/40' : 'bg-gray-50/50'}`}
      >
        {/* Top Section: Title/Description and Media Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Service Title
              </label>
              <input
                type="text"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                className={`w-full p-2.5 border text-sm ${darkMode
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                  : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                style={{ borderRadius: '2px' }}
                placeholder="PROFESSIONAL SERVICE..."
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Description
              </label>
              <textarea
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                className={`w-full p-2.5 border text-sm ${darkMode
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                  : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                style={{ borderRadius: '2px' }}
                rows={4}
                placeholder="DESCRIBE YOUR SERVICE..."
              />
            </div>
            <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Base Price ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    className={`w-full p-2.5 border text-sm ${darkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                    style={{ borderRadius: '2px' }}
                    placeholder="99.99"
                  />
                </div>


          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Service Images
              </label>
              <div
                className={`border-2 border-dashed ${darkMode
                  ? 'border-gray-700 bg-gray-900/30'
                  : 'border-gray-300 bg-white'
                  } p-4 transition hover:border-emerald-500`}
                style={{ borderRadius: '2px' }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleServiceImageChange}
                  className="hidden"
                  id="service-images-upload"
                />
                <label
                  htmlFor="service-images-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  {serviceImages.length > 0 ? (
                    <div className="flex flex-wrap gap-2 w-full">
                      {serviceImages.map((img, i) => (
                        <div key={i} className="relative">
                          <img
                            src={URL.createObjectURL(img)}
                            className="w-16 h-16 object-cover border"
                            style={{
                              borderColor: darkMode ? '#374151' : '#E5E7EB',
                              borderRadius: '2px',
                            }}
                            alt="Preview"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <FiUpload
                        size={24}
                        className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                      />
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-455' : 'text-gray-500'}`}>
                        Click to upload service images
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {serviceImages.map((img, idx) => (
              <div key={idx} className="mb-4">
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Views for {img.name}
                </label>
                <div
                  className={`border-2 border-dashed ${darkMode
                    ? 'border-gray-700 bg-gray-900/30'
                    : 'border-gray-300 bg-white'
                    } p-4 transition hover:border-emerald-500`}
                  style={{ borderRadius: '2px' }}
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
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    {serviceViews[idx]?.length > 0 ? (
                      <div className="flex flex-wrap gap-2 w-full">
                        {serviceViews[idx].map((view, i) => (
                          <img
                            key={i}
                            src={URL.createObjectURL(view)}
                            className="w-16 h-16 object-cover border"
                            style={{
                              borderColor: darkMode ? '#374151' : '#E5E7EB',
                              borderRadius: '2px',
                            }}
                            alt="View preview"
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
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-455' : 'text-gray-500'}`}>
                          Click to upload view images
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            ))}

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Service Videos
              </label>
              <div
                className={`border-2 border-dashed ${darkMode
                  ? 'border-gray-700 bg-gray-900/30'
                  : 'border-gray-300 bg-white'
                  } p-4 flex flex-col items-center justify-center transition hover:border-emerald-500`}
                style={{ borderRadius: '2px' }}
              >
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleServiceVideoChange}
                  className="hidden"
                  id="service-video-upload"
                />
                <label
                  htmlFor="service-video-upload"
                  className="cursor-pointer w-full flex flex-col items-center"
                >
                  {serviceVideos.length > 0 ? (
                    <div className="flex flex-wrap gap-2 w-full">
                      {serviceVideos.map((video, i) => (
                        <div
                          key={i}
                          className={`text-[10px] font-bold uppercase tracking-wider truncate ${darkMode ? 'text-red-400' : 'text-red-655'
                            } bg-emerald-500/10 px-2 py-1 border border-emerald-500/25`}
                          style={{ borderRadius: '2px' }}
                        >
                          🎥 {video.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <FiUpload
                        size={24}
                        className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                      />
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-455' : 'text-gray-500'}`}>
                        Click to upload service videos
                      </p>
                      <p
                        className={`text-[9px] font-bold uppercase tracking-wider text-center mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}
                      >
                        Supported: MP4, MOV, AVI (Max 50MB per video)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Price & Features */}
        <div className="grid md:grid-cols-2 gap-6 border-t border-gray-150 dark:border-gray-700 pt-6">
          {leftFeatures.length > 0 ? (
            <div className="space-y-4">
              {/* Row 1: Price and the first left feature side-by-side */}
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

              {/* Row 2+: The remaining left features taking the full width of the left column */}
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
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Base Price ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className={`w-full p-2.5 border text-sm ${darkMode
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                    : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                    } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                  style={{ borderRadius: '2px' }}
                  placeholder="99.99"
                />
              </div>

              {service?.specific_features && (!service?.features || service.features.length === 0) && (
                <div
                  className={`p-4 border mt-4 ${darkMode
                    ? 'bg-gray-900/40 border-gray-750'
                    : 'bg-white border-gray-200'
                    }`}
                  style={{ borderRadius: '2px' }}
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
        </div>

        <div className="mt-4">
          <RestrictionCard
            subscription={subscription?.subscription}
            requiredFeature="upload_products"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={isUploading}
            className={`px-4 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border
              ${darkMode
                ? 'bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50'
              }`}
            style={{ borderRadius: '2px' }}
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={
              subscription?.subscription?.status !== 'active' || !serviceImages.length || isUploading
            }
            className={`px-6 py-2 font-semibold text-xs transition-colors uppercase tracking-wider
              ${subscription?.subscription?.status === 'active' && serviceImages.length
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-450 text-gray-200 cursor-not-allowed'
              }`}
            style={{ borderRadius: '2px' }}
          >
            {isUploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </span>
            ) : (
              'Upload Service'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
