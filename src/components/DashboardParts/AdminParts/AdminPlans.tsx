import { useEffect, useState } from "react";
import { useDarkMode } from "@/context/DarkMode";
import { 
  Package, 
  DollarSign, 
  Database, 
  Upload, 
  BarChart3, 
  Settings,
  Edit3,
  Trash2,
  Plus,
  X,
  Check,
  Zap,
  Shield,
  Star,
  Calendar,
  HardDrive,
  FileText,
  ShoppingBag,
  Wrench,
  Save,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Crown
} from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  base_storage_mb: number;
  max_file_size_mb: number;
  max_products: number | null;
  max_services: number | null;
  can_upload_videos: boolean;
  can_use_analytics: boolean;
  is_active: boolean;
  sort_order: number;
  features: string[];
  fee: number;
}

interface StoragePricing {
  price_per_gb_monthly: number;
  price_per_gb_yearly: number;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [storagePricing, setStoragePricing] = useState<StoragePricing>({
    price_per_gb_monthly: 2.99,
    price_per_gb_yearly: 29.99
  });
  
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    price_monthly: "",
    price_yearly: "",
    base_storage_mb: "",
    max_file_size_mb: "",
    max_products: "",
    max_services: "",
    can_upload_videos: false,
    can_use_analytics: false,
    is_active: true,
    sort_order: "",
    features: ""
  });
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'storage-pricing'>('plans');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem("token");

  const { darkMode } = useDarkMode();

  // ✅ Fetch storage pricing
  async function fetchStoragePricing() {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/admin/storage-pricing", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStoragePricing({
          price_per_gb_monthly: data.price_per_gb_monthly,
          price_per_gb_yearly: data.price_per_gb_yearly,
        });
      }
    } catch (err) {
      console.error("Error fetching storage pricing:", err);
    }
  }

  // ✅ Update storage pricing
  async function updateStoragePricing() {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/storage-pricing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(storagePricing),
      });
      if (res.ok) {
        // Show success animation
        const button = document.getElementById('save-pricing-btn');
        if (button) {
          button.classList.add('animate-success');
          setTimeout(() => button.classList.remove('animate-success'), 2000);
        }
      } else {
        throw new Error("Failed to update pricing");
      }
    } catch (err) {
      console.error("Error updating storage pricing:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ✅ Fetch plans from backend
  async function fetchPlans() {
    if (!token) {
      alert("You are not logged in");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin/plans", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setPlans(data);
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  }

  // ✅ Create or Update plan
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId
        ? `http://localhost:5000/api/admin/update_plans/${editingId}`
        : "http://localhost:5000/api/admin/create_plans";

      const method = editingId ? "PUT" : "POST";

      const planData = {
        name: form.name,
        display_name: form.display_name || form.name,
        price_monthly: Number(form.price_monthly) || 0,
        price_yearly: Number(form.price_yearly) || 0,
        base_storage_mb: Number(form.base_storage_mb) || 100,
        max_file_size_mb: Number(form.max_file_size_mb) || 50,
        max_products: form.max_products ? Number(form.max_products) : null,
        max_services: form.max_services ? Number(form.max_services) : null,
        can_upload_videos: form.can_upload_videos,
        can_use_analytics: form.can_use_analytics,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        features: form.features.split(",").map(f => f.trim()),
        fee: Number(form.price_monthly) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(planData),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Request failed");
      await res.json();

      resetForm();
      fetchPlans();
      
      // Show success animation
      const button = e.currentTarget.querySelector('button[type="submit"]');
      if (button) {
        button.classList.add('animate-success');
        setTimeout(() => button.classList.remove('animate-success'), 2000);
      }
    } catch (err) {
      console.error("Error saving plan:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ✅ Reset form
  function resetForm() {
    setForm({
      name: "",
      display_name: "",
      price_monthly: "",
      price_yearly: "",
      base_storage_mb: "",
      max_file_size_mb: "",
      max_products: "",
      max_services: "",
      can_upload_videos: false,
      can_use_analytics: false,
      is_active: true,
      sort_order: "",
      features: ""
    });
    setEditingId(null);
  }

  // ✅ Delete plan
  async function deletePlan(id: number) {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await fetch(`http://localhost:5000/api/admin/delete_plan/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchPlans();
    } catch (err) {
      console.error("Error deleting plan:", err);
    }
  }

  // ✅ Fill form for editing
  function startEditing(plan: Plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      display_name: plan.display_name || plan.name,
      price_monthly: plan.price_monthly?.toString() || "",
      price_yearly: plan.price_yearly?.toString() || "",
      base_storage_mb: plan.base_storage_mb?.toString() || "100",
      max_file_size_mb: plan.max_file_size_mb?.toString() || "50",
      max_products: plan.max_products?.toString() || "",
      max_services: plan.max_services?.toString() || "",
      can_upload_videos: plan.can_upload_videos || false,
      can_use_analytics: plan.can_use_analytics || false,
      is_active: plan.is_active !== false,
      sort_order: plan.sort_order?.toString() || "0",
      features: Array.isArray(plan.features) ? plan.features.join(", ") : plan.features || "",
    });
    
    // Scroll to form
    document.getElementById('plan-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    fetchPlans();
    fetchStoragePricing();
  }, []);

  return (
    <div className={`min-h-screen p-6 max-w-7xl mx-auto transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-emerald-500 shadow-md text-white" style={{ borderRadius: '2px' }}>
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-2xl font-extrabold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-950'}`}>
              Storage Plans Management
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage subscription plans and storage pricing
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex space-x-1 p-1 max-w-md border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`} style={{ borderRadius: '2px' }}>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center justify-center space-x-2 px-6 py-3 font-semibold uppercase text-xs tracking-wider transition-all duration-200 flex-1 ${
              activeTab === 'plans'
                ? 'bg-emerald-500 text-white shadow-sm'
                : darkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-100'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <Package className="w-4 h-4" />
            <span>Storage Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('storage-pricing')}
            className={`flex items-center justify-center space-x-2 px-6 py-3 font-semibold uppercase text-xs tracking-wider transition-all duration-200 flex-1 ${
              activeTab === 'storage-pricing'
                ? 'bg-emerald-500 text-white shadow-sm'
                : darkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-100'
            }`}
            style={{ borderRadius: '2px' }}
          >
            <DollarSign className="w-4 h-4" />
            <span>Storage Pricing</span>
          </button>
        </div>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          {/* Plan Form Card */}
          <div id="plan-form" className={`border transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200 shadow-sm'
          }`} style={{ borderRadius: '2px' }}>
            <div className={`p-8 border-b ${
              darkMode ? 'border-gray-800' : 'border-gray-150'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 ${
                    darkMode ? 'bg-emerald-950/40' : 'bg-emerald-50'
                  }`} style={{ borderRadius: '2px' }}>
                    {editingId ? (
                      <Edit3 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-gray-805">
                      {editingId ? 'Edit Storage Plan' : 'Create New Storage Plan'}
                    </h2>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {editingId ? 'Update existing plan details' : 'Configure a new subscription plan'}
                    </p>
                  </div>
                </div>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className={`p-2.5 transition-colors duration-200 ${
                      darkMode 
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-white' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                {!editingId && !plans.some(p => p.name === 'PREMIUM_SHOP') && (
                  <div className="p-4 border border-amber-550/20 bg-amber-550/10 text-amber-550 dark:text-amber-400 text-xs flex items-center justify-between mb-4" style={{ borderRadius: '2px' }}>
                    <div className="flex items-center space-x-2">
                      <Crown className="w-5 h-5 text-amber-500 animate-pulse animate-duration-1000" />
                      <div>
                        <span className="font-bold">Create Unified VIP Shop Plan?</span> Check this box to configure the single plan automatically assigned to custom shop categories.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.name === 'PREMIUM_SHOP'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({
                            ...form,
                            name: 'PREMIUM_SHOP',
                            display_name: 'VIP Shop Plan',
                            price_monthly: '15000',
                            price_yearly: '150000',
                            base_storage_mb: '1024',
                            max_file_size_mb: '100',
                            max_products: '100',
                            can_upload_videos: true,
                            can_use_analytics: true,
                            features: 'Up to 100 products, Video uploads supported, Premium analytics dashboard, VIP Shop category listing badge, 1GB base media storage allowance'
                          });
                        } else {
                          setForm({
                            ...form,
                            name: '',
                            display_name: '',
                            price_monthly: '',
                            price_yearly: '',
                            base_storage_mb: '100',
                            max_file_size_mb: '50',
                            max_products: '',
                            can_upload_videos: false,
                            can_use_analytics: false,
                            features: ''
                          });
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-700 text-amber-500 focus:ring-amber-550 w-4 h-4 cursor-pointer"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Plan Name (Internal Key)
                    </label>
                    <div className="relative">
                      <Shield className={`absolute left-3 top-3 w-5 h-5 ${
                        darkMode ? 'text-emerald-500' : 'text-emerald-600'
                      }`} />
                      <input
                        type="text"
                        placeholder="e.g., BASIC, PREMIUM"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                        disabled={editingId ? plans.find(p => p.id === editingId)?.name === 'PREMIUM_SHOP' : false}
                        className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-500 disabled:bg-gray-850 disabled:text-gray-500' 
                            : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
                        }`}
                        style={{ borderRadius: '2px' }}
                        required
                      />
                    </div>
                    {editingId && plans.find(p => p.id === editingId)?.name === 'PREMIUM_SHOP' && (
                      <p className="text-[10px] text-amber-550 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" />
                        Editing Unified VIP Shop Plan. Internal name key is locked to PREMIUM_SHOP.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Display Name
                    </label>
                    <div className="relative">
                      <FileText className={`absolute left-3 top-3 w-5 h-5 ${
                        darkMode ? 'text-emerald-500' : 'text-emerald-600'
                      }`} />
                      <input
                        type="text"
                        placeholder="e.g., Basic Plan, Premium Plan"
                        value={form.display_name}
                        onChange={e => setForm({ ...form, display_name: e.target.value })}
                        className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-500' 
                            : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                        }`}
                        style={{ borderRadius: '2px' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className={`p-6 border ${
                  darkMode ? 'bg-gray-850/40 border-gray-850' : 'bg-gray-50 border-gray-150'
                }`} style={{ borderRadius: '2px' }}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center ${
                    darkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pricing Configuration
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Monthly Price ($)
                      </label>
                      <div className="relative">
                        <DollarSign className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-emerald-500' : 'text-emerald-600'
                        }`} />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.price_monthly}
                          onChange={e => setForm({ ...form, price_monthly: e.target.value })}
                          className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                            darkMode 
                              ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-500' 
                              : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                          }`}
                          style={{ borderRadius: '2px' }}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Yearly Price ($)
                      </label>
                      <div className="relative">
                        <Calendar className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-emerald-500' : 'text-emerald-600'
                        }`} />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.price_yearly}
                          onChange={e => setForm({ ...form, price_yearly: e.target.value })}
                          className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                            darkMode 
                              ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-500' 
                              : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                          }`}
                          style={{ borderRadius: '2px' }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storage Configuration */}
                <div className={`p-6 border ${
                  darkMode ? 'bg-gray-850/40 border-gray-855' : 'bg-gray-50 border-gray-150'
                }`} style={{ borderRadius: '2px' }}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center ${
                    darkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    <HardDrive className="w-4 h-4 mr-2" />
                    Storage Configuration
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Base Storage (MB)
                      </label>
                      <div className="relative">
                        <Database className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-emerald-500' : 'text-emerald-600'
                        }`} />
                        <input
                          type="number"
                          placeholder="100"
                          value={form.base_storage_mb}
                          onChange={e => setForm({ ...form, base_storage_mb: e.target.value })}
                          className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                            darkMode 
                              ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-500' 
                              : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                          }`}
                          style={{ borderRadius: '2px' }}
                          required
                        />
                      </div>
                      {form.base_storage_mb && (
                        <p className={`text-xs font-semibold mt-2 ${
                          darkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          {(Number(form.base_storage_mb) / 1024).toFixed(2)} GB total storage
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Max File Size (MB)
                      </label>
                      <div className="relative">
                        <Upload className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-emerald-500' : 'text-emerald-600'
                        }`} />
                        <input
                          type="number"
                          placeholder="50"
                          value={form.max_file_size_mb}
                          onChange={e => setForm({ ...form, max_file_size_mb: e.target.value })}
                          className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                            darkMode 
                              ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-500' 
                              : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                          }`}
                          style={{ borderRadius: '2px' }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Limits */}
                <div className={`p-6 border ${
                  darkMode ? 'bg-gray-855/40 border-gray-855' : 'bg-gray-50 border-gray-150'
                }`} style={{ borderRadius: '2px' }}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center ${
                    darkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Upload Limits
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Max Products
                      </label>
                      <div className="relative">
                        <ShoppingBag className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-emerald-500' : 'text-emerald-600'
                        }`} />
                        <input
                          type="number"
                          placeholder="Unlimited (leave empty)"
                          value={form.max_products}
                          onChange={e => setForm({ ...form, max_products: e.target.value })}
                          className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                            darkMode 
                              ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-550' 
                              : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                          }`}
                          style={{ borderRadius: '2px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Max Services
                      </label>
                      <div className="relative">
                        <Wrench className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-emerald-500' : 'text-emerald-600'
                        }`} />
                        <input
                          type="number"
                          placeholder="Unlimited (leave empty)"
                          value={form.max_services}
                          onChange={e => setForm({ ...form, max_services: e.target.value })}
                          className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                            darkMode 
                              ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-550' 
                              : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                          }`}
                          style={{ borderRadius: '2px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className={`p-6 border ${
                  darkMode ? 'bg-gray-855/40 border-gray-855' : 'bg-gray-50 border-gray-150'
                }`} style={{ borderRadius: '2px' }}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center ${
                    darkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    <Zap className="w-4 h-4 mr-2" />
                    Feature Access
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-750 bg-white/50 dark:bg-gray-800/50" style={{ borderRadius: '2px' }}>
                      <input
                        type="checkbox"
                        id="can_upload_videos"
                        checked={form.can_upload_videos}
                        onChange={e => setForm({ ...form, can_upload_videos: e.target.checked })}
                        className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 transition-all duration-200"
                        style={{ borderRadius: '2px' }}
                      />
                      <label htmlFor="can_upload_videos" className={`flex items-center space-x-2 text-sm font-semibold cursor-pointer ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <Upload className="w-4 h-4 text-emerald-500" />
                        <span>Allow Video Uploads</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-750 bg-white/50 dark:bg-gray-800/50" style={{ borderRadius: '2px' }}>
                      <input
                        type="checkbox"
                        id="can_use_analytics"
                        checked={form.can_use_analytics}
                        onChange={e => setForm({ ...form, can_use_analytics: e.target.checked })}
                        className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 transition-all duration-200"
                        style={{ borderRadius: '2px' }}
                      />
                      <label htmlFor="can_use_analytics" className={`flex items-center space-x-2 text-sm font-semibold cursor-pointer ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                        <span>Analytics Access</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Sort Order
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.sort_order}
                      onChange={e => setForm({ ...form, sort_order: e.target.value })}
                      className={`w-full p-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      }`}
                      style={{ borderRadius: '2px' }}
                    />
                  </div>
                  <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-750 bg-white/50 dark:bg-gray-800/50 self-end" style={{ borderRadius: '2px', height: '46px' }}>
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={form.is_active}
                      onChange={e => setForm({ ...form, is_active: e.target.checked })}
                      className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 transition-all duration-200"
                      style={{ borderRadius: '2px' }}
                    />
                    <label htmlFor="is_active" className={`flex items-center space-x-2 text-sm font-semibold cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Plan Active</span>
                    </label>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Plan Features (comma separated)
                  </label>
                  <div className="relative">
                    <Star className={`absolute left-3 top-3 w-5 h-5 ${
                      darkMode ? 'text-emerald-500' : 'text-emerald-600'
                    }`} />
                    <textarea
                      placeholder="e.g., Unlimited products, Video uploads, Analytics, Priority support"
                      value={form.features}
                      onChange={e => setForm({ ...form, features: e.target.value })}
                      className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-750 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                      } h-20`}
                      style={{ borderRadius: '2px' }}
                      required
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center space-x-2 px-8 py-3.5 font-bold uppercase text-xs tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-emerald-50 hover:bg-emerald-600 text-white'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Saving...</span>
                      </>
                    ) : editingId ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Update Plan</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Plans List */}
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wider mb-6 flex items-center">
              <Package className="w-5 h-5 mr-3 text-emerald-500" />
              Current Storage Plans
              <span className={`ml-3 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-750 border border-gray-200'
              }`} style={{ borderRadius: '2px' }}>
                {plans.length} plans
              </span>
            </h3>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`border transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-800 hover:border-emerald-600/40' 
                      : 'bg-white border-gray-200 hover:border-emerald-500/40 shadow-sm'
                  }`}
                  style={{ animationDelay: `${index * 100}ms`, borderRadius: '2px' }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className={`font-bold text-lg uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {plan.display_name || plan.name}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                            darkMode ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-450' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`} style={{ borderRadius: '2px' }}>
                            {plan.name}
                          </span>
                          {!plan.is_active && (
                            <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                              darkMode ? 'bg-red-950/40 border-red-800/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                            }`} style={{ borderRadius: '2px' }}>
                              INACTIVE
                            </span>
                          )}
                        </div>

                        {/* Pricing Card */}
                        <div className={`p-4 border mb-4 ${
                          darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-gray-50 border-gray-150'
                        }`} style={{ borderRadius: '2px' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`text-2xl font-black tracking-tight ${
                                darkMode ? 'text-white' : 'text-gray-950'
                              }`}>
                                ${plan.price_monthly}
                                <span className={`text-xs font-bold uppercase tracking-wider ml-1 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>/month</span>
                              </div>
                              <div className={`text-sm font-semibold ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                ${plan.price_yearly}/year
                              </div>
                            </div>
                            <div className={`p-2.5 ${
                              darkMode ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                            }`} style={{ borderRadius: '2px' }}>
                              <HardDrive className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className={`p-3 border ${
                            darkMode ? 'bg-gray-850/30 border-gray-800' : 'bg-gray-50 border-gray-150'
                          }`} style={{ borderRadius: '2px' }}>
                            <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
                              darkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>Storage</div>
                            <div className="font-bold text-sm">{(plan.base_storage_mb / 1024).toFixed(2)} GB</div>
                          </div>
                          <div className={`p-3 border ${
                            darkMode ? 'bg-gray-855/30 border-gray-800' : 'bg-gray-50 border-gray-150'
                          }`} style={{ borderRadius: '2px' }}>
                            <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
                              darkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>Max File</div>
                            <div className="font-bold text-sm">{plan.max_file_size_mb} MB</div>
                          </div>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {plan.can_upload_videos && (
                            <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border flex items-center space-x-1 ${
                              darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                            }`} style={{ borderRadius: '2px' }}>
                              <Upload className="w-3 h-3 text-emerald-555" />
                              <span>Videos</span>
                            </span>
                          )}
                          {plan.can_use_analytics && (
                            <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border flex items-center space-x-1 ${
                              darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                            }`} style={{ borderRadius: '2px' }}>
                              <BarChart3 className="w-3 h-3 text-emerald-555" />
                              <span>Analytics</span>
                            </span>
                          )}
                          <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${
                            darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-750'
                          }`} style={{ borderRadius: '2px' }}>
                            {plan.max_products || '∞'} Products
                          </span>
                          <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${
                            darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-755'
                          }`} style={{ borderRadius: '2px' }}>
                            {plan.max_services || '∞'} Services
                          </span>
                        </div>

                        {/* Features List */}
                        <div className={`p-3 border ${
                          darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-150'
                        }`} style={{ borderRadius: '2px' }}>
                          <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Features:</div>
                          <p className={`text-sm font-semibold ${
                            darkMode ? 'text-gray-300' : 'text-gray-750'
                          }`}>
                            {Array.isArray(plan.features) ? plan.features.join(", ") : plan.features}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t" style={{ borderColor: darkMode ? '#1F2937' : '#E5E7EB' }}>
                      <button
                        onClick={() => startEditing(plan)}
                        className={`flex items-center space-x-1.5 px-4 py-2 font-bold uppercase text-xs tracking-wider transition-colors duration-200 ${
                          darkMode 
                            ? 'bg-gray-800 text-yellow-500 hover:bg-gray-750' 
                            : 'bg-gray-100 text-yellow-600 hover:bg-gray-200'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        className={`flex items-center space-x-1.5 px-4 py-2 font-bold uppercase text-xs tracking-wider transition-colors duration-200 ${
                          darkMode 
                            ? 'bg-gray-800 text-red-400 hover:bg-gray-750' 
                            : 'bg-gray-100 text-red-500 hover:bg-gray-200'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

      {/* Storage Pricing Tab */}
      {activeTab === 'storage-pricing' && (
        <div className={`border transition-all duration-300 ${
          darkMode 
            ? 'bg-gray-900 border-gray-800' 
            : 'bg-white border-gray-200 shadow-sm'
        }`} style={{ borderRadius: '2px' }}>
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2.5 ${
                darkMode ? 'bg-emerald-950/40' : 'bg-emerald-50'
              }`} style={{ borderRadius: '2px' }}>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-805">Extra Storage Pricing</h2>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Configure pricing for additional storage beyond plan limits
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Monthly Pricing */}
              <div className={`p-6 border ${
                darkMode ? 'bg-gray-850/40 border-gray-800' : 'bg-gray-50 border-gray-150'
              }`} style={{ borderRadius: '2px' }}>
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    Monthly Pricing
                  </h3>
                </div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Price per GB ($)
                </label>
                <div className="relative">
                  <DollarSign className={`absolute left-3 top-3 w-5 h-5 ${
                    darkMode ? 'text-emerald-555' : 'text-emerald-600'
                  }`} />
                  <input
                    type="number"
                    step="0.01"
                    value={storagePricing.price_per_gb_monthly}
                    onChange={e => setStoragePricing({
                      ...storagePricing, 
                      price_per_gb_monthly: Number(e.target.value)
                    })}
                    className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-750 text-white' 
                        : 'bg-white border-gray-250 text-gray-900'
                    }`}
                    style={{ borderRadius: '2px' }}
                  />
                </div>
                <p className={`text-xs font-semibold mt-2 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Users pay this amount per GB of extra storage monthly
                </p>
              </div>

              {/* Yearly Pricing */}
              <div className={`p-6 border ${
                darkMode ? 'bg-gray-850/40 border-gray-850' : 'bg-gray-50 border-gray-150'
              }`} style={{ borderRadius: '2px' }}>
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    Yearly Pricing
                  </h3>
                </div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Price per GB ($)
                </label>
                <div className="relative">
                  <DollarSign className={`absolute left-3 top-3 w-5 h-5 ${
                    darkMode ? 'text-emerald-555' : 'text-emerald-600'
                  }`} />
                  <input
                    type="number"
                    step="0.01"
                    value={storagePricing.price_per_gb_yearly}
                    onChange={e => setStoragePricing({
                      ...storagePricing, 
                      price_per_gb_yearly: Number(e.target.value)
                    })}
                    className={`w-full pl-11 pr-4 py-2.5 border transition-all duration-250 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-750 text-white' 
                        : 'bg-white border-gray-250 text-gray-900'
                    }`}
                    style={{ borderRadius: '2px' }}
                  />
                </div>
                <p className={`text-xs font-semibold mt-2 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Yearly pricing typically offers savings
                </p>
              </div>
            </div>

            {/* Pricing Preview */}
            <div className={`p-6 border mb-8 ${
              darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-150'
            }`} style={{ borderRadius: '2px' }}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center ${
                darkMode ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                <Zap className="w-4 h-4 mr-2" />
                Pricing Preview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 border text-center ${
                  darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                }`} style={{ borderRadius: '2px' }}>
                  <div className="font-bold text-sm uppercase tracking-wider mb-2 text-gray-755">1 GB Extra</div>
                  <div className="text-sm">Monthly: <span className="font-bold">${storagePricing.price_per_gb_monthly}</span></div>
                  <div className="text-sm">Yearly: <span className="font-bold">${storagePricing.price_per_gb_yearly}</span></div>
                </div>
                <div className={`p-4 border text-center ${
                  darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                }`} style={{ borderRadius: '2px' }}>
                  <div className="font-bold text-sm uppercase tracking-wider mb-2 text-gray-755">5 GB Extra</div>
                  <div className="text-sm">Monthly: <span className="font-bold">${(storagePricing.price_per_gb_monthly * 5).toFixed(2)}</span></div>
                  <div className="text-sm">Yearly: <span className="font-bold">${(storagePricing.price_per_gb_yearly * 5).toFixed(2)}</span></div>
                </div>
                <div className={`p-4 border text-center ${
                  darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                }`} style={{ borderRadius: '2px' }}>
                  <div className="font-bold text-sm uppercase tracking-wider mb-2 text-gray-755">10 GB Extra</div>
                  <div className="text-sm">Monthly: <span className="font-bold">${(storagePricing.price_per_gb_monthly * 10).toFixed(2)}</span></div>
                  <div className="text-sm">Yearly: <span className="font-bold">${(storagePricing.price_per_gb_yearly * 10).toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            <button
              id="save-pricing-btn"
              onClick={updateStoragePricing}
              disabled={isSubmitting}
              className={`flex items-center space-x-2 px-8 py-3.5 font-bold uppercase text-xs tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-emerald-50 hover:bg-emerald-600 text-white'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Storage Pricing</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes success {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-success {
          animation: success 0.6s ease-in-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}