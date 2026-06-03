import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { FEATURE_TEMPLATES, ObjectFeature, ServiceFeature, SimpleFeature } from '../types/features';

interface NestedFeatureBuilderProps {
    features: ServiceFeature[];
    onChange: (features: ServiceFeature[]) => void;
    darkMode?: boolean;
}

export default function NestedFeatureBuilder({ features, onChange, darkMode }: NestedFeatureBuilderProps) {
    const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());
    const [draftSubFieldKeys, setDraftSubFieldKeys] = useState<Record<string, string>>({});

    const normalizeKey = (value: string): string =>
        value
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');

    const draftKeyId = (featureIndex: number, fieldKey: string) => `${featureIndex}:${fieldKey}`;

    const getUniqueKey = (feature: ObjectFeature, baseKey: string, oldKey: string): string => {
        if (!baseKey) return '';
        if (baseKey === oldKey) return baseKey;
        if (!Object.prototype.hasOwnProperty.call(feature.schema, baseKey)) return baseKey;

        let i = 2;
        while (Object.prototype.hasOwnProperty.call(feature.schema, `${baseKey}_${i}`)) i += 1;
        return `${baseKey}_${i}`;
    };

    const addSimpleFeature = () => {
        const newFeature: SimpleFeature = {
            type: 'simple',
            name: '',
            value: ''
        };
        onChange([...features, newFeature]);
    };

    const addTemplateFeature = (templateKey: keyof typeof FEATURE_TEMPLATES) => {
        const template = { ...FEATURE_TEMPLATES[templateKey] };
        onChange([...features, template]);
        // Auto-expand the newly added feature
        setExpandedFeatures(new Set([...expandedFeatures, features.length]));
    };

    const addCustomObjectFeature = () => {
        const newFeature: ObjectFeature = {
            type: 'object',
            name: '',
            schema: {}
        };
        onChange([...features, newFeature]);
        setExpandedFeatures(new Set([...expandedFeatures, features.length]));
    };

    const removeFeature = (index: number) => {
        const newFeatures = features.filter((_, i) => i !== index);
        onChange(newFeatures);
        // Remove from expanded set
        const newExpanded = new Set(expandedFeatures);
        newExpanded.delete(index);
        setExpandedFeatures(newExpanded);
    };

    const updateSimpleFeature = (index: number, field: keyof SimpleFeature, value: string) => {
        const newFeatures = [...features];
        const feature = newFeatures[index] as SimpleFeature;
        (feature as any)[field] = value;
        onChange(newFeatures);
    };

    const updateObjectFeatureName = (index: number, name: string) => {
        const newFeatures = [...features];
        const feature = newFeatures[index] as ObjectFeature;
        feature.name = name;
        onChange(newFeatures);
    };

    const addSubField = (featureIndex: number) => {
        const newFeatures = [...features];
        const feature = newFeatures[featureIndex] as ObjectFeature;
        const fieldKey = `field_${Object.keys(feature.schema).length + 1}`;
        feature.schema[fieldKey] = {
            type: 'text',
            label: '',
            required: false
        };
        onChange(newFeatures);
    };

    const updateSubField = (featureIndex: number, fieldKey: string, updates: Partial<any>) => {
        const newFeatures = [...features];
        const feature = newFeatures[featureIndex] as ObjectFeature;
        feature.schema[fieldKey] = { ...feature.schema[fieldKey], ...updates };
        onChange(newFeatures);
    };

    const renameSubFieldKey = (featureIndex: number, oldKey: string, newKey: string) => {
        if (oldKey === newKey) return;
        const newFeatures = [...features];
        const feature = newFeatures[featureIndex] as ObjectFeature;
        const fieldConfig = feature.schema[oldKey];
        delete feature.schema[oldKey];
        feature.schema[newKey] = fieldConfig;
        onChange(newFeatures);
    };

    const removeSubField = (featureIndex: number, fieldKey: string) => {
        const newFeatures = [...features];
        const feature = newFeatures[featureIndex] as ObjectFeature;
        delete feature.schema[fieldKey];
        onChange(newFeatures);
    };

    const toggleExpanded = (index: number) => {
        const newExpanded = new Set(expandedFeatures);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedFeatures(newExpanded);
    };

    return (
        <div className={`space-y-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {/* Feature List */}
            {features.length > 0 && (
                <div className="space-y-3">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`rounded-xl border-2 overflow-hidden transition-all ${darkMode
                                ? 'bg-gray-700 border-gray-600'
                                : 'bg-white border-blue-200'
                                }`}
                        >
                            {/* Feature Header */}
                            <div className="flex items-center gap-3 p-4">
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-400 w-8">
                                    {index + 1}.
                                </span>

                                {feature.type === 'simple' ? (
                                    // Simple Feature Input
                                    <input
                                        type="text"
                                        value={feature.name}
                                        onChange={(e) => updateSimpleFeature(index, 'name', e.target.value)}
                                        placeholder="Feature name (e.g., 24/7 Support)"
                                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${darkMode
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-gray-50 border-gray-300'
                                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                ) : (
                                    // Object Feature Header
                                    <>
                                        <input
                                            type="text"
                                            value={feature.name}
                                            onChange={(e) => updateObjectFeatureName(index, e.target.value)}
                                            placeholder="Feature name (e.g., Location)"
                                            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${darkMode
                                                ? 'bg-gray-800 border-gray-600 text-white'
                                                : 'bg-gray-50 border-gray-300'
                                                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleExpanded(index)}
                                            className={`p-2 rounded-lg transition-colors ${darkMode
                                                ? 'hover:bg-gray-600'
                                                : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            {expandedFeatures.has(index) ? (
                                                <ChevronUp className="w-5 h-5" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5" />
                                            )}
                                        </button>
                                    </>
                                )}

                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${feature.type === 'simple'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                        }`}
                                >
                                    {feature.type === 'simple' ? 'Simple' : 'Object'}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Object Feature Schema (Expanded) */}
                            {feature.type === 'object' && expandedFeatures.has(index) && (
                                <div className={`px-4 pb-4 border-t-2 pt-4 ${darkMode ? 'border-gray-600 bg-gray-750' : 'border-blue-100 bg-blue-50'
                                    }`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                            Sub-fields ({Object.keys(feature.schema).length})
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => addSubField(index)}
                                            className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Sub-field
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {Object.entries(feature.schema).map(([fieldKey, fieldConfig]) => (
                                            <div
                                                key={fieldKey}
                                                className={`p-4 rounded-lg border-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                                                        Sub-field
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubField(index, fieldKey)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 p-1 rounded transition"
                                                        title="Remove sub-field"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {/* Field Key */}
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                            Field Key (e.g., listing_type)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={draftSubFieldKeys[draftKeyId(index, fieldKey)] ?? fieldKey}
                                                            onChange={(e) => {
                                                                const id = draftKeyId(index, fieldKey);
                                                                setDraftSubFieldKeys(prev => ({ ...prev, [id]: e.target.value }));
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.currentTarget.blur();
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                const id = draftKeyId(index, fieldKey);
                                                                const raw = e.target.value;
                                                                const normalized = normalizeKey(raw);

                                                                // If empty, just reset the draft to the existing key.
                                                                if (!normalized) {
                                                                    setDraftSubFieldKeys(prev => {
                                                                        const next = { ...prev };
                                                                        delete next[id];
                                                                        return next;
                                                                    });
                                                                    return;
                                                                }

                                                                const currentFeature = features[index] as ObjectFeature;
                                                                const uniqueKey = getUniqueKey(currentFeature, normalized, fieldKey);

                                                                setDraftSubFieldKeys(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[id];
                                                                    return next;
                                                                });

                                                                if (uniqueKey !== fieldKey) {
                                                                    renameSubFieldKey(index, fieldKey, uniqueKey);
                                                                }
                                                            }}
                                                            className={`w-full px-3 py-2 text-sm border-2 rounded-lg ${darkMode
                                                                ? 'bg-gray-900 border-gray-600 text-white'
                                                                : 'bg-gray-50 border-gray-300 text-gray-900'
                                                                } focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                                                        />
                                                    </div>

                                                    {/* Field Label */}
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                            Field Label (User-friendly name)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={fieldConfig.label}
                                                            onChange={(e) => updateSubField(index, fieldKey, { label: e.target.value })}
                                                            placeholder="e.g., Listing Type, Number of Bedrooms"
                                                            className={`w-full px-3 py-2 text-sm border-2 rounded-lg ${darkMode
                                                                ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                                } focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                                                        />
                                                    </div>

                                                    {/* Field Type */}
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                            Input Type
                                                        </label>
                                                        <select
                                                            value={fieldConfig.type}
                                                            onChange={(e) => updateSubField(index, fieldKey, { type: e.target.value })}
                                                            className={`w-full px-3 py-2 text-sm border-2 rounded-lg ${darkMode
                                                                ? 'bg-gray-900 border-gray-600 text-white'
                                                                : 'bg-white border-gray-300 text-gray-900'
                                                                } focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="number">Number</option>
                                                            <option value="select">Select (Dropdown)</option>
                                                            <option value="multiselect">Multi-Select</option>
                                                            <option value="boolean">Yes/No (Boolean)</option>
                                                            <option value="textarea">Text Area</option>
                                                            <option value="date">Date</option>
                                                            <option value="email">Email</option>
                                                            <option value="url">URL</option>
                                                        </select>
                                                    </div>

                                                    {/* Options for select/multiselect */}
                                                    {(fieldConfig.type === 'select' || fieldConfig.type === 'multiselect') && (
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                    Options
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentOptions = fieldConfig.options || [];
                                                                        updateSubField(index, fieldKey, { options: [...currentOptions, ''] });
                                                                    }}
                                                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition flex items-center gap-1"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    Add Option
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {(fieldConfig.options || []).map((option, optionIndex) => (
                                                                    <div key={optionIndex} className="flex items-center gap-2">
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 w-16">
                                                                            Option {optionIndex + 1}
                                                                        </span>
                                                                        <input
                                                                            type="text"
                                                                            value={option}
                                                                            onChange={(e) => {
                                                                                const newOptions = [...(fieldConfig.options || [])];
                                                                                newOptions[optionIndex] = e.target.value;
                                                                                updateSubField(index, fieldKey, { options: newOptions });
                                                                            }}
                                                                            placeholder="e.g., Rent"
                                                                            className={`flex-1 px-3 py-1.5 text-sm border-2 rounded-lg ${darkMode
                                                                                ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                                                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                                                } focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newOptions = (fieldConfig.options || []).filter((_, i) => i !== optionIndex);
                                                                                updateSubField(index, fieldKey, { options: newOptions });
                                                                            }}
                                                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded transition"
                                                                            title="Remove option"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {(!fieldConfig.options || fieldConfig.options.length === 0) && (
                                                                    <div className={`text-center py-3 rounded border-2 border-dashed ${darkMode ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'
                                                                        }`}>
                                                                        <p className="text-xs">No options added yet. Click "Add Option" to start.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Requires Value option for multiselect */}
                                                    {fieldConfig.type === 'multiselect' && (
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={fieldConfig.requiresValue || false}
                                                                onChange={(e) => updateSubField(index, fieldKey, { requiresValue: e.target.checked })}
                                                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                            />
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Require values for selections
                                                                </span>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    If checked, users must provide a value/quantity for each selected option (e.g., "4 bedrooms"). Otherwise, just selection is enough.
                                                                </p>
                                                            </div>
                                                        </label>
                                                    )}

                                                    {/* Required Checkbox */}
                                                    <label className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={fieldConfig.required || false}
                                                            onChange={(e) => updateSubField(index, fieldKey, { required: e.target.checked })}
                                                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Required field
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}

                                        {Object.keys(feature.schema).length === 0 && (
                                            <div className={`text-center py-6 rounded-lg border-2 border-dashed ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
                                                }`}>
                                                <p className="text-sm font-medium">No sub-fields defined yet</p>
                                                <p className="text-xs mt-1">Click "Add Sub-field" to create fields</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Feature Buttons */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="flex-1 border-t-2 border-gray-300 dark:border-gray-600"></div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Add Feature</span>
                    <div className="flex-1 border-t-2 border-gray-300 dark:border-gray-600"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Simple Feature Button */}
                    <button
                        type="button"
                        onClick={addSimpleFeature}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Simple Feature</span>
                    </button>

                    {/* Custom Object Feature Button */}
                    <button
                        type="button"
                        onClick={addCustomObjectFeature}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Custom Object</span>
                    </button>
                </div>

                {/* Template Buttons */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Or use a template:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => addTemplateFeature('location')}
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${darkMode
                                ? 'border-blue-600 text-blue-400 hover:bg-blue-900'
                                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                                }`}
                        >
                            📍 Location
                        </button>
                        <button
                            type="button"
                            onClick={() => addTemplateFeature('contact')}
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${darkMode
                                ? 'border-green-600 text-green-400 hover:bg-green-900'
                                : 'border-green-300 text-green-700 hover:bg-green-50'
                                }`}
                        >
                            📞 Contact
                        </button>
                        <button
                            type="button"
                            onClick={() => addTemplateFeature('pricing')}
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${darkMode
                                ? 'border-yellow-600 text-yellow-400 hover:bg-yellow-900'
                                : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                                }`}
                        >
                            💰 Pricing
                        </button>
                    </div>
                </div>
            </div>

            {features.length === 0 && (
                <div className={`text-center py-8 rounded-xl border-2 border-dashed ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
                    }`}>
                    <p className="text-sm">No features added yet. Click a button above to add your first feature.</p>
                </div>
            )}
        </div>
    );
}
