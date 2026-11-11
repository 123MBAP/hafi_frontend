import React from 'react';
import RwandaLocationSelector from '@/components/RwandaLocationSelector';

type RealEstateValues = Record<string, any>;

type Props = {
  darkMode: boolean;
  values: RealEstateValues;
  onChange: (keyOrObj: string | Record<string, any>, value?: any) => void;
};

const PROPERTY_CATEGORIES = [
  'Land (Ikibanza)',
  'Commercial building',
  'Residential house',
  'Apartment',
];

const AMENITIES = [
  'Kitchen',
  'Parking',
  'Swimming pool',
  'Garden',
  'Balcony',
  'Water',
  'Electricity',
  'Internet',
  'Security',
  'Fenced',
  'Air conditioning',
];

export default function RealEstateFields({ darkMode, values, onChange }: Props) {
  const inputCls = `w-full p-2.5 border rounded-lg text-sm ${
    darkMode
      ? 'bg-zinc-950 border-zinc-800 text-white placeholder-gray-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
  } focus:ring-1 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all`;
  const labelCls = `block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
    darkMode ? 'text-gray-300' : 'text-gray-600'
  }`;
  const sectionCls = `p-5 border rounded-xl transition-all ${
    darkMode ? 'border-zinc-800 bg-zinc-950/40' : 'border-gray-200 bg-gray-50/70'
  }`;
  const titleCls = `text-xs font-bold uppercase tracking-wider text-brand-red mb-3 flex items-center gap-2`;

  const category = values.property_category || '';
  const set = (keyOrObj: string | Record<string, any>, val?: any) => {
    if (typeof keyOrObj === 'object' && keyOrObj !== null) {
      onChange(keyOrObj);
    } else {
      onChange(keyOrObj, val);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const selected: string[] = Array.isArray(values.amenities) ? values.amenities : [];
    set(
      'amenities',
      selected.includes(amenity)
        ? selected.filter((a) => a !== amenity)
        : [...selected, amenity]
    );
  };

  const toggleUtility = (utility: string) => {
    const selected: string[] = Array.isArray(values.utilities_available) ? values.utilities_available : [];
    set(
      'utilities_available',
      selected.includes(utility)
        ? selected.filter((u) => u !== utility)
        : [...selected, utility]
    );
  };

  return (
    <div className="md:col-span-2 space-y-5 border-t border-gray-200 dark:border-zinc-800 pt-6">
      {/* ── Section 1: Common fields ── */}
      <div className={sectionCls}>
        <h4 className={titleCls}>Property Details</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Property Category *</label>
            <select
              className={inputCls}
              value={category}
              onChange={(e) => set('property_category', e.target.value)}
            >
              <option value="">Select category</option>
              {PROPERTY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Listing Type *</label>
            <select
              className={inputCls}
              value={values.listing_type || ''}
              onChange={(e) => set('listing_type', e.target.value)}
            >
              <option value="">Select listing type</option>
              <option value="For sale">For Sale</option>
              <option value="For rent">For Rent</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Price (RWF) *</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={values.price || ''}
              onChange={(e) => set('price', e.target.value)}
              placeholder="e.g. 50000000"
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Location (Rwanda) ── */}
      <div className={sectionCls}>
        <h4 className={titleCls}>Property Location (Rwanda)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className={labelCls}>Province</label>
            <RwandaLocationSelector
              level="province"
              value={values.province || ''}
              onChange={(val) => {
                set({
                  province: val,
                  district: '',
                  sector: '',
                  cell: '',
                  village: '',
                });
              }}
              darkMode={darkMode}
            />
          </div>
          <div>
            <label className={labelCls}>District</label>
            <RwandaLocationSelector
              level="district"
              value={values.district || ''}
              parentValues={{ province: values.province }}
              onChange={(val) => {
                set({
                  district: val,
                  sector: '',
                  cell: '',
                  village: '',
                });
              }}
              darkMode={darkMode}
            />
          </div>
          <div>
            <label className={labelCls}>Sector</label>
            <RwandaLocationSelector
              level="sector"
              value={values.sector || ''}
              parentValues={{ district: values.district }}
              onChange={(val) => {
                set({
                  sector: val,
                  cell: '',
                  village: '',
                });
              }}
              darkMode={darkMode}
            />
          </div>
          <div>
            <label className={labelCls}>Cell</label>
            <RwandaLocationSelector
              level="cell"
              value={values.cell || ''}
              parentValues={{ sector: values.sector }}
              onChange={(val) => {
                set({
                  cell: val,
                  village: '',
                });
              }}
              darkMode={darkMode}
            />
          </div>
          <div>
            <label className={labelCls}>Village</label>
            <RwandaLocationSelector
              level="village"
              value={values.village || ''}
              parentValues={{ cell: values.cell }}
              onChange={(val) => {
                set('village', val);
              }}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Category-specific fields ── */}
      {category === 'Land (Ikibanza)' && (
        <div className={sectionCls}>
          <h4 className={titleCls}>Land Details</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Land size (m²)</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.land_size_sqm ?? ''}
                onChange={(e) => set('land_size_sqm', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label className={labelCls}>Land use</label>
              <select
                className={inputCls}
                value={values.land_use || ''}
                onChange={(e) => set('land_use', e.target.value)}
              >
                <option value="">Select</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Agricultural">Agricultural</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Road access</label>
              <select
                className={inputCls}
                value={values.road_access == null ? '' : String(values.road_access)}
                onChange={(e) => set('road_access', e.target.value === '' ? null : e.target.value === 'true')}
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className={labelCls}>Utilities available</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {['Water', 'Electricity'].map((util) => {
                const selected: string[] = Array.isArray(values.utilities_available) ? values.utilities_available : [];
                const isSelected = selected.includes(util);
                return (
                  <label key={util} className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUtility(util)}
                      className="accent-brand-red rounded text-brand-red focus:ring-brand-red"
                    />
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{util}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {category === 'Commercial building' && (
        <div className={sectionCls}>
          <h4 className={titleCls}>Commercial Building Details</h4>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Building area (m²)</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.building_area_sqm ?? ''}
                onChange={(e) => set('building_area_sqm', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 300"
              />
            </div>
            <div>
              <label className={labelCls}>Number of floors</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.number_of_floors ?? ''}
                onChange={(e) => set('number_of_floors', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 3"
              />
            </div>
            <div>
              <label className={labelCls}>Rooms or offices</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.rooms_or_offices ?? ''}
                onChange={(e) => set('rooms_or_offices', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className={labelCls}>Parking</label>
              <select
                className={inputCls}
                value={values.parking == null ? '' : String(values.parking)}
                onChange={(e) => set('parking', e.target.value === '' ? null : e.target.value === 'true')}
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {category === 'Residential house' && (
        <div className={sectionCls}>
          <h4 className={titleCls}>Residential House Details</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Number of bedrooms</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.bedrooms ?? ''}
                onChange={(e) => set('bedrooms', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 3"
              />
            </div>
            <div>
              <label className={labelCls}>Number of bathrooms</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.bathrooms ?? ''}
                onChange={(e) => set('bathrooms', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 2"
              />
            </div>
            <div>
              <label className={labelCls}>Kitchen</label>
              <select
                className={inputCls}
                value={values.kitchen == null ? '' : String(values.kitchen)}
                onChange={(e) => set('kitchen', e.target.value === '' ? null : e.target.value === 'true')}
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Parking</label>
              <select
                className={inputCls}
                value={values.parking == null ? '' : String(values.parking)}
                onChange={(e) => set('parking', e.target.value === '' ? null : e.target.value === 'true')}
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Garden / Swimming pool</label>
              <select
                className={inputCls}
                value={values.garden_swimming_pool == null ? '' : String(values.garden_swimming_pool)}
                onChange={(e) => set('garden_swimming_pool', e.target.value === '' ? null : e.target.value === 'true')}
              >
                <option value="">Select (optional)</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {category === 'Apartment' && (
        <div className={sectionCls}>
          <h4 className={titleCls}>Apartment Details</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Number of bedrooms</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.bedrooms ?? ''}
                onChange={(e) => set('bedrooms', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 2"
              />
            </div>
            <div>
              <label className={labelCls}>Number of bathrooms</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.bathrooms ?? ''}
                onChange={(e) => set('bathrooms', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className={labelCls}>Floor area (m²)</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.floor_area_sqm ?? ''}
                onChange={(e) => set('floor_area_sqm', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 80"
              />
            </div>
            <div>
              <label className={labelCls}>Floor number</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={values.floor_number ?? ''}
                onChange={(e) => set('floor_number', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 3"
              />
            </div>
            <div>
              <label className={labelCls}>Furnished</label>
              <select
                className={inputCls}
                value={values.furnished == null ? '' : String(values.furnished)}
                onChange={(e) => set('furnished', e.target.value === '' ? null : e.target.value === 'true')}
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Parking</label>
              <select
                className={inputCls}
                value={values.parking == null ? '' : String(values.parking)}
                onChange={(e) => set('parking', e.target.value === '' ? null : e.target.value === 'true')}
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 4: Amenities ── */}
      <div className={sectionCls}>
        <h4 className={titleCls}>Amenities — select all that apply</h4>
        <div className="flex flex-wrap gap-2.5">
          {AMENITIES.map((amenity) => {
            const selected: string[] = Array.isArray(values.amenities) ? values.amenities : [];
            const isChecked = selected.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  isChecked
                    ? 'bg-brand-red text-white border-brand-red shadow-sm'
                    : darkMode
                    ? 'bg-zinc-900 text-gray-300 border-zinc-800 hover:border-brand-red/60'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-red/60'
                }`}
              >
                {isChecked ? '✓ ' : ''}{amenity}
              </button>
            );
          })}
        </div>
        {Array.isArray(values.amenities) && values.amenities.length > 0 && (
          <p className="mt-2.5 text-xs font-medium text-brand-red">
            {values.amenities.length} selected: {values.amenities.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
