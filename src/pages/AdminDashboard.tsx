
import NestedFeatureBuilder from '@/components/NestedFeatureBuilder';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { ServiceFeature } from '@/types/features';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  AlertCircle,
  ArrowRight,
  Check,
  Database,
  Edit3,
  FileText,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  LogOut,
  Package,
  Plus,
  Save,
  Settings,
  Shield,
  ShoppingBag,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  X
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  custom_type?: string;
  specific_features?: boolean;
  no_navigation?: boolean;
  free_plan?: boolean;
  features?: ServiceFeature[];
}

interface MarketProductCat {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

interface UploadCategory {
  id: number;
  name: string;
  type: 'product' | 'service';
  created_at?: string;
  updated_at?: string;
}

export default function AdminDashboard() {
  // Service fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [customType, setCustomType] = useState('general');
  const [services, setServices] = useState<Service[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceTitle, setEditServiceTitle] = useState('');
  const [editServiceDescription, setEditServiceDescription] = useState('');
  const [editServiceImage, setEditServiceImage] = useState('');
  const [editCustomType, setEditCustomType] = useState('general');
  const [editSpecificFeatures, setEditSpecificFeatures] = useState(false);
  const [editNoNavigation, setEditNoNavigation] = useState(false);
  const [editFreePlan, setEditFreePlan] = useState(false);
  const [editFeaturesList, setEditFeaturesList] = useState<ServiceFeature[]>([]);

  const [specificFeatures, setSpecificFeatures] = useState<boolean>(false);
  const [noNavigation, setNoNavigation] = useState<boolean>(false);
  const [freePlan, setFreePlan] = useState<boolean>(false);
  const [featuresList, setFeaturesList] = useState<ServiceFeature[]>([]);

  // Market Product Category fields
  const [productCatName, setProductCatName] = useState('');
  const [productCatDescription, setProductCatDescription] = useState('');
  const [productCatImageUrl, setProductCatImageUrl] = useState('');
  const [marketProductCats, setMarketProductCats] = useState<MarketProductCat[]>([]);
  const [editingProductCatId, setEditingProductCatId] = useState<string | null>(null);
  const [editProductCatName, setEditProductCatName] = useState('');
  const [editProductCatDescription, setEditProductCatDescription] = useState('');
  const [editProductCatImageUrl, setEditProductCatImageUrl] = useState('');

  // Upload Category fields
  const [uploadCatName, setUploadCatName] = useState('');
  const [uploadCatType, setUploadCatType] = useState<'product' | 'service'>('product');
  const [uploadCategories, setUploadCategories] = useState<UploadCategory[]>([]);
  const [editingUploadCatId, setEditingUploadCatId] = useState<number | null>(null);
  const [editUploadCatName, setEditUploadCatName] = useState('');
  const [editUploadCatType, setEditUploadCatType] = useState<'product' | 'service'>('product');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'uploadCategories' | 'dynamicFields' | 'phases'>('services');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phase management state
  interface AppPhase { id: number; name: string; label: string; description: string | null; is_enabled: boolean; }
  const [phases, setPhases] = useState<AppPhase[]>([]);
  const [phaseMsg, setPhaseMsg] = useState('');
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseLabel, setNewPhaseLabel] = useState('');
  const [newPhaseDesc, setNewPhaseDesc] = useState('');
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [editPhaseLabel, setEditPhaseLabel] = useState('');
  const [editPhaseDesc, setEditPhaseDesc] = useState('');

  const { token } = useAuth();
  const navigate = useNavigate();

  const serviceOnlyMode = services.length > 0 && !services.some(s => String(s.custom_type || 'general').trim().toLowerCase() === 'general');

