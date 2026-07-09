
import NestedFeatureBuilder from '@/components/NestedFeatureBuilder';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
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
  Store,
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
  const { darkMode } = useDarkMode();
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
  const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'uploadCategories' | 'dynamicFields' | 'phases' | 'shops' | 'agents'>('services');
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

  // Shop Categories state
  interface ShopType {
    id: number;
    name: string;
    is_premium?: boolean;
    price_monthly?: number;
    features?: string | string[];
    max_products?: number;
    base_storage_mb?: number;
  }
  const [shopTypes, setShopTypes] = useState<ShopType[]>([]);
  const [shopTypeName, setShopTypeName] = useState('');
  const [shopIsPremium, setShopIsPremium] = useState(false);
  const [shopPriceMonthly, setShopPriceMonthly] = useState(0);
  const [shopMaxProducts, setShopMaxProducts] = useState(100);
  const [shopBaseStorageMb, setShopBaseStorageMb] = useState(1024);
  const [shopFeaturesText, setShopFeaturesText] = useState('');
  const [editingShopTypeId, setEditingShopTypeId] = useState<number | null>(null);

  // Agent Management state
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);

  // Agent Settings Configuration
  const [referralRewardAmount, setReferralRewardAmount] = useState<number>(1000);
  const [minimumWithdrawalAmount, setMinimumWithdrawalAmount] = useState<number>(5000);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAgentsList(data.agents || []);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWithdrawalsList(data.withdrawals || []);
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agent/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const settings = await res.json();
        setReferralRewardAmount(settings.referralRewardAmount || 1000);
        setMinimumWithdrawalAmount(settings.minimumWithdrawalAmount || 5000);
      }
    } catch (err) {
      console.error('Failed to load agent settings:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          referralRewardAmount: Number(referralRewardAmount),
          minimumWithdrawalAmount: Number(minimumWithdrawalAmount)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsMessage('✅ Agent settings updated successfully!');
        setIsEditingSettings(false);
        fetchSettings();
      } else {
        setSettingsMessage(`❌ ${data.error || 'Failed to save settings'}`);
      }
    } catch (err) {
      setSettingsMessage('❌ Failed to connect to server');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApproveWithdrawal = async (id: number) => {
    if (!window.confirm('Are you sure you want to approve this withdrawal request?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Withdrawal request approved successfully.');
        fetchWithdrawals();
        fetchAgents();
      } else {
        alert(data.error || 'Failed to approve request.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  const handleRejectWithdrawal = async (id: number) => {
    if (!window.confirm('Are you sure you want to reject this withdrawal request? (Balance will be refunded)')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Withdrawal request rejected and balance refunded.');
        fetchWithdrawals();
        fetchAgents();
      } else {
        alert(data.error || 'Failed to reject request.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

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
        fetchShopTypes();
        fetchAgents();
        fetchWithdrawals();
        fetchSettings();
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
    navigate('/admin/upgrade/subscriptions');
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

  // Shop Categories Handlers
  const fetchShopTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/shopping-types`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setShopTypes(data.shopping_types || []);
      }
    } catch (err) {
      console.error('Error fetching shop types:', err);
    }
  };

  const handleSaveShopType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopTypeName.trim()) return;

    try {
      const url = editingShopTypeId
        ? `${API_BASE}/api/admin/shopping-types/${editingShopTypeId}`
        : `${API_BASE}/api/admin/shopping-types`;
      const method = editingShopTypeId ? 'PUT' : 'POST';

      const featuresArray = shopFeaturesText
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const isOther = editingShopTypeId ? (shopTypes.find(st => st.id === editingShopTypeId)?.key === 'other') : false;

      const body = {
        name: shopTypeName.trim(),
        is_premium: !isOther,
        price_monthly: !isOther ? Number(shopPriceMonthly) : 0,
        max_products: !isOther ? Number(shopMaxProducts) : 100,
        base_storage_mb: !isOther ? Number(shopBaseStorageMb) : 1024,
        features: !isOther ? featuresArray : []
      };

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(editingShopTypeId ? '✅ Shop category updated successfully' : '✅ Shop category created successfully');
        setShopTypeName('');
        setShopIsPremium(false);
        setShopPriceMonthly(0);
        setShopMaxProducts(100);
        setShopBaseStorageMb(1024);
        setShopFeaturesText('');
        setEditingShopTypeId(null);
        fetchShopTypes();
      } else {
        setMessage(`❌ ${data.error || 'Failed to save shop category'}`);
      }
    } catch (err) {
      setMessage('❌ Failed to connect to server');
    }
  };

  const startEditingShopType = (st: ShopType) => {
    setEditingShopTypeId(st.id);
    setShopTypeName(st.name);
    setShopIsPremium(st.key !== 'other');
    setShopPriceMonthly(st.price_monthly || 0);
    setShopMaxProducts(st.max_products || 100);
    setShopBaseStorageMb(st.base_storage_mb || 1024);
    
    let fText = '';
    if (st.features) {
      if (Array.isArray(st.features)) {
        fText = st.features.join('\n');
      } else {
        try {
          const parsed = typeof st.features === 'string' ? JSON.parse(st.features) : st.features;
          if (Array.isArray(parsed)) {
            fText = parsed.join('\n');
          }
        } catch {
          fText = '';
        }
      }
    }
    setShopFeaturesText(fText);
    setMessage('');
  };

  const cancelShopTypeEdit = () => {
    setEditingShopTypeId(null);
    setShopTypeName('');
    setShopIsPremium(false);
    setShopPriceMonthly(0);
    setShopMaxProducts(100);
    setShopBaseStorageMb(1024);
    setShopFeaturesText('');
    setMessage('');
  };

  const handleDeleteShopType = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the shop category "${name}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/shopping-types/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('✅ Shop category deleted successfully');
        fetchShopTypes();
      } else {
        setMessage(`❌ ${data.message || data.error || 'Failed to delete shop category'}`);
      }
    } catch (err) {
      setMessage('❌ Failed to connect to server');
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
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" message="Loading Admin Dashboard..." variant="dots" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          className={`border transition-all duration-300 mb-8 overflow-hidden ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'
          } shadow-sm`}
          style={{ borderRadius: '2px' }}
        >
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div
                  className={`p-3 border flex items-center justify-center ${
                    darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' : 'bg-emerald-50 border-emerald-500/10 text-emerald-600'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Admin Dashboard
                  </h1>
                  <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-455' : 'text-gray-500'}`}>
                    Manage services and product categories
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSubscriptions}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${
                    darkMode
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-455 hover:bg-emerald-500/20'
                      : 'bg-emerald-50 border-emerald-500/10 text-emerald-600 hover:bg-emerald-100/50'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <Database className="w-4 h-4" />
                  <span>Subscription Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    navigate('/admin/login');
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${
                    darkMode
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                      : 'bg-red-50 border-red-200 text-red-655 hover:bg-red-100/50'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-8 p-4 border transition-all duration-300 ${
              message.startsWith('✅') || message.startsWith('🗑️')
                ? darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-500/10 text-emerald-600'
                : darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-655'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(message.startsWith('✅') || message.startsWith('🗑️')) ? (
                  <Check className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-semibold">{message}</span>
              </div>
              <button
                onClick={() => setMessage('')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderRadius: '2px' }}
                aria-label="Close message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          className={`flex border p-1 mb-8 flex-wrap gap-1 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}
          style={{ borderRadius: '2px' }}
        >
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
              activeTab === 'services'
                ? darkMode
                  ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                : darkMode
                ? 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                : 'bg-transparent border-transparent text-gray-550 hover:bg-gray-100 hover:text-gray-700'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <Package className="w-4 h-4" />
            <span>Services</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
              activeTab === 'categories'
                ? darkMode
                  ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                : darkMode
                ? 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                : 'bg-transparent border-transparent text-gray-555 hover:bg-gray-100 hover:text-gray-700'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Market</span>
          </button>
          <button
            onClick={() => setActiveTab('uploadCategories')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
              activeTab === 'uploadCategories'
                ? darkMode
                  ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                : darkMode
                ? 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                : 'bg-transparent border-transparent text-gray-555 hover:bg-gray-100 hover:text-gray-700'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Upload Categories</span>
          </button>
          <button
            onClick={() => { setActiveTab('phases'); setPhaseMsg(''); }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
              activeTab === 'phases'
                ? darkMode
                  ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                : darkMode
                ? 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                : 'bg-transparent border-transparent text-gray-555 hover:bg-gray-100 hover:text-gray-700'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <Layers className="w-4 h-4" />
            <span>App Phases</span>
          </button>
          <button
            onClick={() => { setActiveTab('shops'); setMessage(''); }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
              activeTab === 'shops'
                ? darkMode
                  ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                : darkMode
                ? 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                : 'bg-transparent border-transparent text-gray-555 hover:bg-gray-100 hover:text-gray-700'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <Store className="w-4 h-4" />
            <span>Shops</span>
          </button>
          <button
            onClick={() => { setActiveTab('agents'); fetchAgents(); fetchWithdrawals(); fetchSettings(); }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
              activeTab === 'agents'
                ? darkMode
                  ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                : darkMode
                ? 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                : 'bg-transparent border-transparent text-gray-555 hover:bg-gray-100 hover:text-gray-700'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <Shield className="w-4 h-4" />
            <span>Agents</span>
          </button>
        </div>         {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-8">
            {/* Create Service Form */}
            <div
              className={`border transition-all duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'
              } shadow-sm overflow-hidden`}
              style={{ borderRadius: '2px' }}
            >
              <div
                className={`px-6 py-4 border-b ${
                  darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                } flex justify-between items-center`}
              >
                <h3 className={`text-base font-bold uppercase tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Create New Service
                </h3>
              </div>

              <form onSubmit={handleCreateService} className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Service Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className={`w-full p-2.5 border text-sm ${
                        darkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                      style={{ borderRadius: '2px' }}
                      placeholder="e.g. Web Development"
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      required
                      className={`w-full p-2.5 border text-sm ${
                        darkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                      style={{ borderRadius: '2px' }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Service Type
                    </label>
                    <input
                      type="text"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      className={`w-full p-2.5 border text-sm ${
                        darkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                      style={{ borderRadius: '2px' }}
                      placeholder="general"
                    />
                    <p className={`text-[9px] font-bold uppercase mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Default is "general". Cannot be changed after creation.
                    </p>
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className={`w-full p-2.5 border text-sm ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                        : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                    } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all h-24`}
                    style={{ borderRadius: '2px' }}
                    placeholder="Short description of the service..."
                  />
                </div>

                {/* Service Options */}
                <div
                  className={`p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-750' : 'bg-gray-55 border-gray-200'}`}
                  style={{ borderRadius: '2px' }}
                >
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Service Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label
                      className={`flex items-center space-x-3 p-3 border cursor-pointer transition-all ${
                        darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      style={{ borderRadius: '2px' }}
                    >
                      <input
                        type="checkbox"
                        checked={specificFeatures}
                        onChange={(e) => {
                          setSpecificFeatures(e.target.checked);
                          if (!e.target.checked) {
                            setFeaturesList([]);
                          }
                        }}
                        className={`h-4 w-4 ${
                          darkMode
                            ? 'bg-gray-900 border-gray-750 text-emerald-500 focus:ring-emerald-500'
                            : 'border-gray-350 text-emerald-600 focus:ring-emerald-500'
                        }`}
                        style={{ borderRadius: '2px' }}
                      />
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Specific Features
                      </span>
                    </label>
                    <label
                      className={`flex items-center space-x-3 p-3 border cursor-pointer transition-all ${
                        darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      style={{ borderRadius: '2px' }}
                    >
                      <input
                        type="checkbox"
                        checked={noNavigation}
                        onChange={(e) => setNoNavigation(e.target.checked)}
                        className={`h-4 w-4 ${
                          darkMode
                            ? 'bg-gray-900 border-gray-750 text-emerald-500 focus:ring-emerald-500'
                            : 'border-gray-355 text-emerald-600 focus:ring-emerald-500'
                        }`}
                        style={{ borderRadius: '2px' }}
                      />
                      <LayoutGrid className="w-4 h-4 text-emerald-500" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        No Navigation
                      </span>
                    </label>
                    <label
                      className={`flex items-center space-x-3 p-3 border cursor-pointer transition-all ${
                        darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      style={{ borderRadius: '2px' }}
                    >
                      <input
                        type="checkbox"
                        checked={freePlan}
                        onChange={(e) => setFreePlan(e.target.checked)}
                        className={`h-4 w-4 ${
                          darkMode
                            ? 'bg-gray-900 border-gray-750 text-emerald-500 focus:ring-emerald-500'
                            : 'border-gray-355 text-emerald-600 focus:ring-emerald-500'
                        }`}
                        style={{ borderRadius: '2px' }}
                      />
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Free Plan
                      </span>
                    </label>
                  </div>
                </div>

                {/* Specific Features Input Fields */}
                {specificFeatures && (
                  <div
                    className={`p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-750 shadow-inner' : 'bg-gray-50 border-gray-200'}`}
                    style={{ borderRadius: '2px' }}
                  >
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Shield className="w-4 h-4 mr-2" />
                      Service Features
                    </h3>
                    <NestedFeatureBuilder
                      features={featuresList}
                      onChange={setFeaturesList}
                      darkMode={darkMode}
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border flex items-center gap-2 ${
                      isSubmitting
                        ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>

            {/* Edit Service Modal */}
            {editingServiceId && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div
                  className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto border transition-all duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-750 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } shadow-2xl`}
                  style={{ borderRadius: '2px' }}
                >
                  <div
                    className={`px-6 py-4 border-b ${
                      darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                    } flex justify-between items-center`}
                  >
                    <h3 className={`text-base font-bold uppercase tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Edit Service
                    </h3>
                    <button
                      onClick={cancelEditingService}
                      className={`p-1.5 border transition-colors ${
                        darkMode
                          ? 'border-gray-700 hover:bg-gray-700 text-gray-400'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-550'
                      }`}
                      style={{ borderRadius: '2px' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateService} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Service Title
                        </label>
                        <input
                          type="text"
                          value={editServiceTitle}
                          onChange={(e) => setEditServiceTitle(e.target.value)}
                          required
                          className={`w-full p-2.5 border text-sm ${
                            darkMode
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                              : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                          } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                          style={{ borderRadius: '2px' }}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={editServiceImage}
                          onChange={(e) => setEditServiceImage(e.target.value)}
                          required
                          className={`w-full p-2.5 border text-sm ${
                            darkMode
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                              : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                          } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                          style={{ borderRadius: '2px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Service Type
                      </label>
                      <input
                        type="text"
                        value={editCustomType}
                        disabled
                        className={`w-full p-2.5 border text-sm ${
                          darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                        style={{ borderRadius: '2px' }}
                      />
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Description
                      </label>
                      <textarea
                        value={editServiceDescription}
                        onChange={(e) => setEditServiceDescription(e.target.value)}
                        required
                        className={`w-full p-2.5 border text-sm ${
                          darkMode
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                            : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                        } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all h-24`}
                        style={{ borderRadius: '2px' }}
                      />
                    </div>

                    <div
                      className={`p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-750' : 'bg-gray-55 border-gray-200'}`}
                      style={{ borderRadius: '2px' }}
                    >
                      <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Settings className="w-4 h-4 mr-2" />
                        Service Options
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label
                          className={`flex items-center space-x-3 p-3 border cursor-pointer transition-all ${
                            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-755' : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          style={{ borderRadius: '2px' }}
                        >
                          <input
                            type="checkbox"
                            checked={editSpecificFeatures}
                            onChange={(e) => {
                              setEditSpecificFeatures(e.target.checked);
                              if (!e.target.checked) setEditFeaturesList([]);
                            }}
                            className={`h-4 w-4 ${
                              darkMode
                                ? 'bg-gray-900 border-gray-750 text-emerald-500 focus:ring-emerald-500'
                                : 'border-gray-350 text-emerald-600 focus:ring-emerald-500'
                            }`}
                            style={{ borderRadius: '2px' }}
                          />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Specific Features
                          </span>
                        </label>
                        <label
                          className={`flex items-center space-x-3 p-3 border cursor-pointer transition-all ${
                            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-755' : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          style={{ borderRadius: '2px' }}
                        >
                          <input
                            type="checkbox"
                            checked={editNoNavigation}
                            onChange={(e) => setEditNoNavigation(e.target.checked)}
                            className={`h-4 w-4 ${
                              darkMode
                                ? 'bg-gray-900 border-gray-750 text-emerald-500 focus:ring-emerald-500'
                                : 'border-gray-350 text-emerald-600 focus:ring-emerald-500'
                            }`}
                            style={{ borderRadius: '2px' }}
                          />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            No Navigation
                          </span>
                        </label>
                        <label
                          className={`flex items-center space-x-3 p-3 border cursor-pointer transition-all ${
                            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-755' : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          style={{ borderRadius: '2px' }}
                        >
                          <input
                            type="checkbox"
                            checked={editFreePlan}
                            onChange={(e) => setEditFreePlan(e.target.checked)}
                            className={`h-4 w-4 ${
                              darkMode
                                ? 'bg-gray-900 border-gray-750 text-emerald-500 focus:ring-emerald-500'
                                : 'border-gray-350 text-emerald-600 focus:ring-emerald-500'
                            }`}
                            style={{ borderRadius: '2px' }}
                          />
                          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Free Plan
                          </span>
                        </label>
                      </div>
                    </div>

                    {editSpecificFeatures && (
                      <div
                        className={`p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-750 shadow-inner' : 'bg-gray-50 border-gray-200'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <Shield className="w-4 h-4 mr-2" />
                          Service Features
                        </h3>
                        <NestedFeatureBuilder
                          features={editFeaturesList}
                          onChange={setEditFeaturesList}
                          darkMode={darkMode}
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={cancelEditingService}
                        className={`px-4 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border ${
                          darkMode
                            ? 'bg-gray-800 border-gray-755 text-gray-300 hover:bg-gray-700'
                            : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border flex items-center gap-2 ${
                          isSubmitting
                            ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        {isSubmitting ? 'Updating...' : 'Update Service'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Services List */}
            <div>
              <h3 className={`text-base font-bold uppercase tracking-tight mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Package className="w-5 h-5" />
                Manage Services
                <span
                  className={`text-xs px-2 py-0.5 border font-bold uppercase ${
                    darkMode ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  {services.length} services
                </span>
              </h3>

              {services.length === 0 ? (
                <div
                  className={`text-center py-12 border-2 border-dashed ${
                    darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-white/50'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    No Services Yet
                  </h4>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Create your first service to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {services.map((service, index) => (
                    <div
                      key={service.id}
                      className={`border transition-all duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'
                      } shadow-sm overflow-hidden`}
                      style={{ borderRadius: '2px', animationDelay: `${index * 50}ms` }}
                    >
                      <div>
                        <div
                          className={`h-48 bg-gray-100 overflow-hidden border-b ${
                            darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Service+Image';
                            }}
                          />
                        </div>

                        <div className="p-5 space-y-3">
                          <h4 className={`text-base font-bold uppercase tracking-tight mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {service.title}
                          </h4>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                            {service.description}
                          </p>

                          {/* Service Features */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 border font-bold uppercase ${
                                darkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-55 border-gray-200 text-gray-650'
                              }`}
                              style={{ borderRadius: '2px' }}
                            >
                              {(service.custom_type || 'general').toUpperCase()}
                            </span>
                            {service.specific_features && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 border font-bold uppercase ${
                                  darkMode
                                    ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                Features
                              </span>
                            )}
                            {service.no_navigation && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 border font-bold uppercase ${
                                  darkMode
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-blue-50 text-blue-700 border-blue-205'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                No Nav
                              </span>
                            )}
                            {service.free_plan && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 border font-bold uppercase ${
                                  darkMode
                                    ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                Free Plan
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 pt-3">
                            <button
                              onClick={() => startEditingService(service)}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
                                darkMode
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/50'
                              }`}
                              style={{ borderRadius: '2px' }}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
                                darkMode
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                  : 'bg-red-50 border-red-200 text-red-655 hover:bg-red-100/50'
                              }`}
                              style={{ borderRadius: '2px' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            <div
              className={`border transition-all duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'
              } shadow-sm overflow-hidden`}
              style={{ borderRadius: '2px' }}
            >
              <div
                className={`px-6 py-4 border-b ${
                  darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                } flex justify-between items-center`}
              >
                <h3 className={`text-base font-bold uppercase tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingProductCatId ? 'Edit Product Category' : 'Create Product Category'}
                </h3>
              </div>

              <form onSubmit={editingProductCatId ? handleUpdateProductCat : handleCreateProductCat} className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={editingProductCatId ? editProductCatName : productCatName}
                      onChange={(e) => editingProductCatId ? setEditProductCatName(e.target.value) : setProductCatName(e.target.value)}
                      required
                      className={`w-full p-2.5 border text-sm ${
                        darkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                      style={{ borderRadius: '2px' }}
                      placeholder="e.g. Electronics"
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={editingProductCatId ? editProductCatImageUrl : productCatImageUrl}
                      onChange={(e) => editingProductCatId ? setEditProductCatImageUrl(e.target.value) : setProductCatImageUrl(e.target.value)}
                      required
                      className={`w-full p-2.5 border text-sm ${
                        darkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                      style={{ borderRadius: '2px' }}
                      placeholder="https://example.com/category-image.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Category Description
                  </label>
                  <textarea
                    value={editingProductCatId ? editProductCatDescription : productCatDescription}
                    onChange={(e) => editingProductCatId ? setEditProductCatDescription(e.target.value) : setProductCatDescription(e.target.value)}
                    required
                    className={`w-full p-2.5 border text-sm ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                        : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                    } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all h-24`}
                    style={{ borderRadius: '2px' }}
                    placeholder="Short description of the product category..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {editingProductCatId && (
                    <button
                      type="button"
                      onClick={cancelEditingProductCat}
                      className={`px-4 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border ${
                        darkMode
                          ? 'bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700'
                          : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{ borderRadius: '2px' }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border flex items-center gap-2 ${
                      isSubmitting
                        ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : editingProductCatId
                      ? 'Update Category'
                      : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>

            {/* Categories List */}
            <div>
              <h3 className={`text-base font-bold uppercase tracking-tight mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <ShoppingBag className="w-5 h-5" />
                Manage Product Categories
                <span
                  className={`text-xs px-2 py-0.5 border font-bold uppercase ${
                    darkMode ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  {marketProductCats.length} categories
                </span>
              </h3>

              {marketProductCats.length === 0 ? (
                <div
                  className={`text-center py-12 border-2 border-dashed ${
                    darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-white/50'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    No Categories Yet
                  </h4>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Create your first product category to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {marketProductCats.map((cat, index) => (
                    <div
                      key={cat.id}
                      className={`border transition-all duration-300 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'
                      } shadow-sm overflow-hidden`}
                      style={{ borderRadius: '2px', animationDelay: `${index * 50}ms` }}
                    >
                      <div>
                        <div
                          className={`h-48 bg-gray-100 overflow-hidden border-b ${
                            darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Category+Image';
                            }}
                          />
                        </div>

                        <div className="p-5 space-y-3">
                          <h4 className={`text-base font-bold uppercase tracking-tight mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {cat.name}
                          </h4>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                            {cat.description}
                          </p>

                          <div className="flex gap-2 pt-3">
                            <button
                              onClick={() => startEditingProductCat(cat)}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
                                darkMode
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/50'
                              }`}
                              style={{ borderRadius: '2px' }}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProductCat(cat.id)}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
                                darkMode
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                  : 'bg-red-50 border-red-200 text-red-655 hover:bg-red-100/50'
                              }`}
                              style={{ borderRadius: '2px' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            <div
              className={`border transition-all duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'
              } shadow-sm overflow-hidden`}
              style={{ borderRadius: '2px' }}
            >
              <div
                className={`px-6 py-4 border-b ${
                  darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                } flex justify-between items-center`}
              >
                <h3 className={`text-base font-bold uppercase tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingUploadCatId ? 'Edit Upload Category' : 'Create Upload Category'}
                </h3>
              </div>

              <form onSubmit={editingUploadCatId ? handleUpdateUploadCat : handleCreateUploadCat} className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={editingUploadCatId ? editUploadCatName : uploadCatName}
                      onChange={(e) => editingUploadCatId ? setEditUploadCatName(e.target.value) : setUploadCatName(e.target.value)}
                      required
                      className={`w-full p-2.5 border text-sm ${
                        darkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                      style={{ borderRadius: '2px' }}
                      placeholder="e.g., Men, Women, Kids, Culture"
                    />
                  </div>

                  {!serviceOnlyMode && (
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Type
                      </label>
                      <select
                        value={editingUploadCatId ? editUploadCatType : uploadCatType}
                        onChange={(e) => editingUploadCatId ? setEditUploadCatType(e.target.value as 'product' | 'service') : setUploadCatType(e.target.value as 'product' | 'service')}
                        className={`w-full p-2.5 border text-sm appearance-none cursor-pointer ${
                          darkMode
                            ? 'bg-gray-900 border-gray-700 text-white focus:ring-1 focus:ring-emerald-500'
                            : 'bg-white border-gray-250 text-gray-900 focus:ring-1 focus:ring-emerald-500'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        <option value="product">Product</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {editingUploadCatId && (
                    <button
                      type="button"
                      onClick={cancelEditingUploadCat}
                      className={`px-4 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border ${
                        darkMode
                          ? 'bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700'
                          : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{ borderRadius: '2px' }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border flex items-center gap-2 ${
                      isSubmitting
                        ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : editingUploadCatId
                      ? 'Update Category'
                      : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>

            {/* Upload Categories List */}
            <div>
              <h3 className={`text-base font-bold uppercase tracking-tight mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <LayoutGrid className="w-5 h-5" />
                Manage Upload Categories
                <span
                  className={`text-xs px-2 py-0.5 border font-bold uppercase ${
                    darkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-500/10'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  {uploadCategories.length} categories
                </span>
              </h3>

              {uploadCategories.length === 0 ? (
                <div
                  className={`text-center py-12 border-2 border-dashed ${
                    darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-white/50'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <LayoutGrid className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    No Upload Categories Yet
                  </h4>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Create your first upload category to organize products and services
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Product Categories */}
                  {!serviceOnlyMode && (
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        <ShoppingBag className="w-4 h-4" />
                        Product Categories ({uploadCategories.filter(c => c.type === 'product').length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {uploadCategories.filter(c => c.type === 'product').map((cat) => (
                          <div
                            key={cat.id}
                            className={`border transition-all duration-300 ${
                              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'
                            } shadow-sm`}
                            style={{ borderRadius: '2px' }}
                          >
                            <div className="p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className={`text-sm font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {cat.name}
                                </h5>
                                <span
                                  className={`text-[8px] px-1.5 py-0.5 border font-bold uppercase ${
                                    darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'
                                  }`}
                                  style={{ borderRadius: '2px' }}
                                >
                                  Product
                                </span>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => startEditingUploadCat(cat)}
                                  className={`flex items-center justify-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
                                    darkMode
                                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/50'
                                  }`}
                                  style={{ borderRadius: '2px' }}
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUploadCat(cat.id)}
                                  className={`flex items-center justify-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
                                    darkMode
                                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                      : 'bg-red-50 border-red-200 text-red-655 hover:bg-red-100/50'
                                  }`}
                                  style={{ borderRadius: '2px' }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
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
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${darkMode ? 'text-purple-400' : 'text-purple-650'}`}>
                      <Package className="w-4 h-4" />
                      Service Categories ({uploadCategories.filter(c => c.type === 'service').length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {uploadCategories.filter(c => c.type === 'service').map((cat) => (
                        <div
                          key={cat.id}
                          className={`border transition-all duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'
                          } shadow-sm`}
                          style={{ borderRadius: '2px' }}
                        >
                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className={`text-sm font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {cat.name}
                              </h5>
                              <span
                                className={`text-[8px] px-1.5 py-0.5 border font-bold uppercase ${
                                  darkMode
                                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                    : 'bg-purple-50 border-purple-200 text-purple-700'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                Service
                              </span>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => startEditingUploadCat(cat)}
                                className={`flex items-center justify-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
                                  darkMode
                                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
                                    : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/50'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUploadCat(cat.id)}
                                className={`flex items-center justify-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-colors flex-1 ${
                                  darkMode
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                    : 'bg-red-50 border-red-200 text-red-655 hover:bg-red-100/50'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
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
              <div
                className={`p-4 border transition-all duration-300 ${
                  phaseMsg.startsWith('✅')
                    ? darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-455' : 'bg-emerald-50 border-emerald-500/10 text-emerald-600'
                    : darkMode ? 'bg-red-500/10 border-red-500/20 text-red-455' : 'bg-red-50 border-red-200 text-red-655'
                }`}
                style={{ borderRadius: '2px' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {phaseMsg.startsWith('✅') ? (
                      <Check className={`w-5 h-5 ${darkMode ? 'text-emerald-455' : 'text-green-600'}`} />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm font-semibold">{phaseMsg}</span>
                  </div>
                  <button onClick={() => setPhaseMsg('')} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Create Phase Form */}
            <div
              className={`border transition-all duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'
              } shadow-sm overflow-hidden`}
              style={{ borderRadius: '2px' }}
            >
              <div
                className={`px-6 py-4 border-b ${
                  darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                } flex justify-between items-center`}
              >
                <h3 className={`text-base font-bold uppercase tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Create App Phase
                </h3>
              </div>

              <form onSubmit={handleCreatePhase} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Phase Key <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPhaseName}
                      onChange={(e) => setNewPhaseName(e.target.value)}
                      placeholder="e.g. phase_1 or marketplace"
                      required
                      className={`w-full p-2.5 border text-sm ${
                        darkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                      style={{ borderRadius: '2px' }}
                    />
                    <p className={`text-[9px] font-bold uppercase mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Lowercase snake_case. Cannot be changed after creation.
                    </p>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Label <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPhaseLabel}
                      onChange={(e) => setNewPhaseLabel(e.target.value)}
                      placeholder="e.g. Phase 1 – Core Features"
                      required
                      className={`w-full p-2.5 border text-sm ${
                        darkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                      style={{ borderRadius: '2px' }}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Description (optional)
                  </label>
                  <textarea
                    value={newPhaseDesc}
                    onChange={(e) => setNewPhaseDesc(e.target.value)}
                    placeholder="What features does this phase enable?"
                    className={`w-full p-2.5 border text-sm ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-550'
                        : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                    } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all h-24`}
                    style={{ borderRadius: '2px' }}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className={`px-6 py-2 font-semibold text-xs transition-colors uppercase tracking-wider border flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Phase</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Phase List */}
            <div
              className={`border transition-all duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'
              } shadow-sm overflow-hidden`}
              style={{ borderRadius: '2px' }}
            >
              <div
                className={`px-6 py-4 border-b ${
                  darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                } flex justify-between items-center`}
              >
                <h3 className={`text-base font-bold uppercase tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  All Phases
                  <span
                    className={`text-xs px-2 py-0.5 border font-bold uppercase ${
                      darkMode ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {phases.length} phases
                  </span>
                </h3>
              </div>

              <div className="p-6">
                {phases.length === 0 ? (
                  <div
                    className={`text-center py-12 border-2 border-dashed ${
                      darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-white/50'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      No phases yet
                    </h4>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Create a phase above to start managing your app rollout
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {phases.map((phase) => (
                      <div
                        key={phase.id}
                        className={`border transition-all duration-300 ${
                          phase.is_enabled
                            ? darkMode
                              ? 'bg-emerald-950/20 border-emerald-800'
                              : 'bg-emerald-50/50 border-emerald-200'
                            : darkMode
                            ? 'bg-gray-900 border-gray-750'
                            : 'bg-white border-gray-200'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        {editingPhaseId === phase.id ? (
                          /* Inline edit form */
                          <form onSubmit={handleUpdatePhase} className="p-5 space-y-4">
                            <div>
                              <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-650'}`}>
                                Label
                              </label>
                              <input
                                type="text"
                                value={editPhaseLabel}
                                onChange={(e) => setEditPhaseLabel(e.target.value)}
                                required
                                className={`w-full p-2 border text-xs ${
                                  darkMode
                                    ? 'bg-gray-900 border-gray-700 text-white focus:ring-1 focus:ring-emerald-500'
                                    : 'bg-white border-gray-250 text-gray-900 focus:ring-1 focus:ring-emerald-500'
                                }`}
                                style={{ borderRadius: '2px' }}
                              />
                            </div>
                            <div>
                              <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                                Description
                              </label>
                              <textarea
                                value={editPhaseDesc}
                                onChange={(e) => setEditPhaseDesc(e.target.value)}
                                className={`w-full p-2 border text-xs h-16 ${
                                  darkMode
                                    ? 'bg-gray-900 border-gray-700 text-white focus:ring-1 focus:ring-emerald-500'
                                    : 'bg-white border-gray-250 text-gray-900 focus:ring-1 focus:ring-emerald-500'
                                }`}
                                style={{ borderRadius: '2px' }}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm"
                                style={{ borderRadius: '2px' }}
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingPhaseId(null); setPhaseMsg(''); }}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                                  darkMode
                                    ? 'bg-gray-800 border-gray-755 text-gray-300 hover:bg-gray-700'
                                    : 'bg-white border-gray-250 text-gray-750 hover:bg-gray-50'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="p-5 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className={`text-base font-bold uppercase tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {phase.label}
                                </h3>
                                <p className="text-[10px] text-gray-400 font-mono mt-1">{phase.name}</p>
                              </div>
                              <span
                                className={`text-[8px] px-1.5 py-0.5 border font-bold uppercase shrink-0 ${
                                  phase.is_enabled
                                    ? darkMode
                                      ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20'
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-500/10'
                                    : darkMode
                                    ? 'bg-gray-900/80 border-gray-700 text-gray-550'
                                    : 'bg-gray-100 border-gray-200 text-gray-500'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                {phase.is_enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>

                            {phase.description && (
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
                                {phase.description}
                              </p>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={() => handleTogglePhase(phase.id)}
                                title={phase.is_enabled ? 'Disable phase' : 'Enable phase'}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                                  phase.is_enabled
                                    ? darkMode
                                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-450 hover:bg-emerald-500/20'
                                      : 'bg-emerald-50 border-emerald-500/20 text-emerald-600 hover:bg-emerald-100/50'
                                    : darkMode
                                    ? 'bg-gray-800 border-gray-750 text-gray-400 hover:bg-gray-700/50'
                                    : 'bg-white border-gray-250 text-gray-600 hover:bg-gray-55'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                {phase.is_enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                <span>{phase.is_enabled ? 'On' : 'Off'}</span>
                              </button>
                              <button
                                onClick={() => startEditingPhase(phase)}
                                className={`flex items-center justify-center p-2 border transition-colors ${
                                  darkMode
                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                                    : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100/50'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePhase(phase.id, phase.label)}
                                className={`flex items-center justify-center p-2 border transition-colors ${
                                  darkMode
                                    ? 'bg-red-500/10 border-red-500/20 text-red-455 hover:bg-red-500/20'
                                    : 'bg-red-50 border-red-200 text-red-655 hover:bg-red-100/50'
                                }`}
                                style={{ borderRadius: '2px' }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
            <div
              className={`p-4 border ${
                darkMode ? 'bg-blue-950/20 border-blue-900 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider mb-2">
                    How to gate a feature behind a phase
                  </h4>
                  <p className="text-xs mb-2 leading-relaxed">
                    Import <code className={`px-1 py-0.5 font-mono text-xs border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-blue-100'}`} style={{ borderRadius: '2px' }}>usePhases</code> from <code className={`px-1 py-0.5 font-mono text-xs border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-blue-100'}`} style={{ borderRadius: '2px' }}>@/context/PhaseContext</code> in any component:
                  </p>
                  <pre
                    className={`p-3 text-xs overflow-x-auto border ${
                      darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-blue-250 text-gray-700'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {`const { isPhaseEnabled } = usePhases();
if (!isPhaseEnabled('phase_1')) return null; // 👈 feature hidden until enabled`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shops Tab */}
        {activeTab === 'shops' && (
          <div className="max-w-xl mx-auto text-center py-12 px-6">
            <div className={`p-8 border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`} style={{ borderRadius: '2px' }}>
              <Store className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className={`text-lg font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Unified Plan Manager
              </h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Shop categories and their monthly VIP plans have been integrated into the central subscriptions and plan manager.
              </p>
              <a
                href="/admin/upgrade/subscriptions"
                className="inline-flex items-center gap-2 px-6 py-3 font-bold uppercase text-xs tracking-wider transition-colors bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                style={{ borderRadius: '2px' }}
              >
                <span>Go to Subscriptions & Plans</span>
              </a>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Agent Configurations Card */}
            <div className={`border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`} style={{ borderRadius: '2px' }}>
              <h3 className={`text-base font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Agent Reward & Cashout settings
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                Configure referral rewards and minimum withdrawal amounts applied globally to all agents.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                      Referral Code Claim Reward (RWF)
                    </label>
                    <input
                      type="number"
                      required
                      value={referralRewardAmount}
                      onChange={(e) => setReferralRewardAmount(Number(e.target.value))}
                      disabled={!isEditingSettings || savingSettings}
                      className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                        ${darkMode 
                          ? 'bg-gray-900 border-gray-750 text-white focus:border-emerald-500' 
                          : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
                      style={{ borderRadius: '2px' }}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
                      Minimum Cashout Limit (RWF)
                    </label>
                    <input
                      type="number"
                      required
                      value={minimumWithdrawalAmount}
                      onChange={(e) => setMinimumWithdrawalAmount(Number(e.target.value))}
                      disabled={!isEditingSettings || savingSettings}
                      className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                        ${darkMode 
                          ? 'bg-gray-900 border-gray-750 text-white focus:border-emerald-500' 
                          : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
                      style={{ borderRadius: '2px' }}
                    />
                  </div>
                </div>

                {settingsMessage && (
                  <div className={`p-3 border text-xs font-semibold ${
                    settingsMessage.startsWith('✅') 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-red-500/10 border-red-500/20 text-red-500'}`} 
                    style={{ borderRadius: '2px' }}
                  >
                    {settingsMessage}
                  </div>
                )}

                <div className="flex gap-2">
                  {!isEditingSettings ? (
                    <button
                      key="edit-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditingSettings(true);
                        setSettingsMessage('');
                      }}
                      className={`py-2 px-6 text-white font-bold text-xs uppercase tracking-wider transition-colors border bg-emerald-500 hover:bg-emerald-600 border-emerald-500`}
                      style={{ borderRadius: '2px' }}
                    >
                      Edit Settings
                    </button>
                  ) : (
                    <>
                      <button
                        key="save-btn"
                        type="submit"
                        disabled={savingSettings}
                        className={`py-2 px-6 text-white font-bold text-xs uppercase tracking-wider transition-colors border
                          ${savingSettings
                            ? 'bg-gray-450 border-gray-455 text-gray-200 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        {savingSettings ? 'Saving...' : 'Save Settings'}
                      </button>
                      <button
                        key="cancel-btn"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditingSettings(false);
                          setSettingsMessage('');
                          fetchSettings();
                        }}
                        disabled={savingSettings}
                        className={`py-2 px-6 font-bold text-xs uppercase tracking-wider transition-colors border
                          ${darkMode
                            ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-300'
                            : 'bg-white hover:bg-gray-55 border-gray-300 text-gray-600'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>

            {/* Withdrawal Requests */}
            <div className={`border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`} style={{ borderRadius: '2px' }}>
              <h3 className={`text-base font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Agent Withdrawal Requests
              </h3>
              
              {withdrawalsList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No withdrawal requests found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3">Agent</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Recipient Phone</th>
                        <th className="pb-3">Registered Name</th>
                        <th className="pb-3">Requested At</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-755 text-gray-700 dark:text-gray-300">
                      {withdrawalsList.map((w: any) => (
                        <tr key={w.id}>
                          <td className="py-3">
                            <span className="font-bold">{w.agent_username}</span>
                            <div className="text-[10px] text-gray-500">{w.agent_email} ({w.agent_location})</div>
                          </td>
                          <td className="py-3 font-bold text-emerald-500">RWF {parseFloat(w.amount).toLocaleString()}</td>
                          <td className="py-3 font-mono">{w.phone_number}</td>
                          <td className="py-3">{w.phone_name}</td>
                          <td className="py-3 text-gray-500">{new Date(w.created_at).toLocaleString()}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase
                              ${w.status === 'approved' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                : w.status === 'rejected' 
                                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}
                              style={{ borderRadius: '2px' }}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {w.status === 'pending' && (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveWithdrawal(w.id)}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider text-[9px]"
                                  style={{ borderRadius: '2px' }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(w.id)}
                                  className="px-2.5 py-1 bg-red-500 hover:bg-red-655 text-white font-bold uppercase tracking-wider text-[9px]"
                                  style={{ borderRadius: '2px' }}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Registered Agents List */}
            <div className={`border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`} style={{ borderRadius: '2px' }}>
              <h3 className={`text-base font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Registered HafiConnect Agents
              </h3>
              
              {agentsList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No agents registered.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3">Agent</th>
                        <th className="pb-3">Email / Phone</th>
                        <th className="pb-3">Sector Location</th>
                        <th className="pb-3 text-right">Current Balance</th>
                        <th className="pb-3 text-right">Total Claims</th>
                        <th className="pb-3 text-right">Withdrawals</th>
                        <th className="pb-3 text-right">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-755 text-gray-700 dark:text-gray-300">
                      {agentsList.map((a: any) => (
                        <tr key={a.id}>
                          <td className="py-3">
                            <span className="font-bold">{a.name || 'No Name'}</span>
                            <div className="text-[10px] text-gray-500">@{a.username}</div>
                          </td>
                          <td className="py-3">
                            <div>{a.email}</div>
                            <div className="text-[10px] text-gray-500">{a.phone_number || 'No Phone'}</div>
                          </td>
                          <td className="py-3 font-semibold">{a.location}</td>
                          <td className="py-3 text-right font-extrabold text-emerald-500">RWF {parseFloat(a.balance).toLocaleString()}</td>
                          <td className="py-3 text-right font-bold">{a.referrals_claimed}</td>
                          <td className="py-3 text-right">{a.withdrawals_count} requests</td>
                          <td className="py-3 text-right text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}