import React from "react";
import { useState } from "react";

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
  return (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
     <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Price per Hour (RWF)</label>
      <input
        type="number"
        value={featureData.pricePerHour ?? ""}
        onChange={(e) =>
          setFeatureData({ pricePerHour: parseFloat(e.target.value) })
        }
        className="w-full border px-3 py-2 rounded-md"
      />
    </div>

    <div>
     <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Price per Day (RWF)</label>
                
      <input
        type="number"
        value={featureData.pricePerDay ?? ""}
        onChange={(e) =>
          setFeatureData({ pricePerDay: parseFloat(e.target.value) })
        }
        className="w-full border px-3 py-2 rounded-md"
      />
    </div>

    <div>
     <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Discount (%)</label>
      <input
        type="number"
        value={featureData.discount ?? ""}
        onChange={(e) =>
          setFeatureData({ discount: parseFloat(e.target.value) })
        }
        className="w-full border px-3 py-2 rounded-md"
      />
    </div>

    <div>
     <label className={`block mb-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>With Driver Cost (RWF)</label>
      <input
        type="number"
        value={featureData.withDriverCost ?? ""}
        onChange={(e) =>
          setFeatureData({ withDriverCost: parseFloat(e.target.value) })
        }
        className="w-full border px-3 py-2 rounded-md"
      />
    </div>
  </div>
);

};

export default ServiceFeaturesFields;
