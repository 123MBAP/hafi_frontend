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
  productViews: File[][];
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
  uploadProgress?: number | null;
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
  uploadProgress,
}: Props) {
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
        <h3 className={`text-base font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Upload Product
        </h3>
      </div>

      <form
        onSubmit={handleProductUpload}
        className={`p-6 ${darkMode ? 'bg-gray-800/40' : 'bg-gray-50/50'}`}
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Product Title
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className={`w-full p-2.5 border text-sm ${darkMode
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                  : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                style={{ borderRadius: '2px' }}
                placeholder="PRODUCT NAME"
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Description
              </label>
              <textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                className={`w-full p-2.5 border text-sm ${darkMode
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                  : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                style={{ borderRadius: '2px' }}
                rows={3}
                placeholder="WRITE ABOUT THE PRODUCT..."
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Price (RWF)
              </label>
              <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className={`w-full p-2.5 border text-sm ${darkMode
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                  : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                  } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                style={{ borderRadius: '2px' }}
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
                className="mr-2 text-emerald-600 focus:ring-emerald-500"
                style={{ borderRadius: '2px' }}
              />
              <label
                htmlFor="made-in-rwanda"
                className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}
              >
                Made in Rwanda 🇷🇼
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
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Main Product Images
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
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-450' : 'text-gray-500'}`}>
                        Click to upload main images
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {productImages.map((img, idx) => (
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
                            className="w-16 h-16 object-cover border"
                            style={{ borderColor: darkMode ? '#374151' : '#E5E7EB', borderRadius: '2px' }}
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
                          Click to upload images for {img.name}
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            ))}

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Product Videos
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
                          className={`text-[10px] font-bold uppercase tracking-wider truncate ${darkMode ? 'text-red-400' : 'text-red-650'
                            } bg-red-500/10 px-2 py-1 border border-red-500/25`}
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
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-450' : 'text-gray-500'}`}>
                        Click to upload product videos
                      </p>
                      <p
                        className={`text-[9px] font-bold uppercase tracking-wider text-center mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}
                      >
                        Supported: MP4, MOV, AVI (Max 3GB per video)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-4'>
            <RestrictionCard
          subscription={subscription?.subscription}
          requiredFeature="upload_products"
        />
        {uploadProgress !== null && uploadProgress !== undefined && (
          <div className="w-full mb-4 px-6 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                {uploadProgress < 100 
                  ? "Uploading Product Files..." 
                  : "Processing and optimizing media on Cloudinary..."}
              </span>
              <span className="text-emerald-500 font-bold">{uploadProgress}%</span>
            </div>
            <div className={`w-full h-1.5 ${darkMode ? 'bg-gray-900' : 'bg-gray-200'} overflow-hidden`} style={{ borderRadius: '1px' }}>
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
         </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setProductTitle('');
              setProductDesc('');
              setProductPrice('');
              setProductMadeInRwanda(false);
            }}
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
            disabled={subscription?.subscription?.status !== 'active' || isUploading}
            className={`px-6 py-2 font-semibold text-xs transition-colors uppercase tracking-wider
              ${subscription?.subscription?.status === 'active'
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
              'Upload Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
