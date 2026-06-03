/**
 * ADMIN SERVICE MANAGER
 * Component for admins to create/edit services and manage field definitions
 */

import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface Service {
    id: number;
    name: string;
    slug: string;
    description?: string;
    has_specific_features: boolean;
    supports_products: boolean;
    supports_services: boolean;
    is_active: boolean;
}

interface FieldDefinition {
    id?: number;
    field_key: string;
    field_label: string;
    field_description?: string;
    input_type: string;
    is_required: boolean;
    usage_context: string;
    options?: any[];
    validation_rules?: any;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const AdminServiceManager: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [fields, setFields] = useState<FieldDefinition[]>([]);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [showFieldForm, setShowFieldForm] = useState(false);
    const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New service inline fields (for creating fields during service creation)
    const [newServiceFields, setNewServiceFields] = useState<Array<{
        field_label: string;
        input_type: string;
        is_required: boolean;
        usage_context: string;
        options: string[];
        tempId: string;
    }>>([]);

    // Service form state
    const [serviceForm, setServiceForm] = useState({
        name: '',
        slug: '',
        description: '',
        has_specific_features: false,
        supports_products: true,
        supports_services: true
    });

    // Field form state
    const [fieldForm, setFieldForm] = useState<FieldDefinition>({
        field_key: '',
        field_label: '',
        field_description: '',
        input_type: 'text',
        is_required: false,
        usage_context: 'both',
        options: [],
        validation_rules: {}
    });

    useEffect(() => {
        loadServices();
    }, []);