  useEffect(() => {
    if (!serviceOnlyMode) return;
    setUploadCatType('service');
    setEditUploadCatType('service');
  }, [serviceOnlyMode]);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        navigate('/admin/login');
      } else {
        fetchServices();
        fetchMarketProductCats();
        fetchUploadCategories();
        fetchPhases();
      }
    } catch (err) {
      navigate('/admin/login');
    }
  }, [navigate, token]);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : (data.services || []);
        setServices(list);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketProductCats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/market/product/cats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      setMarketProductCats(data.marketProductCats || []);
    } catch (err) {
      console.error('Error fetching market product categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Service Handlers
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!title.trim() || !description.trim() || !image.trim()) {
      setMessage('❌ All service fields are required');
      setIsSubmitting(false);
      return;
    }

    // Use features only if specific_features is enabled
    const validFeatures = specificFeatures ? featuresList : [];

    try {
      const res = await fetch(`${API_BASE}/api/admin/create/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          image: image.trim(),
          custom_type: customType.trim() || 'general',
          specific_features: specificFeatures,
          features: validFeatures,
          no_navigation: noNavigation,
          free_plan: freePlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create service');
      }

      // Backend now automatically creates field definitions from custom object features
      const fieldCount = validFeatures.filter(f => f.type === 'object').reduce((count, f) => {
        return count + (f.schema ? Object.keys(f.schema).length : 0);
      }, 0);

      if (data.marketplace_service_id && fieldCount > 0) {
        setMessage(`✅ Service "${data.service.title}" created with ${fieldCount} dynamic field(s)!`);
      } else {
        setMessage(`✅ Service "${data.service.title}" added successfully.`);
      }

      setTitle('');
      setDescription('');
      setImage('');
      setCustomType('general');
      setSpecificFeatures(false);
      setNoNavigation(false);
      setFreePlan(false);
      setFeaturesList([]);
      fetchServices();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '❌ Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Service deleted successfully.');
        fetchServices();
        // Auto-clear success message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      } else {
        // Show detailed error message from backend
        const errorMsg = data.message || data.error || 'Failed to delete service';
        setMessage(`❌ ${errorMsg}`);
      }
    } catch (err) {
      setMessage('❌ Network error. Please try again.');
    }
  };

  const startEditingService = (service: Service) => {
    setEditingServiceId(service.id);
    setEditServiceTitle(service.title);
    setEditServiceDescription(service.description);
    setEditServiceImage(service.image);
    setEditCustomType(service.custom_type || 'general');
    setEditSpecificFeatures(service.specific_features || false);
    setEditNoNavigation(service.no_navigation || false);
    setEditFreePlan(service.free_plan || false);
    setEditFeaturesList(service.features || []);
    setMessage('');
  };

  const cancelEditingService = () => {
    setEditingServiceId(null);
    setEditServiceTitle('');
    setEditServiceDescription('');
    setEditServiceImage('');
    setEditCustomType('general');
    setEditSpecificFeatures(false);
    setEditNoNavigation(false);
    setEditFreePlan(false);
    setEditFeaturesList([]);
    setMessage('');
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!editServiceTitle.trim() || !editServiceDescription.trim() || !editServiceImage.trim()) {
      setMessage('❌ All service fields are required');
      setIsSubmitting(false);
      return;
    }
    if (!editingServiceId) {
      setMessage('❌ No service selected for editing');
      setIsSubmitting(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/services/${editingServiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editServiceTitle.trim(),
          description: editServiceDescription.trim(),
          image: editServiceImage.trim(),
          specific_features: editSpecificFeatures,
          no_navigation: editNoNavigation,
          free_plan: editFreePlan,
          features: editFeaturesList,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to update service');
      }
      setMessage(`✅ Service "${data.service.title}" updated successfully.`);
      cancelEditingService();
      fetchServices();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '❌ Failed to update service');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Market Product Category Handlers
  const handleCreateProductCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!productCatName.trim() || !productCatDescription.trim() || !productCatImageUrl.trim()) {
      setMessage('❌ All market product category fields are required');
      setIsSubmitting(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/market/product/cats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productCatName.trim(),
          description: productCatDescription.trim(),
          image_url: productCatImageUrl.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create product category');
      }
      setMessage(`✅ Product Category "${data.marketProductCat.name}" added successfully.`);
      setProductCatName('');
      setProductCatDescription('');
      setProductCatImageUrl('');
      fetchMarketProductCats();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '❌ Failed to create product category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProductCat = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this market product category?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/market/product/cats/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setMessage('✅ Market product category deleted successfully.');
        fetchMarketProductCats();
        // Auto-clear success message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      } else {
        const data = await res.json();
        setMessage(data.error || '❌ Failed to delete market product category.');
      }
    } catch (err) {
      setMessage('❌ Network error. Please try again.');
    }
  };

  const startEditingProductCat = (cat: MarketProductCat) => {
    setEditingProductCatId(cat.id);
    setEditProductCatName(cat.name);
    setEditProductCatDescription(cat.description);
    setEditProductCatImageUrl(cat.image_url);
    setMessage('');
  };

  const cancelEditingProductCat = () => {
    setEditingProductCatId(null);
    setEditProductCatName('');
    setEditProductCatDescription('');
    setEditProductCatImageUrl('');
    setMessage('');
  };

  const handleUpdateProductCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!editProductCatName.trim() || !editProductCatDescription.trim() || !editProductCatImageUrl.trim()) {
      setMessage('❌ All market product category fields are required');
      setIsSubmitting(false);
      return;
    }
    if (!editingProductCatId) {
      setMessage('❌ No market product category selected for editing');
      setIsSubmitting(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/market/product/cats/${editingProductCatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editProductCatName.trim(),
          description: editProductCatDescription.trim(),
          image_url: editProductCatImageUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to update the market product category');
      }
      setMessage(`✅ Market product category "${data.marketProductCat.name}" updated successfully.`);
      cancelEditingProductCat();
      fetchMarketProductCats();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '❌ Failed to update market product category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscriptions = () => {
    navigate('/admin/upgarede/subscriptions');
  };

  // Phase Handlers
  const fetchPhases = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/phases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPhases(data.phases || []);
    } catch { /* ignore */ }
  };

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim() || !newPhaseLabel.trim()) {
      setPhaseMsg('❌ Phase key and label are required');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/phases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newPhaseName, label: newPhaseLabel, description: newPhaseDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create phase');
      setPhaseMsg(`✅ Phase "${data.phase.label}" created.`);
      setNewPhaseName(''); setNewPhaseLabel(''); setNewPhaseDesc('');
      fetchPhases();
    } catch (err) {
      setPhaseMsg(err instanceof Error ? `❌ ${err.message}` : '❌ Failed to create phase');
    }
  };

  const handleTogglePhase = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/phases/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhaseMsg(`✅ Phase "${data.phase.label}" is now ${data.phase.is_enabled ? 'enabled' : 'disabled'}.`);
      fetchPhases();
    } catch (err) {
      setPhaseMsg(err instanceof Error ? `❌ ${err.message}` : '❌ Failed to toggle phase');
    }
  };

  const handleDeletePhase = async (id: number, label: string) => {
    if (!window.confirm(`Delete phase "${label}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/phases/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setPhaseMsg(`✅ Phase "${label}" deleted.`);
      fetchPhases();
    } catch (err) {
      setPhaseMsg(err instanceof Error ? `❌ ${err.message}` : '❌ Failed to delete phase');
    }
  };

  const startEditingPhase = (phase: { id: number; label: string; description: string | null }) => {
    setEditingPhaseId(phase.id);
    setEditPhaseLabel(phase.label);
    setEditPhaseDesc(phase.description || '');
    setPhaseMsg('');
  };

  const handleUpdatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPhaseLabel.trim() || !editingPhaseId) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/phases/${editingPhaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: editPhaseLabel, description: editPhaseDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhaseMsg(`✅ Phase "${data.phase.label}" updated.`);
      setEditingPhaseId(null); setEditPhaseLabel(''); setEditPhaseDesc('');
      fetchPhases();
    } catch (err) {
      setPhaseMsg(err instanceof Error ? `❌ ${err.message}` : '❌ Failed to update phase');
    }
  };

  // Upload Categories Handlers
  const fetchUploadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upload/categories`);
      const data = await res.json();
      if (res.ok) {
        setUploadCategories(data.uploadCategories || []);
      }
    } catch (err) {
      console.error('Error fetching upload categories:', err);
    }
  };

  const handleCreateUploadCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!uploadCatName.trim()) {
      setMessage('❌ Category name is required');
      setIsSubmitting(false);
      return;
    }
    try {
      const effectiveType: 'product' | 'service' = serviceOnlyMode ? 'service' : uploadCatType;
      const res = await fetch(`${API_BASE}/api/upload/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: uploadCatName.trim(),
          type: effectiveType,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create upload category');
      }
      setMessage(`✅ Upload Category "${data.uploadCategory.name}" added successfully.`);
      setUploadCatName('');
      setUploadCatType(serviceOnlyMode ? 'service' : 'product');
      fetchUploadCategories();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '❌ Failed to create upload category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUploadCat = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this upload category?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/upload/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setMessage('✅ Upload category deleted successfully.');
        fetchUploadCategories();
        // Auto-clear success message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      } else {
        const data = await res.json();
        setMessage(data.error || '❌ Failed to delete upload category.');
      }
    } catch (err) {
      setMessage('❌ Network error. Please try again.');
    }
  };

  const startEditingUploadCat = (cat: UploadCategory) => {
    setEditingUploadCatId(cat.id);
    setEditUploadCatName(cat.name);
    setEditUploadCatType(cat.type);
    setMessage('');
  };

  const cancelEditingUploadCat = () => {
    setEditingUploadCatId(null);
    setEditUploadCatName('');
    setEditUploadCatType('product');
    setMessage('');
  };

  const handleUpdateUploadCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!editUploadCatName.trim()) {
      setMessage('❌ Category name is required');
      setIsSubmitting(false);
      return;
    }
    if (!editingUploadCatId) {
      setMessage('❌ No upload category selected for editing');
      setIsSubmitting(false);
      return;
    }
    try {
      const effectiveType: 'product' | 'service' = serviceOnlyMode ? 'service' : editUploadCatType;
      const res = await fetch(`${API_BASE}/api/upload/categories/${editingUploadCatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editUploadCatName.trim(),
          type: effectiveType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to update upload category');
      }
      setMessage(`✅ Upload category "${data.uploadCategory.name}" updated successfully.`);
      cancelEditingUploadCat();
      fetchUploadCategories();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '❌ Failed to update upload category');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`rounded-3xl shadow-2xl border-2 backdrop-blur-sm mb-8 ${localStorage.theme === 'dark'
          ? 'bg-gray-800/80 border-gray-700'
          : 'bg-white/90 border-gray-200'
          }`}>
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Manage services and product categories
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSubscriptions}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
                >
                  <Database className="w-5 h-5" />
                  <span>Subscription Plans</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    navigate('/admin/login');
                  }}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-8 p-4 rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 ${message.startsWith('✅') || message.startsWith('🗑️')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(message.startsWith('✅') || message.startsWith('🗑️')) ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{message}</span>
              </div>
              <button
                onClick={() => setMessage('')}
                className="ml-4 p-1 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Close message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-200 shadow-sm mb-8 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-1 ${activeTab === 'services'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
              : 'text-gray-600 hover:text-purple-600 hover:bg-gray-100'
              }`}
          >
            <Package className="w-5 h-5" />
            <span>Services</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-1 ${activeTab === 'categories'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
              }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Market</span>
          </button>
          <button
            onClick={() => setActiveTab('uploadCategories')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-1 ${activeTab === 'uploadCategories'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'text-gray-600 hover:text-green-600 hover:bg-gray-100'
              }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span>Upload Categories</span>
          </button>
          <button
            onClick={() => { setActiveTab('phases'); setPhaseMsg(''); }}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-1 ${activeTab === 'phases'
              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg'
              : 'text-gray-600 hover:text-orange-600 hover:bg-gray-100'
              }`}
          >
            <Layers className="w-5 h-5" />
            <span>App Phases</span>
          </button>

        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-8">
            {/* Create Service Form */}
            <div className={`rounded-3xl shadow-2xl border-2 backdrop-blur-sm ${localStorage.theme === 'dark'
              ? 'bg-gray-800/80 border-gray-700'
              : 'bg-white/90 border-gray-200'
              }`}>
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-xl bg-purple-100">
                    <Plus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Create New Service</h2>
                    <p className="text-gray-600">Add a new service to your platform</p>
                  </div>
                </div>

                <form onSubmit={handleCreateService} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Title
                      </label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g. Web Development"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL
                      </label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Type
                      </label>
                      <div className="relative">
                        <Database className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={customType}
                          onChange={(e) => setCustomType(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="general"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Default is "general". Cannot be changed after creation.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 h-24"
                        placeholder="Short description of the service..."
                      />
                    </div>
                  </div>

                  {/* Service Options */}
                  <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Service Options
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-purple-200 cursor-pointer transition-all duration-200 hover:shadow-md">
                        <input
                          type="checkbox"
                          checked={specificFeatures}
                          onChange={(e) => {
                            setSpecificFeatures(e.target.checked);
                            if (!e.target.checked) {
                              setFeaturesList([]);
                            }
                          }}
                          className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-all duration-200"
                        />
                        <Shield className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-700">Specific Features</span>
                      </label>
                      <label className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-purple-200 cursor-pointer transition-all duration-200 hover:shadow-md">
                        <input
                          type="checkbox"
                          checked={noNavigation}
                          onChange={(e) => setNoNavigation(e.target.checked)}
                          className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-all duration-200"
                        />
                        <LayoutGrid className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-700">No Navigation</span>
                      </label>
                      <label className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-purple-200 cursor-pointer transition-all duration-200 hover:shadow-md">
                        <input
                          type="checkbox"
                          checked={freePlan}
                          onChange={(e) => setFreePlan(e.target.checked)}
                          className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-all duration-200"
                        />
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-700">Free Plan</span>
                      </label>
                    </div>
                  </div>

                  {/* Specific Features Input Fields */}
                  {specificFeatures && (
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="text-lg font-semibold text-blue-800 flex items-center mb-4">
                        <Shield className="w-5 h-5 mr-2" />
                        Service Features
                      </h3>
                      <NestedFeatureBuilder
                        features={featuresList}
                        onChange={setFeaturesList}
                        darkMode={false}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating Service...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>Create Service</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Edit Service Modal */}
            {editingServiceId && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${localStorage.theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
                  } border-2`}>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">Edit Service</h2>
                      <button
                        onClick={cancelEditingService}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleUpdateService} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Service Title</label>
                          <input
                            type="text"
                            value={editServiceTitle}
                            onChange={(e) => setEditServiceTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                          <input
                            type="url"
                            value={editServiceImage}
                            onChange={(e) => setEditServiceImage(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                        <input
                          type="text"
                          value={editCustomType}
                          disabled
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={editServiceDescription}
                          onChange={(e) => setEditServiceDescription(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 h-24"
                        />
                      </div>

                      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Service Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <label className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-purple-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editSpecificFeatures}
                              onChange={(e) => {
                                setEditSpecificFeatures(e.target.checked);
                                if (!e.target.checked) setEditFeaturesList([]);
                              }}
                              className="h-5 w-5 text-purple-600"
                            />
                            <span className="font-medium text-purple-700">Specific Features</span>
                          </label>
                          <label className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-purple-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editNoNavigation}
                              onChange={(e) => setEditNoNavigation(e.target.checked)}
                              className="h-5 w-5 text-purple-600"
                            />
                            <span className="font-medium text-purple-700">No Navigation</span>
                          </label>
                          <label className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-purple-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editFreePlan}
                              onChange={(e) => setEditFreePlan(e.target.checked)}
                              className="h-5 w-5 text-purple-600"
                            />
                            <span className="font-medium text-purple-700">Free Plan</span>
                          </label>
                        </div>
                      </div>

                      {editSpecificFeatures && (
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                          <h3 className="text-lg font-semibold text-blue-800 flex items-center mb-4">
                            <Shield className="w-5 h-5 mr-2" />
                            Service Features
                          </h3>
                          <NestedFeatureBuilder
                            features={editFeaturesList}
                            onChange={setEditFeaturesList}
                            darkMode={false}
                          />
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:scale-105 transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              <span>Update Service</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingService}
                          className="px-8 py-4 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Services List */}
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Package className="w-6 h-6 mr-3" />
                Manage Services
                <span className="ml-3 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                  {services.length} services
                </span>
              </h3>

              {services.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-gray-300">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Services Yet</h4>
                  <p className="text-gray-500">Create your first service to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {services.map((service, index) => (
                    <div
                      key={service.id}
                      className={`rounded-3xl border-2 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-105 ${localStorage.theme === 'dark'
                        ? 'bg-gray-800/80 border-gray-700'
                        : 'bg-white/90 border-gray-200'
                        }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="p-6">
                        <div className="h-48 rounded-2xl bg-gray-100 overflow-hidden mb-4">
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Service+Image';
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xl font-bold text-gray-900 line-clamp-1">{service.title}</h4>
                          <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>

                          {/* Service Features */}
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              {(service.custom_type || 'general').toUpperCase()}
                            </span>
                            {service.specific_features && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                Features
                              </span>
                            )}
                            {service.no_navigation && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                No Nav
                              </span>
                            )}
                            {service.free_plan && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Free Plan
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 pt-3">
                            <button
                              onClick={() => startEditingService(service)}
                              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-medium transition-all duration-300 hover:scale-105 hover:bg-blue-200 flex-1 justify-center"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 font-medium transition-all duration-300 hover:scale-105 hover:bg-red-200 flex-1 justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            {/* Create Category Form */}
            <div className={`rounded-3xl shadow-2xl border-2 backdrop-blur-sm ${localStorage.theme === 'dark'
              ? 'bg-gray-800/80 border-gray-700'
              : 'bg-white/90 border-gray-200'
              }`}>
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-xl bg-blue-100">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{editingProductCatId ? 'Edit Product Category' : 'Create Product Category'}</h2>
                    <p className="text-gray-600">{editingProductCatId ? 'Update an existing product category' : 'Add a new product category to the market'}</p>
                  </div>
                </div>

                <form onSubmit={editingProductCatId ? handleUpdateProductCat : handleCreateProductCat} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Name
                      </label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={editingProductCatId ? editProductCatName : productCatName}
                          onChange={(e) => editingProductCatId ? setEditProductCatName(e.target.value) : setProductCatName(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g. Electronics"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL
                      </label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          value={editingProductCatId ? editProductCatImageUrl : productCatImageUrl}
                          onChange={(e) => editingProductCatId ? setEditProductCatImageUrl(e.target.value) : setProductCatImageUrl(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="https://example.com/category-image.jpg"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Description
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={editingProductCatId ? editProductCatDescription : productCatDescription}
                        onChange={(e) => editingProductCatId ? setEditProductCatDescription(e.target.value) : setProductCatDescription(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-24"
                        placeholder="Short description of the product category..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>{editingProductCatId ? 'Updating Category...' : 'Creating Category...'}</span>
                      </>
                    ) : (
                      <>
                        {editingProductCatId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        <span>{editingProductCatId ? 'Update Category' : 'Create Category'}</span>
                      </>
                    )}
                  </button>

                  {editingProductCatId && (
                    <button
                      type="button"
                      onClick={cancelEditingProductCat}
                      className="flex items-center space-x-2 px-8 py-4 rounded-xl bg-gray-200 text-gray-700 font-semibold transition-all duration-300 hover:bg-gray-300"
                    >
                      <X className="w-5 h-5" />
                      <span>Cancel Editing</span>
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Categories List */}
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-3" />
                Manage Product Categories
                <span className="ml-3 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  {marketProductCats.length} categories
                </span>
              </h3>

              {marketProductCats.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-gray-300">
                  <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Categories Yet</h4>
                  <p className="text-gray-500">Create your first product category to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {marketProductCats.map((cat, index) => (
                    <div
                      key={cat.id}
                      className={`rounded-3xl border-2 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-105 ${localStorage.theme === 'dark'
                        ? 'bg-gray-800/80 border-gray-700'
                        : 'bg-white/90 border-gray-200'
                        }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="p-6">
                        <div className="h-48 rounded-2xl bg-gray-100 overflow-hidden mb-4">
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Category+Image';
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xl font-bold text-gray-900 line-clamp-1">{cat.name}</h4>
                          <p className="text-gray-600 text-sm line-clamp-2">{cat.description}</p>

                          <div className="flex gap-2 pt-3">
                            <button
                              onClick={() => startEditingProductCat(cat)}
                              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-medium transition-all duration-300 hover:scale-105 hover:bg-blue-200 flex-1 justify-center"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProductCat(cat.id)}
                              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 font-medium transition-all duration-300 hover:scale-105 hover:bg-red-200 flex-1 justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Categories Tab */}
        {activeTab === 'uploadCategories' && (
          <div className="space-y-8">
            {/* Create Upload Category Form */}
            <div className={`rounded-3xl shadow-2xl border-2 backdrop-blur-sm ${localStorage.theme === 'dark'
              ? 'bg-gray-800/80 border-gray-700'
              : 'bg-white/90 border-gray-200'
              }`}>
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-xl bg-green-100">
                    <Plus className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Create Upload Category</h2>
                    <p className="text-gray-600">Add categories for uploads</p>
                  </div>
                </div>

                <form onSubmit={editingUploadCatId ? handleUpdateUploadCat : handleCreateUploadCat} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Name
                      </label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={editingUploadCatId ? editUploadCatName : uploadCatName}
                          onChange={(e) => editingUploadCatId ? setEditUploadCatName(e.target.value) : setUploadCatName(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., Men, Women, Kids, Culture"
                        />
                      </div>
                    </div>

                    {!serviceOnlyMode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <div className="relative">
                          <LayoutGrid className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <select
                            value={editingUploadCatId ? editUploadCatType : uploadCatType}
                            onChange={(e) => editingUploadCatId ? setEditUploadCatType(e.target.value as 'product' | 'service') : setUploadCatType(e.target.value as 'product' | 'service')}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="product">Product</option>
                            <option value="service">Service</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{editingUploadCatId ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <>
                        {editingUploadCatId ? (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Update Category</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            <span>Create Category</span>
                          </>
                        )}
                      </>
                    )}
                  </button>

                  {editingUploadCatId && (
                    <button
                      type="button"
                      onClick={cancelEditingUploadCat}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold transition-all duration-300 hover:bg-gray-300"
                    >
                      <X className="w-5 h-5" />
                      <span>Cancel Editing</span>
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Upload Categories List */}
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <LayoutGrid className="w-6 h-6 mr-3" />
                Manage Upload Categories
                <span className="ml-3 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                  {uploadCategories.length} categories
                </span>
              </h3>

              {uploadCategories.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-gray-300">
                  <LayoutGrid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Upload Categories Yet</h4>
                  <p className="text-gray-500">Create your first upload category to organize products and services</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Product Categories */}
                  {!serviceOnlyMode && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 flex items-center text-blue-600">
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Product Categories ({uploadCategories.filter(c => c.type === 'product').length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {uploadCategories.filter(c => c.type === 'product').map((cat) => (
                          <div
                            key={cat.id}
                            className={`rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${localStorage.theme === 'dark'
                              ? 'bg-gray-800/80 border-gray-700'
                              : 'bg-white/90 border-blue-200'
                              }`}
                          >
                            <div className="p-5">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-lg font-bold text-gray-900">{cat.name}</h5>
                                <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">
                                  Product
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditingUploadCat(cat)}
                                  className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium transition-all duration-300 hover:bg-blue-200 flex-1"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  <span className="text-sm">Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUploadCat(cat.id)}
                                  className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-red-100 text-red-700 font-medium transition-all duration-300 hover:bg-red-200 flex-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="text-sm">Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Categories */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 flex items-center text-purple-600 mt-8">
                      <Package className="w-5 h-5 mr-2" />
                      Service Categories ({uploadCategories.filter(c => c.type === 'service').length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {uploadCategories.filter(c => c.type === 'service').map((cat) => (
                        <div
                          key={cat.id}
                          className={`rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${localStorage.theme === 'dark'
                            ? 'bg-gray-800/80 border-gray-700'
                            : 'bg-white/90 border-purple-200'
                            }`}
                        >
                          <div className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-lg font-bold text-gray-900">{cat.name}</h5>
                              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold">
                                Service
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditingUploadCat(cat)}
                                className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 font-medium transition-all duration-300 hover:bg-purple-200 flex-1"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span className="text-sm">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUploadCat(cat.id)}
                                className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-red-100 text-red-700 font-medium transition-all duration-300 hover:bg-red-200 flex-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* App Phases Tab */}
        {activeTab === 'phases' && (
          <div className="space-y-8">

            {/* Phase message */}
            {phaseMsg && (
              <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${phaseMsg.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {phaseMsg.startsWith('✅') ? <Check className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="font-medium">{phaseMsg}</span>
                  </div>
                  <button onClick={() => setPhaseMsg('')} className="p-1 rounded-lg hover:bg-black/5"><X className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* Create Phase Form */}
            <div className="rounded-3xl shadow-2xl border-2 backdrop-blur-sm bg-white/90 border-gray-200">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-xl bg-orange-100">
                    <Layers className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Create App Phase</h2>
                    <p className="text-gray-500 text-sm">Define a phase key to gate features. The key is permanent; only label &amp; description can be edited later.</p>
                  </div>
                </div>

                <form onSubmit={handleCreatePhase} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phase Key <span className="text-orange-500">*</span></label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={newPhaseName}
                          onChange={(e) => setNewPhaseName(e.target.value)}
                          placeholder="e.g. phase_1 or marketplace"
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Lowercase snake_case. Cannot be changed after creation.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Label <span className="text-orange-500">*</span></label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={newPhaseLabel}
                          onChange={(e) => setNewPhaseLabel(e.target.value)}
                          placeholder="e.g. Phase 1 – Core Features"
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                    <textarea
                      value={newPhaseDesc}
                      onChange={(e) => setNewPhaseDesc(e.target.value)}
                      placeholder="What features does this phase enable?"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all h-20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Phase</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Phase List */}
            <div className="rounded-3xl shadow-2xl border-2 backdrop-blur-sm bg-white/90 border-gray-200">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-xl bg-orange-100">
                    <Layers className="w-6 h-6 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold">All Phases ({phases.length})</h2>
                </div>

                {phases.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No phases yet</p>
                    <p className="text-sm">Create a phase above to start managing your app rollout.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {phases.map((phase) => (
                      <div
                        key={phase.id}
                        className={`rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${phase.is_enabled ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                          }`}
                      >
                        {editingPhaseId === phase.id ? (
                          /* Inline edit form */
                          <form onSubmit={handleUpdatePhase} className="p-5 space-y-3">
                            <input
                              type="text"
                              value={editPhaseLabel}
                              onChange={(e) => setEditPhaseLabel(e.target.value)}
                              required
                              className="w-full px-3 py-2 rounded-lg border-2 border-orange-300 focus:ring-2 focus:ring-orange-400 text-sm"
                              placeholder="Label"
                            />
                            <textarea
                              value={editPhaseDesc}
                              onChange={(e) => setEditPhaseDesc(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm h-16"
                              placeholder="Description (optional)"
                            />
                            <div className="flex gap-2">
                              <button type="submit" className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-colors">
                                <Save className="w-4 h-4" /><span>Save</span>
                              </button>
                              <button type="button" onClick={() => { setEditingPhaseId(null); setPhaseMsg(''); }} className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="p-5">
                            {/* Header row: label + status badge */}
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="text-base font-bold text-gray-900 leading-tight pr-2">{phase.label}</h3>
                              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${phase.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {phase.is_enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            {/* Key */}
                            <p className="text-xs text-gray-400 font-mono mb-2">{phase.name}</p>
                            {/* Description */}
                            {phase.description && (
                              <p className="text-sm text-gray-500 mb-4 leading-snug">{phase.description}</p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3">
                              {/* Toggle switch */}
                              <button
                                onClick={() => handleTogglePhase(phase.id)}
                                title={phase.is_enabled ? 'Disable phase' : 'Enable phase'}
                                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 ${phase.is_enabled
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                              >
                                {phase.is_enabled
                                  ? <ToggleRight className="w-5 h-5" />
                                  : <ToggleLeft className="w-5 h-5" />}
                                <span>{phase.is_enabled ? 'On' : 'Off'}</span>
                              </button>
                              {/* Edit */}
                              <button
                                onClick={() => startEditingPhase(phase)}
                                className="flex items-center justify-center px-3 py-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-all text-sm"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => handleDeletePhase(phase.id, phase.label)}
                                className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Usage hint */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">How to gate a feature behind a phase</h4>
                  <p className="text-sm text-blue-700 mb-2">Import <code className="bg-blue-100 px-1 rounded font-mono">usePhases</code> from <code className="bg-blue-100 px-1 rounded font-mono">@/context/PhaseContext</code> in any component:</p>
                  <pre className="bg-white rounded-xl p-3 text-xs text-gray-700 overflow-x-auto border border-blue-200">{`const { isPhaseEnabled } = usePhases();
if (!isPhaseEnabled('phase_1')) return null; // 👈 feature hidden until enabled`}</pre>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}