import RwandaLocationSelector from '@/components/RwandaLocationSelector';
import { FeatureField, ObjectFeature, ServiceFeature, SimpleFeature } from '@/types/features';

type Props = {
    feature: ServiceFeature;
    values: any;
    onChange: (featureName: string, value: any) => void;
    darkMode: boolean;
};


export default function FeatureFieldRenderer({ feature, values, onChange, darkMode }: Props) {
    // Handle SimpleFeature - just a single text input
    if (feature.type === 'simple') {
        const simpleFeature = feature as SimpleFeature;
        return (
            <div>
                <label
                    className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                    {simpleFeature.name}
                </label>
                <input
                    type="text"
                    value={values?.[simpleFeature.name] ?? ''}
                    onChange={(e) => onChange(simpleFeature.name, e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode
                        ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                        : 'bg-white border-gray-300 focus:border-blue-400'
                        } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-blue-200'
                        } transition`}
                    placeholder={`Enter ${simpleFeature.name.toLowerCase()}`}
                />
            </div>
        );
    }

    // Handle ObjectFeature - render fields based on schema
    const objectFeature = feature as ObjectFeature;
    const featureValues = values[objectFeature.name] || {};

    const handleNestedChange = (fieldName: string, value: any) => {
        onChange(objectFeature.name, {
            ...featureValues,
            [fieldName]: value,
        });
    };

    const renderField = (fieldName: string, fieldConfig: FeatureField) => {
        const fieldValue = featureValues?.[fieldName] ?? '';

        // Handle location type - use RwandaLocationSelector
        if (fieldConfig.type === 'location') {
            return (
                <div key={fieldName}>
                    <label
                        className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                    >
                        {fieldConfig.label}
                        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <RwandaLocationSelector
                        level={fieldName as any}
                        value={fieldValue}
                        onChange={(value) => handleNestedChange(fieldName, value)}
                        parentValues={featureValues}
                        darkMode={darkMode}
                    />
                </div>
            );
        }

        // Handle select type
        if (fieldConfig.type === 'select' && fieldConfig.options) {
            return (
                <div key={fieldName}>
                    <label
                        className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                    >
                        {fieldConfig.label}
                        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                        value={fieldValue}
                        onChange={(e) => handleNestedChange(fieldName, e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border ${darkMode
                            ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                            : 'bg-white border-gray-300 focus:border-blue-400'
                            } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-blue-200'
                            } transition`}
                    >
                        <option value="">{fieldConfig.placeholder || 'Select...'}</option>
                        {fieldConfig.options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        // Handle multiselect type
        if (fieldConfig.type === 'multiselect' && fieldConfig.options) {
            // If requiresValue is true, fieldValue should be an object like: { "bedroom": "4", "parking": "2" }
            // If requiresValue is false, fieldValue should be an array like: ["bedroom", "parking"]
            const requiresValue = fieldConfig.requiresValue || false;

            if (requiresValue) {
                // Value-based multiselect (e.g., "4 bedrooms", "2 parking spaces")
                const selectedValues = typeof fieldValue === 'object' && !Array.isArray(fieldValue) ? fieldValue : {};

                const toggleOption = (option: string) => {
                    const newValues = { ...selectedValues };
                    if (newValues[option] !== undefined) {
                        delete newValues[option];
                    } else {
                        newValues[option] = ''; // Initialize with empty string
                    }
                    handleNestedChange(fieldName, newValues);
                };

                const updateValue = (option: string, value: string) => {
                    const newValues = { ...selectedValues, [option]: value };
                    handleNestedChange(fieldName, newValues);
                };

                return (
                    <div key={fieldName}>
                        <label
                            className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}
                        >
                            {fieldConfig.label}
                            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className={`space-y-2 p-3 rounded-lg border ${darkMode
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-gray-50 border-gray-300'
                            }`}>
                            {fieldConfig.options.map((option) => {
                                const isSelected = selectedValues[option] !== undefined;
                                return (
                                    <div key={option} className="space-y-1">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`${objectFeature.name}-${fieldName}-${option}`}
                                                checked={isSelected}
                                                onChange={() => toggleOption(option)}
                                                className={`mr-2 h-4 w-4 rounded ${darkMode
                                                    ? 'bg-gray-600 border-gray-500 text-teal-500 focus:ring-teal-500'
                                                    : 'border-gray-300 text-blue-600 focus:ring-blue-500'
                                                    }`}
                                            />
                                            <label
                                                htmlFor={`${objectFeature.name}-${fieldName}-${option}`}
                                                className={`text-sm cursor-pointer flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}
                                            >
                                                {option}
                                            </label>
                                        </div>
                                        {isSelected && (
                                            <div className="ml-6">
                                                <input
                                                    type="text"
                                                    value={selectedValues[option] || ''}
                                                    onChange={(e) => updateValue(option, e.target.value)}
                                                    placeholder={`Enter value (e.g., 4)`}
                                                    className={`w-full px-3 py-1.5 text-sm rounded-lg border ${darkMode
                                                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-teal-500'
                                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                                                        } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-blue-200'
                                                        } transition`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {Object.keys(selectedValues).length > 0 && (
                            <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Selected: {Object.entries(selectedValues).map(([key, value]) =>
                                    value ? `${value} ${key}` : key
                                ).join(', ')}
                            </p>
                        )}
                    </div>
                );
            } else {
                // Simple selection multiselect (just checkboxes, no values)
                const selectedValues = Array.isArray(fieldValue) ? fieldValue : [];

                const toggleOption = (option: string) => {
                    const newValues = selectedValues.includes(option)
                        ? selectedValues.filter(v => v !== option)
                        : [...selectedValues, option];
                    handleNestedChange(fieldName, newValues);
                };

                return (
                    <div key={fieldName}>
                        <label
                            className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}
                        >
                            {fieldConfig.label}
                            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className={`space-y-2 p-3 rounded-lg border ${darkMode
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-gray-50 border-gray-300'
                            }`}>
                            {fieldConfig.options.map((option) => (
                                <div key={option} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`${objectFeature.name}-${fieldName}-${option}`}
                                        checked={selectedValues.includes(option)}
                                        onChange={() => toggleOption(option)}
                                        className={`mr-2 h-4 w-4 rounded ${darkMode
                                            ? 'bg-gray-600 border-gray-500 text-teal-500 focus:ring-teal-500'
                                            : 'border-gray-300 text-blue-600 focus:ring-blue-500'
                                            }`}
                                    />
                                    <label
                                        htmlFor={`${objectFeature.name}-${fieldName}-${option}`}
                                        className={`text-sm cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                    >
                                        {option}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {selectedValues.length > 0 && (
                            <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Selected: {selectedValues.join(', ')}
                            </p>
                        )}
                    </div>
                );
            }
        }

        // Handle boolean type
        if (fieldConfig.type === 'boolean') {
            return (
                <div key={fieldName} className="flex items-center">
                    <input
                        type="checkbox"
                        id={`${objectFeature.name}-${fieldName}`}
                        checked={fieldValue === true || fieldValue === 'true'}
                        onChange={(e) => handleNestedChange(fieldName, e.target.checked)}
                        className="mr-2 h-4 w-4 rounded"
                    />
                    <label
                        htmlFor={`${objectFeature.name}-${fieldName}`}
                        className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                        {fieldConfig.label}
                        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                </div>
            );
        }

        // Handle number type
        if (fieldConfig.type === 'number') {
            return (
                <div key={fieldName}>
                    <label
                        className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                    >
                        {fieldConfig.label}
                        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                        type="number"
                        value={fieldValue}
                        onChange={(e) => handleNestedChange(fieldName, e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border ${darkMode
                            ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                            : 'bg-white border-gray-300 focus:border-blue-400'
                            } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-blue-200'
                            } transition`}
                        placeholder={fieldConfig.placeholder}
                    />
                </div>
            );
        }

        // Default to text input
        return (
            <div key={fieldName}>
                <label
                    className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                >
                    {fieldConfig.label}
                    {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => handleNestedChange(fieldName, e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode
                        ? 'bg-gray-700 border-gray-600 focus:border-teal-500 text-white'
                        : 'bg-white border-gray-300 focus:border-blue-400'
                        } focus:ring-2 ${darkMode ? 'focus:ring-teal-500/30' : 'focus:ring-blue-200'
                        } transition`}
                    placeholder={fieldConfig.placeholder}
                />
            </div>
        );
    };

    // Check if feature contains location fields (province, district, sector, cell, village)
    const hasLocationFields = Object.keys(objectFeature.schema).some(key =>
        ['province', 'district', 'sector', 'cell', 'village'].includes(key.toLowerCase())
    );

    // If this feature contains location fields, render them hierarchically
    if (hasLocationFields) {
        const locationLevels = ['province', 'district', 'sector', 'cell', 'village'];
        const locationFields = Object.entries(objectFeature.schema)
            .filter(([fieldName]) => locationLevels.includes(fieldName.toLowerCase()))
            .sort(([a], [b]) => {
                const indexA = locationLevels.indexOf(a.toLowerCase());
                const indexB = locationLevels.indexOf(b.toLowerCase());
                return indexA - indexB;
            });

        const nonLocationFields = Object.entries(objectFeature.schema)
            .filter(([fieldName]) => !locationLevels.includes(fieldName.toLowerCase()));

        return (
            <>
                {/* Render location fields hierarchically */}
                {locationFields.map(([fieldName, fieldConfig]) => (
                    <div key={fieldName}>
                        <label
                            className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                            {fieldConfig.label}
                            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <RwandaLocationSelector
                            level={fieldName as any}
                            value={featureValues?.[fieldName] ?? ''}
                            onChange={(value) => handleNestedChange(fieldName, value)}
                            parentValues={featureValues}
                            darkMode={darkMode}
                        />
                    </div>
                ))}
                {/* Render non-location fields */}
                {nonLocationFields.map(([fieldName, fieldConfig]) =>
                    renderField(fieldName, fieldConfig)
                )}
            </>
        );
    }

    // Default rendering for non-location features
    return (
        <>
            {Object.entries(objectFeature.schema).map(([fieldName, fieldConfig]) =>
                renderField(fieldName, fieldConfig)
            )}
        </>
    );
}
