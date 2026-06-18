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
                            className={`border transition-all ${darkMode
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-250'
                                }`}
                            style={{ borderRadius: '2px' }}
                        >
                            {/* Feature Header */}
                            <div className="flex items-center gap-3 p-4">
                                <span className="text-sm font-bold text-emerald-500 w-8">
                                    {index + 1}.
                                </span>

                                {feature.type === 'simple' ? (
                                    // Simple Feature Input
                                    <input
                                        type="text"
                                        value={feature.name}
                                        onChange={(e) => updateSimpleFeature(index, 'name', e.target.value)}
                                        placeholder="Feature name (e.g., 24/7 Support)"
                                        className={`flex-1 px-4 py-2 border transition-all ${darkMode
                                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                                            : 'bg-gray-50 border-gray-300 text-gray-950 placeholder-gray-400'
                                            } focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                                        style={{ borderRadius: '2px' }}
                                    />
                                ) : (
                                    // Object Feature Header
                                    <>
                                        <input
                                            type="text"
                                            value={feature.name}
                                            onChange={(e) => updateObjectFeatureName(index, e.target.value)}
                                            placeholder="Feature name (e.g., Location)"
                                            className={`flex-1 px-4 py-2 border transition-all ${darkMode
                                                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                                                : 'bg-gray-50 border-gray-300 text-gray-950 placeholder-gray-400'
                                                } focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                                            style={{ borderRadius: '2px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleExpanded(index)}
                                            className={`p-2 transition-colors ${darkMode
                                                ? 'hover:bg-gray-700 text-gray-350'
                                                : 'hover:bg-gray-100 text-gray-650'
                                                }`}
                                            style={{ borderRadius: '2px' }}
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
                                    className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${feature.type === 'simple'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450'
                                        : 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                                        }`}
                                    style={{ borderRadius: '2px' }}
                                >
                                    {feature.type === 'simple' ? 'Simple' : 'Object'}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 transition-colors"
                                    style={{ borderRadius: '2px' }}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Object Feature Schema (Expanded) */}
                            {feature.type === 'object' && expandedFeatures.has(index) && (
                                <div className={`px-4 pb-4 border-t pt-4 ${darkMode ? 'border-gray-750 bg-gray-750' : 'border-gray-200 bg-gray-50/50'
                                    }`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-455">
                                            Sub-fields ({Object.keys(feature.schema).length})
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => addSubField(index)}
                                            className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition flex items-center gap-1"
                                            style={{ borderRadius: '2px' }}
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Sub-field
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {Object.entries(feature.schema).map(([fieldKey, fieldConfig]) => (
                                            <div
                                                key={fieldKey}
                                                className={`p-4 border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                                                    }`}
                                                style={{ borderRadius: '2px' }}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-550 dark:text-gray-405 bg-gray-100 dark:bg-gray-800 px-2 py-1" style={{ borderRadius: '2px' }}>
                                                         Sub-field
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubField(index, fieldKey)}
                                                        className="text-red-505 hover:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20 p-1 transition"
                                                        style={{ borderRadius: '2px' }}
                                                        title="Remove sub-field"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {/* Field Key */}
                                                    <div>
                                                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-gray-500 dark:text-gray-400">
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
                                                            className={`w-full px-3 py-2 text-sm border ${darkMode
                                                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600'
                                                                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                                                                } focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                                                            style={{ borderRadius: '2px' }}
                                                        />
                                                    </div>

                                                    {/* Field Label */}
                                                    <div>
                                                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-gray-500 dark:text-gray-400">
                                                            Field Label (User-friendly name)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={fieldConfig.label}
                                                            onChange={(e) => updateSubField(index, fieldKey, { label: e.target.value })}
                                                            placeholder="e.g., Listing Type, Number of Bedrooms"
                                                            className={`w-full px-3 py-2 text-sm border ${darkMode
                                                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600'
                                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                                } focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                                                            style={{ borderRadius: '2px' }}
                                                        />
                                                    </div>

                                                    {/* Field Type */}
                                                    <div>
                                                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-gray-500 dark:text-gray-400">
                                                            Input Type
                                                        </label>
                                                        <select
                                                            value={fieldConfig.type}
                                                            onChange={(e) => updateSubField(index, fieldKey, { type: e.target.value })}
                                                            className={`w-full px-3 py-2 text-sm border ${darkMode
                                                                ? 'bg-gray-800 border-gray-700 text-white'
                                                                : 'bg-white border-gray-300 text-gray-900'
                                                                } focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                                                            style={{ borderRadius: '2px' }}
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
                                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 dark:text-gray-405">
                                                                    Options
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentOptions = fieldConfig.options || [];
                                                                        updateSubField(index, fieldKey, { options: [...currentOptions, ''] });
                                                                    }}
                                                                    className="px-2 py-1 bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition flex items-center gap-1"
                                                                    style={{ borderRadius: '2px' }}
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    Add Option
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {(fieldConfig.options || []).map((option, optionIndex) => (
                                                                    <div key={optionIndex} className="flex items-center gap-2">
                                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 w-16 uppercase tracking-wider font-semibold">
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
                                                                            className={`flex-1 px-3 py-1.5 text-sm border ${darkMode
                                                                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600'
                                                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                                                } focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                                                                            style={{ borderRadius: '2px' }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newOptions = (fieldConfig.options || []).filter((_, i) => i !== optionIndex);
                                                                                updateSubField(index, fieldKey, { options: newOptions });
                                                                            }}
                                                                            className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition"
                                                                            style={{ borderRadius: '2px' }}
                                                                            title="Remove option"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {(!fieldConfig.options || fieldConfig.options.length === 0) && (
                                                                    <div className={`text-center py-3 border border-dashed ${darkMode ? 'border-gray-700 text-gray-550 bg-gray-900' : 'border-gray-300 text-gray-500 bg-gray-50'}`} style={{ borderRadius: '2px' }}>
                                                                        <p className="text-xs">No options added yet. Click "Add Option" to start.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Requires Value option for multiselect */}
                                                    {fieldConfig.type === 'multiselect' && (
                                                        <label className="flex items-start space-x-2.5 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={fieldConfig.requiresValue || false}
                                                                onChange={(e) => updateSubField(index, fieldKey, { requiresValue: e.target.checked })}
                                                                className="w-4 h-4 text-emerald-500 border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 focus:ring-emerald-500 focus:ring-2 mt-0.5"
                                                                style={{ borderRadius: '2px' }}
                                                            />
                                                            <div>
                                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-750 dark:text-gray-300">
                                                                    Require values for selections
                                                                </span>
                                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                                                    If checked, users must provide a value/quantity for each selected option (e.g., "4 bedrooms"). Otherwise, just selection is enough.
                                                                </p>
                                                            </div>
                                                        </label>
                                                    )}

                                                    {/* Required Checkbox */}
                                                    <label className="flex items-center space-x-2.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={fieldConfig.required || false}
                                                            onChange={(e) => updateSubField(index, fieldKey, { required: e.target.checked })}
                                                            className="w-4 h-4 text-emerald-500 border-gray-300 dark:border-gray-755 bg-white dark:bg-gray-800 focus:ring-emerald-500 focus:ring-2"
                                                            style={{ borderRadius: '2px' }}
                                                        />
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-755 dark:text-gray-300">
                                                            Required field
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}

                                        {Object.keys(feature.schema).length === 0 && (
                                            <div className={`text-center py-6 border border-dashed ${darkMode ? 'border-gray-700 text-gray-400 bg-gray-850' : 'border-gray-300 text-gray-500 bg-gray-50'}`} style={{ borderRadius: '2px' }}>
                                                <p className="text-sm font-semibold uppercase tracking-wider">No sub-fields defined yet</p>
                                                <p className="text-xs mt-1 text-gray-500 dark:text-gray-405">Click "Add Sub-field" to create fields</p>
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
                    <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-550 dark:text-gray-405 px-3">Add Feature</span>
                    <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Simple Feature Button */}
                    <button
                        type="button"
                        onClick={addSimpleFeature}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 border border-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all uppercase tracking-wider"
                        style={{ borderRadius: '2px' }}
                    >
                        <Plus className="w-5 h-5" />
                        <span>Simple Feature</span>
                    </button>

                    {/* Custom Object Feature Button */}
                    <button
                        type="button"
                        onClick={addCustomObjectFeature}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-transparent border border-emerald-500 text-emerald-600 dark:text-emerald-450 font-semibold hover:bg-emerald-500/10 transition-all uppercase tracking-wider"
                        style={{ borderRadius: '2px' }}
                    >
                        <Plus className="w-5 h-5" />
                        <span>Custom Object</span>
                    </button>
                </div>

                {/* Template Buttons */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Or use a template:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => addTemplateFeature('location')}
                            className={`px-4 py-2 border font-semibold uppercase tracking-wider transition-all ${darkMode
                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            style={{ borderRadius: '2px' }}
                        >
                            📍 Location
                        </button>
                        <button
                            type="button"
                            onClick={() => addTemplateFeature('contact')}
                            className={`px-4 py-2 border font-semibold uppercase tracking-wider transition-all ${darkMode
                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            style={{ borderRadius: '2px' }}
                        >
                            📞 Contact
                        </button>
                        <button
                            type="button"
                            onClick={() => addTemplateFeature('pricing')}
                            className={`px-4 py-2 border font-semibold uppercase tracking-wider transition-all ${darkMode
                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            style={{ borderRadius: '2px' }}
                        >
                            💰 Pricing
                        </button>
                    </div>
                </div>
            </div>

            {features.length === 0 && (
                <div className={`text-center py-8 border border-dashed ${darkMode ? 'border-gray-700 text-gray-450 bg-gray-805' : 'border-gray-300 text-gray-500 bg-gray-50'}`} style={{ borderRadius: '2px' }}>
                    <p className="text-sm">No features added yet. Click a button above to add your first feature.</p>
                </div>
            )}
        </div>
    );
}
