import React from "react";

interface ServiceFeaturesFieldsProps {
  featureData: {
    pricePerHour?: number;
    pricePerDay?: number;
    discount?: number;
    withDriverCost?: number;
  };
  setFeatureData: (data: Partial<ServiceFeaturesFieldsProps["featureData"]>) => void;
  darkMode: boolean;
}

const ServiceFeaturesFields: React.FC<ServiceFeaturesFieldsProps> = ({ featureData, setFeatureData, darkMode }) => {
  const inputCls = `w-full p-2.5 border text-sm ${
    darkMode
      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550 focus:ring-1 focus:ring-emerald-500 focus:outline-none'
      : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none'
  }`;

  const labelCls = `block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
    darkMode ? "text-gray-300" : "text-gray-600"
  }`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>Price per Hour (RWF)</label>
        <input
          type="number"
          value={featureData.pricePerHour ?? ""}
          onChange={(e) =>
            setFeatureData({ pricePerHour: parseFloat(e.target.value) || 0 })
          }
          className={inputCls}
          style={{ borderRadius: '2px' }}
          placeholder="0"
        />
      </div>

      <div>
        <label className={labelCls}>Price per Day (RWF)</label>
        <input
          type="number"
          value={featureData.pricePerDay ?? ""}
          onChange={(e) =>
            setFeatureData({ pricePerDay: parseFloat(e.target.value) || 0 })
          }
          className={inputCls}
          style={{ borderRadius: '2px' }}
          placeholder="0"
        />
      </div>

      <div>
        <label className={labelCls}>Discount (%)</label>
        <input
          type="number"
          value={featureData.discount ?? ""}
          onChange={(e) =>
            setFeatureData({ discount: parseFloat(e.target.value) || 0 })
          }
          className={inputCls}
          style={{ borderRadius: '2px' }}
          placeholder="0"
        />
      </div>

      <div>
        <label className={labelCls}>With Driver Cost (RWF)</label>
        <input
          type="number"
          value={featureData.withDriverCost ?? ""}
          onChange={(e) =>
            setFeatureData({ withDriverCost: parseFloat(e.target.value) || 0 })
          }
          className={inputCls}
          style={{ borderRadius: '2px' }}
          placeholder="0"
        />
      </div>
    </div>
  );
};

export default ServiceFeaturesFields;
