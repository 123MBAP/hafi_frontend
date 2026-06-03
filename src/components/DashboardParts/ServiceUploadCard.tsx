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
  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}
    >
      <div
        className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
      >
        <h3
          className={`text-xl font-semibold flex items-center gap-3 ${darkMode ? 'text-teal-300' : 'text-hafi-teal'
            }`}
        >
          Upload Service
          <span
            className={`text-sm px-2 py-1 rounded-full ${darkMode
              ? 'bg-gray-700 text-teal-300'
              : 'bg-purple-100 text-purple-800'
              }`}
          >
            {serviceImages.length} images
          </span>
        </h3>
      </div>

      <form
        onSubmit={handleServiceUpload}
        className={`p-6 ${darkMode ? 'bg-gray-700/30' : 'bg-purple-50'
          } rounded-b-xl`}
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label
                className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
              >
                Service Title
              </label>
              <input
                type="text"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode
                  ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                  : 'bg-white border-gray-300 focus:border-purple-400'
                  } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-purple-200'
                  } transition`}
                placeholder="Professional Service..."
              />
            </div>
            <div>
              <label
                className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
              >
                Description
              </label>
              <textarea
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode
                  ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                  : 'bg-white border-gray-300 focus:border-purple-400'
                  } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-purple-200'
                  } transition`}
                rows={3}
                placeholder="Describe your service..."
              />
            </div>
            <div>
              <label
                className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
              >
                Base Price ($)
              </label>
              <input
                type="number"
                min={0}
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode
                  ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                  : 'bg-white border-gray-300 focus:border-purple-400'
                  } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-purple-200'
                  } transition`}
                placeholder="99.99"
              />
            </div>


            {(() => {
              console.log('🎨 [SERVICE_UPLOAD_CARD] Rendering check:');
              console.log('  - service exists:', !!service);
              console.log('  - service.specific_features:', service?.specific_features);
              console.log('  - service.features exists:', !!service?.features);
              console.log('  - service.features length:', service?.features?.length);
              console.log('  - Full service object:', service);
              console.log('  - featureValues:', featureValues);

              const shouldRender = service?.specific_features && service?.features && service.features.length > 0;
              console.log('  - Should render features?', shouldRender);

              return null;
            })()}

            {service?.specific_features && service?.features && service.features.length > 0 && (
              <>
                {console.log('✅ [SERVICE_UPLOAD_CARD] Rendering features, count:', service.features.length)}
                {service.features.map((feature, index) => {
                  console.log(`  🎯 Rendering feature #${index + 1}:`, feature);
                  return (
                    <FeatureFieldRenderer
                      key={index}
                      feature={feature}
                      values={featureValues}
                      onChange={(featureName: string, value: any) => {
                        console.log(`📝 Feature value changed: ${featureName} =`, value);
                        setFeatureValues({
                          ...featureValues,
                          [featureName]: value
                        });
                      }}
                      darkMode={darkMode}
                    />
                  );
                })}
              </>
            )}

            {service?.specific_features && (!service?.features || service.features.length === 0) && (
              <div
                className={`p-4 rounded-lg border mt-4 ${darkMode
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-white border-purple-200'
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

          <div className="space-y-4">
            <div>
              <label
                className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
              >
                Service Images
              </label>
              <div
                className={`border-2 border-dashed ${darkMode
                  ? 'border-gray-600 hover:border-teal-400'
                  : 'border-gray-300 hover:border-purple-400'
                  } rounded-lg p-4 transition`}
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
                            className="w-16 h-16 object-cover rounded border"
                            style={{
                              borderColor: darkMode ? '#4B5563' : '#E5E7EB',
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
                      <p
                        className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                      >
                        Click to upload service images
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {serviceImages.map((img, idx) => (
              <div key={idx} className="mb-4">
                <label
                  className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                >
                  Views for {img.name}
                </label>
                <div
                  className={`border-2 border-dashed ${darkMode
                    ? 'border-gray-600 hover:border-teal-400'
                    : 'border-gray-300 hover:border-purple-400'
                    } rounded-lg p-4 transition`}
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
                            className="w-16 h-16 object-cover rounded border"
                            style={{
                              borderColor: darkMode ? '#4B5563' : '#E5E7EB',
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
                        <p
                          className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        >
                          Click to upload view images
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            ))}

            <div>
              <label
                className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
              >
                Service Videos
              </label>
              <div
                className={`border-2 border-dashed ${darkMode
                  ? 'border-gray-600 hover:border-teal-400'
                  : 'border-gray-300 hover:border-purple-400'
                  } rounded-lg p-4 flex flex-col items-center justify-center transition`}
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
                          className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'
                            } bg-purple-100 dark:bg-purple-900/20 px-2 py-1 rounded`}
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
                      <p
                        className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                      >
                        Click to upload service videos
                      </p>
                      <p
                        className={`text-xs text-center mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'
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
            className={`px-4 py-2 rounded-lg font-medium ${darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              } transition`}
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={
              subscription?.subscription?.status !== 'active' || !serviceImages.length || isUploading
            }
            className={`px-6 py-2 rounded-lg font-medium ${subscription?.subscription?.status === 'active'
              ? darkMode
                ? 'bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900'
                : 'bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-700 hover:to-teal-600'
              : 'bg-gray-400 cursor-not-allowed'
              } text-white transition shadow-lg`}
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
