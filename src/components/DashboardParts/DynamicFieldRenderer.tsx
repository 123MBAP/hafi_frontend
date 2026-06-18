/**
 * DYNAMIC FIELD RENDERER
 * Renders form fields dynamically based on service field definitions
 */

import React from 'react';

interface FieldDefinition {
    id: number;
    field_key: string;
    field_label: string;
    field_description?: string;
    input_type: 'text' | 'number' | 'select' | 'multi_select' | 'boolean' | 'range' | 'geo_location' | 'date' | 'email' | 'url';
    is_required: boolean;
    options?: string[] | { value: string; label: string }[];
    validation_rules?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
    };
    default_value?: any;
}

interface DynamicFieldRendererProps {
    field: FieldDefinition;
    value: any;
    onChange: (fieldKey: string, value: any) => void;
    error?: string;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
    field,
    value,
    onChange,
    error
}) => {
    const handleChange = (newValue: any) => {
        onChange(field.field_key, newValue);
    };

    const renderField = () => {
        switch (field.input_type) {
            case 'text':
            case 'email':
            case 'url':
                return (
                    <input
                        type={field.input_type}
                        id={field.field_key}
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        required={field.is_required}
                        minLength={field.validation_rules?.minLength}
                        maxLength={field.validation_rules?.maxLength}
                        pattern={field.validation_rules?.pattern}
                        placeholder={`Enter ${field.field_label.toLowerCase()}`}
                        className={`w-full px-4 py-2.5 border text-sm focus:border-emerald-500 focus:outline-none transition-all ${
                            error ? 'border-red-500' : 'border-gray-250 text-gray-900 placeholder-gray-400'
                        }`}
                        style={{ borderRadius: '2px' }}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        id={field.field_key}
                        value={value || ''}
                        onChange={(e) => handleChange(parseFloat(e.target.value))}
                        required={field.is_required}
                        min={field.validation_rules?.min}
                        max={field.validation_rules?.max}
                        step="any"
                        placeholder={`Enter ${field.field_label.toLowerCase()}`}
                        className={`w-full px-4 py-2.5 border text-sm focus:border-emerald-500 focus:outline-none transition-all ${
                            error ? 'border-red-500' : 'border-gray-250 text-gray-900 placeholder-gray-400'
                        }`}
                        style={{ borderRadius: '2px' }}
                    />
                );

            case 'select':
                return (
                    <select
                        id={field.field_key}
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        required={field.is_required}
                        className={`w-full px-4 py-2.5 border text-sm focus:border-emerald-500 focus:outline-none transition-all ${
                            error ? 'border-red-500' : 'border-gray-250 text-gray-900'
                        }`}
                        style={{ borderRadius: '2px' }}
                    >
                        <option value="">Select {field.field_label}</option>
                        {field.options?.map((option, index) => {
                            const optionValue = typeof option === 'string' ? option : option.value;
                            const optionLabel = typeof option === 'string' ? option : option.label;

                            return (
                                <option key={index} value={optionValue}>
                                    {optionLabel}
                                </option>
                            );
                        })}
                    </select>
                );

            case 'multi_select':
                const currentValues = Array.isArray(value) ? value : [];

                return (
                    <div className="space-y-2">
                        {field.options?.map((option, index) => {
                            const optionValue = typeof option === 'string' ? option : option.value;
                            const optionLabel = typeof option === 'string' ? option : option.label;
                            const isChecked = currentValues.includes(optionValue);

                            return (
                                <label key={index} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                handleChange([...currentValues, optionValue]);
                                            } else {
                                                handleChange(currentValues.filter((v: string) => v !== optionValue));
                                            }
                                        }}
                                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                                        style={{ borderRadius: '2px' }}
                                    />
                                    <span className="text-gray-750 text-sm">{optionLabel}</span>
                                </label>
                            );
                        })}
                    </div>
                );

            case 'boolean':
                return (
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name={field.field_key}
                                checked={value === true}
                                onChange={() => handleChange(true)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-gray-755 text-sm">Yes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name={field.field_key}
                                checked={value === false}
                                onChange={() => handleChange(false)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-gray-755 text-sm">No</span>
                        </label>
                    </div>
                );

            case 'range':
                const rangeValue = value || { min: '', max: '' };

                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-500">Minimum</label>
                            <input
                                type="number"
                                value={rangeValue.min || ''}
                                onChange={(e) =>
                                    handleChange({ ...rangeValue, min: parseFloat(e.target.value) || null })
                                }
                                placeholder="Min"
                                className="w-full px-4 py-2 border border-gray-250 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none transition-all"
                                style={{ borderRadius: '2px' }}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-500">Maximum</label>
                            <input
                                type="number"
                                value={rangeValue.max || ''}
                                onChange={(e) =>
                                    handleChange({ ...rangeValue, max: parseFloat(e.target.value) || null })
                                }
                                placeholder="Max"
                                className="w-full px-4 py-2 border border-gray-250 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none transition-all"
                                style={{ borderRadius: '2px' }}
                            />
                        </div>
                    </div>
                );

            case 'geo_location':
                const geoValue = value || { lat: '', lng: '' };

                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-500">Latitude</label>
                            <input
                                type="number"
                                value={geoValue.lat || ''}
                                onChange={(e) =>
                                    handleChange({ ...geoValue, lat: parseFloat(e.target.value) || null })
                                }
                                placeholder="-1.9403"
                                step="any"
                                className="w-full px-4 py-2 border border-gray-250 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none transition-all"
                                style={{ borderRadius: '2px' }}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-500">Longitude</label>
                            <input
                                type="number"
                                value={geoValue.lng || ''}
                                onChange={(e) =>
                                    handleChange({ ...geoValue, lng: parseFloat(e.target.value) || null })
                                }
                                placeholder="29.8739"
                                step="any"
                                className="w-full px-4 py-2 border border-gray-250 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none transition-all"
                                style={{ borderRadius: '2px' }}
                            />
                        </div>
                    </div>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        id={field.field_key}
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        required={field.is_required}
                        className={`w-full px-4 py-2 border text-sm focus:border-emerald-500 focus:outline-none transition-all ${
                            error ? 'border-red-500' : 'border-gray-250 text-gray-900'
                        }`}
                        style={{ borderRadius: '2px' }}
                    />
                );

            default:
                return (
                    <div className="text-red-550 text-sm font-semibold">
                        Unsupported field type: {field.input_type}
                    </div>
                );
        }
    };

    return (
        <div className="mb-6">
            <label htmlFor={field.field_key} className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-650">
                {field.field_label}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.field_description && (
                <p className="text-xs text-gray-400 mb-2">{field.field_description}</p>
            )}

            {renderField()}

            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};

export default DynamicFieldRenderer;
