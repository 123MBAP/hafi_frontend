/**
 * DYNAMIC LISTING FORM
 * Form component for creating/editing listings with dynamic fields
 */

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Service {
    id: number;
    name: string;
    slug: string;
    has_specific_features: boolean;
    supports_products: boolean;
    supports_services: boolean;
}

interface FieldDefinition {
    id: number;
    field_key: string;
    field_label: string;
    field_description?: string;
    input_type: "number" | "boolean" | "text" | "select" | "date" | "email" | "range" | "url" | "multi_select" | "geo_location";
    is_required: boolean;
    usage_context: string;
    options?: any[];
    validation_rules?: any;
    default_value?: any;
}

interface ServiceSchema {
    service: Service;
    fields: FieldDefinition[];
}

interface DynamicListingFormProps {
    serviceId?: number;
    listingId?: number; // For editing existing listing
    onSuccess?: (listing: any) => void;
    onCancel?: () => void;
}

export const DynamicListingForm: React.FC<DynamicListingFormProps> = ({
    serviceId: initialServiceId,
    listingId,
    onSuccess,
    onCancel
}) => {
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(initialServiceId || null);
    const [serviceSchema, setServiceSchema] = useState<ServiceSchema | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Core listing fields
    const [coreFields, setCoreFields] = useState({
        title: '',
        description: '',
        listing_type: 'product',
        price: '',
        currency: 'RWF',
        price_type: 'fixed',
        location_province: '',
        location_district: '',
        location_sector: '',
        location_cell: '',
        location_village: ''
    });

    // Dynamic field values
    const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});

    // Images
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

    // Load services on mount
    useEffect(() => {
        loadServices();
    }, []);

    // Load service schema when service is selected
    useEffect(() => {
        if (selectedServiceId) {
            loadServiceSchema(selectedServiceId);
        }
    }, [selectedServiceId]);

    // Load existing listing if editing
    useEffect(() => {
        if (listingId) {
            loadListing(listingId);
        }
    }, [listingId]);

    const loadServices = async () => {
        try {
            const response = await axios.get('/api/services?active_only=true');
            setServices(response.data.services);
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };

    const loadServiceSchema = async (serviceId: number) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/services/${serviceId}/schema`);
            setServiceSchema(response.data.schema);

            // Initialize dynamic fields with default values
            const initialDynamicFields: Record<string, any> = {};
            response.data.schema.fields.forEach((field: FieldDefinition) => {
                if (field.default_value) {
                    initialDynamicFields[field.field_key] = field.default_value;
                }
            });
            setDynamicFields(initialDynamicFields);
        } catch (error) {
            console.error('Error loading service schema:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadListing = async (id: number) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/listings/${id}`);
            const listing = response.data.listing;

            // Populate core fields
            setCoreFields({
                title: listing.title || '',
                description: listing.description || '',
                listing_type: listing.listing_type || 'product',
                price: listing.price || '',
                currency: listing.currency || 'RWF',
                price_type: listing.price_type || 'fixed',
                location_province: listing.location_province || '',
                location_district: listing.location_district || '',
                location_sector: listing.location_sector || '',
                location_cell: listing.location_cell || '',
                location_village: listing.location_village || ''
            });

            // Populate dynamic fields
            if (listing.dynamic_fields) {
                const dynamicFieldValues: Record<string, any> = {};
                Object.entries(listing.dynamic_fields).forEach(([key, fieldData]: [string, any]) => {
                    dynamicFieldValues[key] = fieldData.value;
                });
                setDynamicFields(dynamicFieldValues);
            }

            setSelectedServiceId(listing.service_id);
        } catch (error) {
            console.error('Error loading listing:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCoreFieldChange = (field: string, value: any) => {
        setCoreFields(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleDynamicFieldChange = (fieldKey: string, value: any) => {
        setDynamicFields(prev => ({ ...prev, [fieldKey]: value }));
        // Clear error for this field
        if (errors[fieldKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldKey];
                return newErrors;
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(prev => [...prev, ...filesArray]);

            // Create preview URLs
            const previewUrls = filesArray.map(file => URL.createObjectURL(file));
            setImagePreviewUrls(prev => [...prev, ...previewUrls]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate core fields
        if (!coreFields.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!selectedServiceId) {
            newErrors.service_id = 'Please select a service';
        }

        // Validate dynamic fields
        if (serviceSchema?.service.has_specific_features) {
            serviceSchema.fields.forEach(field => {
                if (field.is_required) {
                    const value = dynamicFields[field.field_key];

                    if (value === undefined || value === null || value === '') {
                        newErrors[field.field_key] = `${field.field_label} is required`;
                    } else if (field.input_type === 'multi_select' && Array.isArray(value) && value.length === 0) {
                        newErrors[field.field_key] = `${field.field_label} requires at least one selection`;
                    }
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();

            // Append core fields
            formData.append('service_id', selectedServiceId!.toString());
            formData.append('title', coreFields.title);
            formData.append('description', coreFields.description);
            formData.append('listing_type', coreFields.listing_type);
            if (coreFields.price) formData.append('price', coreFields.price);
            formData.append('currency', coreFields.currency);
            formData.append('price_type', coreFields.price_type);
            if (coreFields.location_province) formData.append('location_province', coreFields.location_province);
            if (coreFields.location_district) formData.append('location_district', coreFields.location_district);
            if (coreFields.location_sector) formData.append('location_sector', coreFields.location_sector);
            if (coreFields.location_cell) formData.append('location_cell', coreFields.location_cell);
            if (coreFields.location_village) formData.append('location_village', coreFields.location_village);

            // Append dynamic fields as JSON
            if (serviceSchema?.service.has_specific_features) {
                formData.append('dynamic_fields', JSON.stringify(dynamicFields));
            }

            // Append images
            images.forEach(image => {
                formData.append('images', image);
            });

            let response;
            if (listingId) {
                // Update existing listing
                response = await axios.put(`/api/listings/${listingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Create new listing
                response = await axios.post('/api/listings', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (onSuccess) {
                onSuccess(response.data.listing);
            }
        } catch (error: any) {
            console.error('Error submitting listing:', error);

            if (error.response?.data?.validation_errors) {
                const validationErrors: Record<string, string> = {};
                error.response.data.validation_errors.forEach((err: any) => {
                    validationErrors[err.field] = err.message;
                });
                setErrors(validationErrors);
            } else {
                alert(error.response?.data?.error || 'Failed to submit listing');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner variant="dots" size="md" message="Loading schema..." />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white border border-gray-250 p-8 shadow-sm" style={{ borderRadius: '2px' }}>
            <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900 mb-6">
                {listingId ? 'Edit Listing' : 'Create New Listing'}
            </h2>

            {/* Service Selection */}
            {!initialServiceId && (
                <div className="mb-6">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-650">
                        Service Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedServiceId || ''}
                        onChange={(e) => setSelectedServiceId(parseInt(e.target.value))}
                        className={`w-full px-4 py-2.5 border text-sm focus:border-emerald-500 focus:outline-none transition-all ${
                            errors.service_id ? 'border-red-500 text-red-700' : 'border-gray-250 text-gray-900'
                        }`}
                        style={{ borderRadius: '2px' }}
                    >
                        <option value="">Select a service</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name}
                            </option>
                        ))}
                    </select>
                    {errors.service_id && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.service_id}</p>}
                </div>
            )}

            {/* Listing Type */}
            {serviceSchema && (
                <div className="mb-6">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-650">
                        Listing Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                        {serviceSchema.service.supports_products && (
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="listing_type"
                                    value="product"
                                    checked={coreFields.listing_type === 'product'}
                                    onChange={(e) => handleCoreFieldChange('listing_type', e.target.value)}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                                />
                                <span className="text-gray-705 text-sm font-medium">Product</span>
                            </label>
                        )}
                        {serviceSchema.service.supports_services && (
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="listing_type"
                                    value="service"
                                    checked={coreFields.listing_type === 'service'}
                                    onChange={(e) => handleCoreFieldChange('listing_type', e.target.value)}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                                />
                                <span className="text-gray-705 text-sm font-medium">Service</span>
                            </label>
                        )}
                    </div>
                </div>
            )}

            {/* Core Fields */}
            <div className="mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-650">
                    Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={coreFields.title}
                    onChange={(e) => handleCoreFieldChange('title', e.target.value)}
                    placeholder="Enter listing title"
                    className={`w-full px-4 py-2.5 border text-sm focus:border-emerald-500 focus:outline-none transition-all ${
                        errors.title ? 'border-red-500 text-red-700 placeholder-red-300' : 'border-gray-250 text-gray-900 placeholder-gray-400'
                    }`}
                    style={{ borderRadius: '2px' }}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.title}</p>}
            </div>

            <div className="mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-650">
                    Description
                </label>
                <textarea
                    value={coreFields.description}
                    onChange={(e) => handleCoreFieldChange('description', e.target.value)}
                    placeholder="Describe your listing"
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-250 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-all"
                    style={{ borderRadius: '2px' }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-650">Price</label>
                    <input
                        type="number"
                        value={coreFields.price}
                        onChange={(e) => handleCoreFieldChange('price', e.target.value)}
                        placeholder="0"
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-250 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-all"
                        style={{ borderRadius: '2px' }}
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-650">Currency</label>
                    <select
                        value={coreFields.currency}
                        onChange={(e) => handleCoreFieldChange('currency', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-250 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none transition-all"
                        style={{ borderRadius: '2px' }}
                    >
                        <option value="RWF">RWF</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-650">Price Type</label>
                    <select
                        value={coreFields.price_type}
                        onChange={(e) => handleCoreFieldChange('price_type', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-250 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none transition-all"
                        style={{ borderRadius: '2px' }}
                    >
                        <option value="fixed">Fixed</option>
                        <option value="negotiable">Negotiable</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="per_session">Per Session</option>
                    </select>
                </div>
            </div>

            {/* Location Fields */}
            <div className="mb-6 border-t border-gray-150 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-850 mb-3">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-505">Province</label>
                        <input
                            type="text"
                            value={coreFields.location_province}
                            onChange={(e) => handleCoreFieldChange('location_province', e.target.value)}
                            placeholder="e.g., Kigali City"
                            className="w-full px-4 py-2 border border-gray-250 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-all"
                            style={{ borderRadius: '2px' }}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-505">District</label>
                        <input
                            type="text"
                            value={coreFields.location_district}
                            onChange={(e) => handleCoreFieldChange('location_district', e.target.value)}
                            placeholder="e.g., Gasabo"
                            className="w-full px-4 py-2 border border-gray-250 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-all"
                            style={{ borderRadius: '2px' }}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-505">Sector</label>
                        <input
                            type="text"
                            value={coreFields.location_sector}
                            onChange={(e) => handleCoreFieldChange('location_sector', e.target.value)}
                            placeholder="e.g., Remera"
                            className="w-full px-4 py-2 border border-gray-250 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-all"
                            style={{ borderRadius: '2px' }}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-505">Cell</label>
                        <input
                            type="text"
                            value={coreFields.location_cell}
                            onChange={(e) => handleCoreFieldChange('location_cell', e.target.value)}
                            placeholder="e.g., Rukiri I"
                            className="w-full px-4 py-2 border border-gray-250 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-all"
                            style={{ borderRadius: '2px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Dynamic Fields */}
            {serviceSchema?.service.has_specific_features && serviceSchema.fields.length > 0 && (
                <div className="mb-6 border-t border-gray-150 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-850 mb-3">
                        {serviceSchema.service.name} Specific Fields
                    </h3>
                    <div className="space-y-4">
                        {serviceSchema.fields.map(field => (
                            <DynamicFieldRenderer
                                key={field.id}
                                field={field}
                                value={dynamicFields[field.field_key]}
                                onChange={handleDynamicFieldChange}
                                error={errors[field.field_key]}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Image Upload */}
            <div className="mb-6 border-t border-gray-150 pt-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-650">Images</label>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border border-gray-250 text-sm focus:border-emerald-500 focus:outline-none transition-all"
                    style={{ borderRadius: '2px' }}
                />

                {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                        {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover border border-gray-200"
                                    style={{ borderRadius: '2px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 hover:bg-red-600 transition-colors shadow-sm"
                                    style={{ borderRadius: '2px' }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 border-t border-gray-150 pt-6">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 border border-gray-250 text-gray-755 font-bold uppercase text-xs tracking-wider hover:bg-gray-50 transition-colors"
                        style={{ borderRadius: '2px' }}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-emerald-500 text-white font-bold uppercase text-xs tracking-wider hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: '2px' }}
                >
                    {submitting ? 'Submitting...' : (listingId ? 'Update Listing' : 'Create Listing')}
                </button>
            </div>
        </form>
    );
};

export default DynamicListingForm;