    useEffect(() => {
        if (selectedService) {
            loadFields(selectedService.id);
        }
    }, [selectedService]);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE}/api/dynamic-services`);
            const servicesData = response.data.services || response.data || [];
            // Ensure we always set an array
            setServices(Array.isArray(servicesData) ? servicesData : []);
        } catch (error) {
            console.error('Error loading services:', error);
            setError('Failed to load services. Please try again.');
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const loadFields = async (serviceId: number) => {
        try {
            console.log('Loading fields for service:', serviceId);
            const response = await axios.get(`${API_BASE}/api/dynamic-services/${serviceId}/fields`);
            console.log('Fields response:', response.data);
            const fieldsData = response.data.fields || response.data || [];
            setFields(Array.isArray(fieldsData) ? fieldsData : []);
            console.log('Fields loaded:', fieldsData);
        } catch (error) {
            console.error('Error loading fields:', error);
            setFields([]);
        }
    };

    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let response;
            if (selectedService) {
                // Update existing service
                response = await axios.put(`${API_BASE}/api/dynamic-services/${selectedService.id}`, serviceForm);
                alert('Service updated successfully!');
                // Reload services and fields
                await loadServices();
                if (selectedService.id) {
                    await loadFields(selectedService.id);
                }
            } else {
                // Create new service
                console.log('Creating service with data:', serviceForm);
                response = await axios.post(`${API_BASE}/api/dynamic-services`, serviceForm);
                console.log('Service creation response:', response.data);
                const newService = response.data.service;

                console.log('New service created:', newService);
                console.log('has_specific_features:', newService.has_specific_features);

                // Create inline defined fields if any
                if (serviceForm.has_specific_features && newServiceFields.length > 0) {
                    for (const field of newServiceFields) {
                        const fieldData = {
                            field_key: field.field_label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
                            field_label: field.field_label,
                            field_description: '',
                            input_type: field.input_type,
                            is_required: field.is_required,
                            usage_context: field.usage_context,
                            options: field.options
                        };

                        try {
                            await axios.post(`${API_BASE}/api/dynamic-services/${newService.id}/fields`, fieldData);
                        } catch (error) {
                            console.error(`Failed to create field ${field.field_label}:`, error);
                        }
                    }
                }

                // Show success message with guidance
                if (serviceForm.has_specific_features) {
                    alert(`Service "${newService.name}" created successfully with ${newServiceFields.length} fields! You can add more fields or edit existing ones.`);
                } else {
                    alert(`Service "${newService.name}" created successfully!`);
                }

                // Reload services list
                await loadServices();

                // Auto-select the newly created service and load its fields
                console.log('Setting selected service to:', newService);
                setSelectedService(newService);
                await loadFields(newService.id);
            }

            setShowServiceForm(false);
            resetServiceForm();
            setNewServiceFields([]);
        } catch (error: any) {
            console.error('Service submit error:', error);
            alert(error.response?.data?.error || 'Failed to save service');
        }
    };

    const handleFieldSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedService) {
            alert('Please select a service first');
            return;
        }

        try {
            // Generate field_key from label if not set
            if (!fieldForm.field_key) {
                fieldForm.field_key = fieldForm.field_label
                    .toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');
            }

            if (editingField?.id) {
                // Update existing field
                await axios.put(`${API_BASE}/api/dynamic-services/${selectedService.id}/fields/${editingField.id}`,
                    fieldForm
                );
            } else {
                // Create new field
                await axios.post(`${API_BASE}/api/dynamic-services/${selectedService.id}/fields`, fieldForm);
            }

            setShowFieldForm(false);
            setEditingField(null);
            loadFields(selectedService.id);
            resetFieldForm();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save field');
        }
    };

    const handleDeleteService = async (serviceId: number) => {
        if (!confirm('Are you sure you want to delete this service?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE}/api/dynamic-services/${serviceId}`);
            loadServices();
            setSelectedService(null);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to delete service');
        }
    };

    const handleDeleteField = async (fieldId: number) => {
        if (!selectedService || !confirm('Are you sure you want to delete this field?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE}/api/dynamic-services/${selectedService.id}/fields/${fieldId}`);
            loadFields(selectedService.id);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to delete field');
        }
    };

    const editService = (service: Service) => {
        setSelectedService(service);
        setServiceForm({
            name: service.name,
            slug: service.slug,
            description: service.description || '',
            has_specific_features: service.has_specific_features,
            supports_products: service.supports_products,
            supports_services: service.supports_services
        });
        setShowServiceForm(true);
    };

    const editField = (field: FieldDefinition) => {
        setEditingField(field);
        setFieldForm(field);
        setShowFieldForm(true);
    };

    const resetServiceForm = () => {
        setServiceForm({
            name: '',
            slug: '',
            description: '',
            has_specific_features: false,
            supports_products: true,
            supports_services: true
        });
        setSelectedService(null);
    };

    const resetFieldForm = () => {
        setFieldForm({
            field_key: '',
            field_label: '',
            field_description: '',
            input_type: 'text',
            is_required: false,
            usage_context: 'both',
            options: [],
            validation_rules: {}
        });
    };

    const addOption = () => {
        setFieldForm(prev => ({
            ...prev,
            options: [...(prev.options || []), '']
        }));
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...(fieldForm.options || [])];
        newOptions[index] = value;
        setFieldForm(prev => ({ ...prev, options: newOptions }));
    };

    const removeOption = (index: number) => {
        setFieldForm(prev => ({
            ...prev,
            options: (prev.options || []).filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Service Manager</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Services List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Services</h2>
                            <button
                                onClick={() => {
                                    resetServiceForm();
                                    setShowServiceForm(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            >
                                + New Service
                            </button>
                        </div>

                        <div className="space-y-2">
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">
                                    Loading services...
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <p className="text-red-600 mb-2">{error}</p>
                                    <button
                                        onClick={loadServices}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : services && services.length > 0 ? (
                                services.map(service => (
                                    <div
                                        key={service.id}
                                        className={`p-3 rounded-lg cursor-pointer transition ${selectedService?.id === service.id
                                            ? 'bg-blue-100 border-2 border-blue-500'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                        onClick={() => setSelectedService(service)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{service.name}</h3>
                                                <p className="text-sm text-gray-600">{service.slug}</p>
                                                {service.has_specific_features && (
                                                    <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                                        Custom Fields
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        editService(service);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteService(service.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No services found. Create your first service to get started.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Field Definitions */}
                <div className="lg:col-span-2">
                    {selectedService ? (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {selectedService.name} - Field Definitions
                                </h2>
                                {selectedService.has_specific_features && (
                                    <button
                                        onClick={() => {
                                            resetFieldForm();
                                            setEditingField(null);
                                            setShowFieldForm(true);
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                    >
                                        + Add Field
                                    </button>
                                )}
                            </div>

                            {!selectedService.has_specific_features ? (
                                <div className="text-center py-12 text-gray-600 bg-gray-50 rounded-lg">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="font-medium">Dynamic fields are not enabled for this service.</p>
                                    <p className="text-sm mt-2">Edit the service and enable "Dynamic Fields" to add custom fields.</p>
                                </div>
                            ) : fields.length === 0 ? (
                                <div className="text-center py-12 bg-blue-50 rounded-lg border-2 border-blue-200">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <p className="font-medium text-gray-800 mb-2">No custom fields defined yet</p>
                                    <p className="text-sm text-gray-600 mb-4">Click "Add Field" above to create your first custom field for this service</p>
                                    <button
                                        onClick={() => {
                                            resetFieldForm();
                                            setEditingField(null);
                                            setShowFieldForm(true);
                                        }}
                                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Your First Field
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {fields && fields.length > 0 ? fields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h3 className="font-semibold text-gray-800">{field.field_label}</h3>
                                                        {field.is_required && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                                                Required
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                                            {field.input_type}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                                            {field.usage_context}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">Key: {field.field_key}</p>
                                                    {field.field_description && (
                                                        <p className="text-sm text-gray-600 mt-1">{field.field_description}</p>
                                                    )}
                                                    {field.options && field.options.length > 0 && (
                                                        <div className="mt-2">
                                                            <span className="text-xs text-gray-500">Options: </span>
                                                            <span className="text-xs text-gray-700">
                                                                {field.options.join(', ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => editField(field)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => field.id && handleDeleteField(field.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No field definitions yet. Add your first field to get started.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="text-center py-12 text-gray-600">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-lg">Select a service to manage its fields</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Service Form Modal */}
            {showServiceForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            {selectedService ? 'Edit Service' : 'Create New Service'}
                        </h2>

                        <form onSubmit={handleServiceSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Service Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={serviceForm.name}
                                    onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Slug <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={serviceForm.slug}
                                    onChange={(e) => setServiceForm(prev => ({ ...prev, slug: e.target.value }))}
                                    required
                                    placeholder="lowercase-with-dashes"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={serviceForm.description}
                                    onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                />
                            </div>

                            <div className="mb-4 space-y-3">
                                <label className="flex items-start space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={serviceForm.has_specific_features}
                                        onChange={(e) => {
                                            setServiceForm(prev => ({ ...prev, has_specific_features: e.target.checked }));
                                            if (!e.target.checked) {
                                                setNewServiceFields([]);
                                            }
                                        }}
                                        className="w-4 h-4 mt-1 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <div>
                                        <span className="text-gray-800 font-semibold">Specific Features</span>
                                        <p className="text-sm text-gray-500 mt-0.5">Enable to define custom fields for this service type (e.g., for Real Estate: Listing Type, Bedrooms, etc.)</p>
                                    </div>
                                </label>

                                {/* Show inline field builder when specific features is enabled */}
                                {serviceForm.has_specific_features && !selectedService && (
                                    <div className="mt-3 p-5 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h4 className="text-base font-bold text-gray-800 flex items-center">
                                                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Define Custom Fields
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1 ml-7">Add fields that users will fill when uploading/listing items</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewServiceFields(prev => [...prev, {
                                                        field_label: '',
                                                        input_type: 'text',
                                                        is_required: false,
                                                        usage_context: 'both',
                                                        options: [],
                                                        tempId: Date.now().toString()
                                                    }]);
                                                }}
                                                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition flex items-center shadow-md"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add Field
                                            </button>
                                        </div>

                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {newServiceFields.map((field, index) => (
                                                <div key={field.tempId} className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="text-sm font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded">Field {index + 1}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setNewServiceFields(prev => prev.filter(f => f.tempId !== field.tempId));
                                                            }}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition"
                                                            title="Remove field"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Field Name</label>
                                                            <input
                                                                type="text"
                                                                value={field.field_label}
                                                                onChange={(e) => {
                                                                    setNewServiceFields(prev => prev.map(f =>
                                                                        f.tempId === field.tempId ? { ...f, field_label: e.target.value } : f
                                                                    ));
                                                                }}
                                                                placeholder="e.g., Listing Type, Number of Bedrooms, Property Type"
                                                                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Input Type</label>
                                                                <select
                                                                    value={field.input_type}
                                                                    onChange={(e) => {
                                                                        setNewServiceFields(prev => prev.map(f =>
                                                                            f.tempId === field.tempId ? { ...f, input_type: e.target.value } : f
                                                                        ));
                                                                    }}
                                                                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                                                                >
                                                                    <option value="text">Text</option>
                                                                    <option value="number">Number</option>
                                                                    <option value="select">Select (Dropdown)</option>
                                                                    <option value="multi_select">Multi-Select</option>
                                                                    <option value="boolean">Yes/No</option>
                                                                    <option value="range">Range</option>
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Usage</label>
                                                                <select
                                                                    value={field.usage_context}
                                                                    onChange={(e) => {
                                                                        setNewServiceFields(prev => prev.map(f =>
                                                                            f.tempId === field.tempId ? { ...f, usage_context: e.target.value } : f
                                                                        ));
                                                                    }}
                                                                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                                                                >
                                                                    <option value="both">Upload & Filter</option>
                                                                    <option value="upload_only">Upload Only</option>
                                                                    <option value="filter_only">Filter Only</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {(field.input_type === 'select' || field.input_type === 'multi_select') && (
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Options (comma-separated)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={field.options.join(', ')}
                                                                    onChange={(e) => {
                                                                        const options = e.target.value.split(',').map(o => o.trim()).filter(o => o);
                                                                        setNewServiceFields(prev => prev.map(f =>
                                                                            f.tempId === field.tempId ? { ...f, options } : f
                                                                        ));
                                                                    }}
                                                                    placeholder="e.g., Rent, Sell, Lease"
                                                                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                                                                />
                                                            </div>
                                                        )}

                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.is_required}
                                                                onChange={(e) => {
                                                                    setNewServiceFields(prev => prev.map(f =>
                                                                        f.tempId === field.tempId ? { ...f, is_required: e.target.checked } : f
                                                                    ));
                                                                }}
                                                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                            />
                                                            <span className="text-sm text-gray-700 font-medium">Required field</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}

                                            {newServiceFields.length === 0 && (
                                                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <p className="text-sm font-medium">No fields defined yet</p>
                                                    <p className="text-xs mt-1">Click "Add Field" to create custom fields for this service</p>
                                                </div>
                                            )}
                                        </div>

                                        {newServiceFields.length > 0 && (
                                            <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                                                <div className="flex items-center text-sm text-purple-800">
                                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                    <span><strong>{newServiceFields.length}</strong> custom field{newServiceFields.length !== 1 ? 's' : ''} defined for this service</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={serviceForm.supports_products}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, supports_products: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Supports products</span>
                                </label>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={serviceForm.supports_services}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, supports_services: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Supports services</span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowServiceForm(false);
                                        resetServiceForm();
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {selectedService ? 'Update Service' : 'Create Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Field Form Modal */}
            {showFieldForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            {editingField ? 'Edit Field' : 'Add New Field'}
                        </h2>

                        <form onSubmit={handleFieldSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Field Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fieldForm.field_label}
                                    onChange={(e) => setFieldForm(prev => ({ ...prev, field_label: e.target.value }))}
                                    required
                                    placeholder="e.g., Hair Type, Number of Bedrooms"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Field Key (auto-generated if empty)
                                </label>
                                <input
                                    type="text"
                                    value={fieldForm.field_key}
                                    onChange={(e) => setFieldForm(prev => ({ ...prev, field_key: e.target.value }))}
                                    placeholder="hair_type, bedrooms"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={fieldForm.field_description}
                                    onChange={(e) => setFieldForm(prev => ({ ...prev, field_description: e.target.value }))}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Input Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={fieldForm.input_type}
                                        onChange={(e) => setFieldForm(prev => ({ ...prev, input_type: e.target.value }))}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    >
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="select">Select (dropdown)</option>
                                        <option value="multi_select">Multi-Select</option>
                                        <option value="boolean">Boolean (Yes/No)</option>
                                        <option value="range">Range (Min-Max)</option>
                                        <option value="geo_location">Geo Location</option>
                                        <option value="date">Date</option>
                                        <option value="email">Email</option>
                                        <option value="url">URL</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Usage Context <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={fieldForm.usage_context}
                                        onChange={(e) => setFieldForm(prev => ({ ...prev, usage_context: e.target.value }))}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    >
                                        <option value="both">Both (Upload & Filter)</option>
                                        <option value="upload_only">Upload Only</option>
                                        <option value="filter_only">Filter Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={fieldForm.is_required}
                                        onChange={(e) => setFieldForm(prev => ({ ...prev, is_required: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">This field is required</span>
                                </label>
                            </div>

                            {(fieldForm.input_type === 'select' || fieldForm.input_type === 'multi_select') && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Options <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {(fieldForm.options || []).map((option, index) => (
                                            <div key={index} className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => updateOption(index, e.target.value)}
                                                    placeholder={`Option ${index + 1}`}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(index)}
                                                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addOption}
                                            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition"
                                        >
                                            + Add Option
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowFieldForm(false);
                                        setEditingField(null);
                                        resetFieldForm();
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    {editingField ? 'Update Field' : 'Add Field'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminServiceManager;
