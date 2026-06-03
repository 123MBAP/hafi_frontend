import FeatureFieldRenderer from '@/components/DashboardParts/FeatureFieldRenderer';
import RestrictionCard from '@/components/PlansParts/RestrictionCards';
import { ServiceFeature } from '@/types/features';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { FiUpload } from 'react-icons/fi';

type Props = {
  darkMode: boolean;
  subscription?: any;
  service?: { specific_features?: boolean; features?: ServiceFeature[] } | null;
  productImages: File[];
  productVideos: File[];
  productTitle: string;
  productDesc: string;
  productPrice: string;
  productMadeInRwanda: boolean;
  handleProductImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProductViewChange: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void;
  handleProductVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProductUpload: (e: React.FormEvent) => void;
  isUploading: boolean;
  setProductTitle: (v: string) => void;
  setProductDesc: (v: string) => void;
  setProductPrice: (v: string) => void;
  setProductMadeInRwanda: (v: boolean) => void;
  featureValues?: Record<string, any>;
  setFeatureValues?: (values: Record<string, any>) => void;
};

export default function ProductUploadCard({
  darkMode,
  subscription,
  service,
  productImages,
  productVideos,
  productTitle,
  productDesc,
  productPrice,
  productMadeInRwanda,
  handleProductImageChange,
  handleProductViewChange,
  handleProductVideoChange,
  handleProductUpload,
  isUploading,
  setProductTitle,
  setProductDesc,
  setProductPrice,
  setProductMadeInRwanda,
  featureValues = {},
  setFeatureValues = () => { },
}: Props) {
  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}
    >
      <div
        className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'
          } flex justify-between items-center`}
      >
        <h3
          className={`text-xl font-semibold ${darkMode ? 'text-teal-300' : 'text-hafi-teal'
            }`}
        >
          Upload Product
        </h3>
      </div>

      <form
        onSubmit={handleProductUpload}
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
                Product Title
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode
                  ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                  : 'bg-white border-gray-300 focus:border-purple-400'
                  } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-purple-200'
                  } transition`}
                placeholder="Product name"
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
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode
                  ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                  : 'bg-white border-gray-300 focus:border-purple-400'
                  } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-purple-200'
                  } transition`}
                rows={3}
                placeholder="Write about the product..."
              />
            </div>

            <div>
              <label
                className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
              >
                Price (RWF)
              </label>
              <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode
                  ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                  : 'bg-white border-gray-300 focus:border-purple-400'
                  } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-purple-200'
                  } transition`}
                placeholder="1000"
                min={0}
              />
            </div>

            <div className="flex items-center mt-2">
              <input
                id="made-in-rwanda"
                type="checkbox"
                checked={productMadeInRwanda}
                onChange={(e) => setProductMadeInRwanda(e.target.checked)}
                className="mr-2"
              />
              <label
                htmlFor="made-in-rwanda"
                className={darkMode ? 'text-gray-300' : 'text-gray-700'}
              >
                Made in Rwanda
              </label>
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
              <label
                className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
              >
                Main Product Images
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
                  accept="image/*"
                  onChange={handleProductImageChange}
                  className="hidden"
                  id="product-main-upload"
                />
                <label
                  htmlFor="product-main-upload"
                  className="cursor-pointer w-full flex flex-col items-center"
                >
                  {productImages.length > 0 ? (
                    <div className="flex flex-wrap gap-2 w-full">
                      {productImages.map((img, i) => (
                        <p
                          key={i}
                          className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        >
                          {img.name}
                        </p>
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
                        Click to upload main images
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {productImages.map((img, idx) => (
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
                            className="w-16 h-16 object-cover rounded border"
                            style={{ borderColor: darkMode ? '#4B5563' : '#E5E7EB' }}
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
                          Click to upload images for {img.name}
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
                Product Videos
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
                  onChange={handleProductVideoChange}
                  className="hidden"
                  id="product-video-upload"
                />
                <label
                  htmlFor="product-video-upload"
                  className="cursor-pointer w-full flex flex-col items-center"
                >
                  {productVideos.length > 0 ? (
                    <div className="flex flex-wrap gap-2 w-full">
                      {productVideos.map((video, i) => (
                        <div
                          key={i}
                          className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'
                            } bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded`}
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
                        Click to upload product videos
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

        <RestrictionCard
          subscription={subscription?.subscription}
          requiredFeature="upload_products"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setProductTitle('');
              setProductDesc('');
              setProductPrice('');
              setProductMadeInRwanda(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium ${darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              } transition`}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={subscription?.subscription?.status !== 'active' || isUploading}
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
              'Upload Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
