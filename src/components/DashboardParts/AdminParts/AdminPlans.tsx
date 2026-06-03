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
  ArrowLeft
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
          <div className={`p-3 rounded-2xl ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
              : 'bg-gradient-to-br from-blue-500 to-purple-500'
          } shadow-lg`}>
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Storage Plans Management
            </h1>
            <p className={`text-lg mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage subscription plans and storage pricing
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex space-x-1 p-1 rounded-2xl max-w-md ${
          darkMode ? 'bg-gray-800' : 'bg-white shadow-sm border border-gray-200'
        }`}>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex-1 ${
              activeTab === 'plans'
                ? darkMode 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-blue-500 text-white shadow-lg'
                : darkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Storage Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('storage-pricing')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex-1 ${
              activeTab === 'storage-pricing'
                ? darkMode 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'bg-green-500 text-white shadow-lg'
                : darkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span>Storage Pricing</span>
          </button>
        </div>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          {/* Plan Form Card */}
          <div id="plan-form" className={`rounded-3xl shadow-2xl border-2 backdrop-blur-sm transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-800/80 border-gray-700' 
              : 'bg-white/90 border-gray-200'
          }`}>
            <div className={`p-8 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${
                    darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                  }`}>
                    {editingId ? (
                      <Edit3 className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Plus className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {editingId ? 'Edit Storage Plan' : 'Create New Storage Plan'}
                    </h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {editingId ? 'Update existing plan details' : 'Configure a new subscription plan'}
                    </p>
                  </div>
                </div>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                      darkMode 
                        ? 'text-gray-400 hover:bg-gray-700' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Plan Name (Internal)
                    </label>
                    <div className="relative">
                      <Shield className={`absolute left-3 top-3 w-5 h-5 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <input
                        type="text"
                        placeholder="e.g., BASIC, PREMIUM"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Display Name
                    </label>
                    <div className="relative">
                      <FileText className={`absolute left-3 top-3 w-5 h-5 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <input
                        type="text"
                        placeholder="e.g., Basic Plan, Premium Plan"
                        value={form.display_name}
                        onChange={e => setForm({ ...form, display_name: e.target.value })}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className={`p-6 rounded-2xl ${
                  darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                    darkMode ? 'text-blue-400' : 'text-blue-700'
                  }`}>
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pricing Configuration
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        Monthly Price ($)
                      </label>
                      <div className="relative">
                        <DollarSign className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-blue-400' : 'text-blue-500'
                        }`} />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.price_monthly}
                          onChange={e => setForm({ ...form, price_monthly: e.target.value })}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-blue-600 text-white' 
                              : 'bg-white border-blue-300 text-gray-900'
                          }`}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        Yearly Price ($)
                      </label>
                      <div className="relative">
                        <Calendar className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-blue-400' : 'text-blue-500'
                        }`} />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.price_yearly}
                          onChange={e => setForm({ ...form, price_yearly: e.target.value })}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-blue-600 text-white' 
                              : 'bg-white border-blue-300 text-gray-900'
                          }`}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storage Configuration */}
                <div className={`p-6 rounded-2xl ${
                  darkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                    darkMode ? 'text-purple-400' : 'text-purple-700'
                  }`}>
                    <HardDrive className="w-5 h-5 mr-2" />
                    Storage Configuration
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-purple-300' : 'text-purple-700'
                      }`}>
                        Base Storage (MB)
                      </label>
                      <div className="relative">
                        <Database className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-purple-400' : 'text-purple-500'
                        }`} />
                        <input
                          type="number"
                          placeholder="100"
                          value={form.base_storage_mb}
                          onChange={e => setForm({ ...form, base_storage_mb: e.target.value })}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-purple-600 text-white' 
                              : 'bg-white border-purple-300 text-gray-900'
                          }`}
                          required
                        />
                      </div>
                      {form.base_storage_mb && (
                        <p className={`text-xs mt-2 ${
                          darkMode ? 'text-purple-300' : 'text-purple-600'
                        }`}>
                          {(Number(form.base_storage_mb) / 1024).toFixed(2)} GB total storage
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-purple-300' : 'text-purple-700'
                      }`}>
                        Max File Size (MB)
                      </label>
                      <div className="relative">
                        <Upload className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-purple-400' : 'text-purple-500'
                        }`} />
                        <input
                          type="number"
                          placeholder="50"
                          value={form.max_file_size_mb}
                          onChange={e => setForm({ ...form, max_file_size_mb: e.target.value })}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-purple-600 text-white' 
                              : 'bg-white border-purple-300 text-gray-900'
                          }`}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Limits */}
                <div className={`p-6 rounded-2xl ${
                  darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                    darkMode ? 'text-green-400' : 'text-green-700'
                  }`}>
                    <Settings className="w-5 h-5 mr-2" />
                    Upload Limits
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-green-300' : 'text-green-700'
                      }`}>
                        Max Products
                      </label>
                      <div className="relative">
                        <ShoppingBag className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-green-400' : 'text-green-500'
                        }`} />
                        <input
                          type="number"
                          placeholder="Unlimited (leave empty)"
                          value={form.max_products}
                          onChange={e => setForm({ ...form, max_products: e.target.value })}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-green-600 text-white placeholder-green-400' 
                              : 'bg-white border-green-300 text-gray-900 placeholder-green-500'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-green-300' : 'text-green-700'
                      }`}>
                        Max Services
                      </label>
                      <div className="relative">
                        <Wrench className={`absolute left-3 top-3 w-5 h-5 ${
                          darkMode ? 'text-green-400' : 'text-green-500'
                        }`} />
                        <input
                          type="number"
                          placeholder="Unlimited (leave empty)"
                          value={form.max_services}
                          onChange={e => setForm({ ...form, max_services: e.target.value })}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-green-600 text-white placeholder-green-400' 
                              : 'bg-white border-green-300 text-gray-900 placeholder-green-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className={`p-6 rounded-2xl ${
                  darkMode ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                    darkMode ? 'text-orange-400' : 'text-orange-700'
                  }`}>
                    <Zap className="w-5 h-5 mr-2" />
                    Feature Access
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/50 dark:bg-gray-700/50">
                      <input
                        type="checkbox"
                        id="can_upload_videos"
                        checked={form.can_upload_videos}
                        onChange={e => setForm({ ...form, can_upload_videos: e.target.checked })}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                      />
                      <label htmlFor="can_upload_videos" className={`flex items-center space-x-2 font-medium ${
                        darkMode ? 'text-orange-300' : 'text-orange-700'
                      }`}>
                        <Upload className="w-4 h-4" />
                        <span>Allow Video Uploads</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/50 dark:bg-gray-700/50">
                      <input
                        type="checkbox"
                        id="can_use_analytics"
                        checked={form.can_use_analytics}
                        onChange={e => setForm({ ...form, can_use_analytics: e.target.checked })}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                      />
                      <label htmlFor="can_use_analytics" className={`flex items-center space-x-2 font-medium ${
                        darkMode ? 'text-orange-300' : 'text-orange-700'
                      }`}>
                        <BarChart3 className="w-4 h-4" />
                        <span>Analytics Access</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Sort Order
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.sort_order}
                      onChange={e => setForm({ ...form, sort_order: e.target.value })}
                      className={`w-full p-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/50 dark:bg-gray-700/50">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={form.is_active}
                      onChange={e => setForm({ ...form, is_active: e.target.checked })}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-all duration-200"
                    />
                    <label htmlFor="is_active" className={`flex items-center space-x-2 font-medium ${
                      darkMode ? 'text-green-300' : 'text-green-700'
                    }`}>
                      <Check className="w-4 h-4" />
                      <span>Plan Active</span>
                    </label>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Plan Features (comma separated)
                  </label>
                  <div className="relative">
                    <Star className={`absolute left-3 top-3 w-5 h-5 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <textarea
                      placeholder="e.g., Unlimited products, Video uploads, Analytics, Priority support"
                      value={form.features}
                      onChange={e => setForm({ ...form, features: e.target.value })}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } h-20`}
                      required
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                    } shadow-lg hover:shadow-blue-500/25`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : editingId ? (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Update Plan</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
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
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <Package className="w-6 h-6 mr-3" />
              Current Storage Plans
              <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {plans.length} plans
              </span>
            </h3>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`rounded-3xl border-2 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                    darkMode 
                      ? 'bg-gray-800/80 border-gray-700' 
                      : 'bg-white/90 border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {plan.display_name || plan.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {plan.name}
                          </span>
                          {!plan.is_active && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                            }`}>
                              INACTIVE
                            </span>
                          )}
                        </div>

                        {/* Pricing Card */}
                        <div className={`p-4 rounded-2xl mb-4 ${
                          darkMode ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50' : 'bg-gradient-to-r from-blue-50 to-purple-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`text-2xl font-bold ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                ${plan.price_monthly}
                                <span className={`text-sm font-normal ${
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>/month</span>
                              </div>
                              <div className={`text-lg ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                ${plan.price_yearly}/year
                              </div>
                            </div>
                            <div className={`p-3 rounded-xl ${
                              darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                            }`}>
                              <HardDrive className="w-6 h-6 text-blue-500" />
                            </div>
                          </div>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className={`p-3 rounded-xl ${
                            darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                          }`}>
                            <div className={`text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Storage</div>
                            <div className="font-bold">{(plan.base_storage_mb / 1024).toFixed(2)} GB</div>
                          </div>
                          <div className={`p-3 rounded-xl ${
                            darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                          }`}>
                            <div className={`text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Max File</div>
                            <div className="font-bold">{plan.max_file_size_mb} MB</div>
                          </div>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {plan.can_upload_videos && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                              darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                            }`}>
                              <Upload className="w-3 h-3" />
                              <span>Videos</span>
                            </span>
                          )}
                          {plan.can_use_analytics && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                              darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                            }`}>
                              <BarChart3 className="w-3 h-3" />
                              <span>Analytics</span>
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {plan.max_products || '∞'} Products
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            darkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {plan.max_services || '∞'} Services
                          </span>
                        </div>

                        {/* Features List */}
                        <div className={`p-3 rounded-xl ${
                          darkMode ? 'bg-gray-700/30' : 'bg-gray-50'
                        }`}>
                          <div className={`text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Features:</div>
                          <p className={`text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {Array.isArray(plan.features) ? plan.features.join(", ") : plan.features}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t" style={{ borderColor: darkMode ? '#374151' : '#E5E7EB' }}>
                      <button
                        onClick={() => startEditing(plan)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                          darkMode 
                            ? 'bg-yellow-900/30 text-yellow-300 hover:bg-yellow-800/50' 
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                          darkMode 
                            ? 'bg-red-900/30 text-red-300 hover:bg-red-800/50' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className={`rounded-3xl shadow-2xl border-2 backdrop-blur-sm transition-all duration-300 ${
          darkMode 
            ? 'bg-gray-800/80 border-gray-700' 
            : 'bg-white/90 border-gray-200'
        }`}>
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2 rounded-xl ${
                darkMode ? 'bg-green-900/50' : 'bg-green-100'
              }`}>
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Extra Storage Pricing</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Configure pricing for additional storage beyond plan limits
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Monthly Pricing */}
              <div className={`p-6 rounded-2xl border-2 ${
                darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                    Monthly Pricing
                  </h3>
                </div>
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  Price per GB ($)
                </label>
                <div className="relative">
                  <DollarSign className={`absolute left-3 top-3 w-5 h-5 ${
                    darkMode ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                  <input
                    type="number"
                    step="0.01"
                    value={storagePricing.price_per_gb_monthly}
                    onChange={e => setStoragePricing({
                      ...storagePricing, 
                      price_per_gb_monthly: Number(e.target.value)
                    })}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-blue-600 text-white' 
                        : 'bg-white border-blue-300 text-gray-900'
                    }`}
                  />
                </div>
                <p className={`text-xs mt-2 ${
                  darkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  Users pay this amount per GB of extra storage monthly
                </p>
              </div>

              {/* Yearly Pricing */}
              <div className={`p-6 rounded-2xl border-2 ${
                darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                    Yearly Pricing
                  </h3>
                </div>
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-green-300' : 'text-green-700'
                }`}>
                  Price per GB ($)
                </label>
                <div className="relative">
                  <DollarSign className={`absolute left-3 top-3 w-5 h-5 ${
                    darkMode ? 'text-green-400' : 'text-green-500'
                  }`} />
                  <input
                    type="number"
                    step="0.01"
                    value={storagePricing.price_per_gb_yearly}
                    onChange={e => setStoragePricing({
                      ...storagePricing, 
                      price_per_gb_yearly: Number(e.target.value)
                    })}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-green-600 text-white' 
                        : 'bg-white border-green-300 text-gray-900'
                    }`}
                  />
                </div>
                <p className={`text-xs mt-2 ${
                  darkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  Yearly pricing typically offers savings
                </p>
              </div>
            </div>

            {/* Pricing Preview */}
            <div className={`p-6 rounded-2xl mb-8 ${
              darkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                darkMode ? 'text-purple-400' : 'text-purple-700'
              }`}>
                <Zap className="w-5 h-5 mr-2" />
                Pricing Preview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl text-center ${
                  darkMode ? 'bg-gray-700/50' : 'bg-white'
                }`}>
                  <div className="font-bold text-lg mb-2">1 GB Extra</div>
                  <div className="text-sm">Monthly: <span className="font-bold">${storagePricing.price_per_gb_monthly}</span></div>
                  <div className="text-sm">Yearly: <span className="font-bold">${storagePricing.price_per_gb_yearly}</span></div>
                </div>
                <div className={`p-4 rounded-xl text-center ${
                  darkMode ? 'bg-gray-700/50' : 'bg-white'
                }`}>
                  <div className="font-bold text-lg mb-2">5 GB Extra</div>
                  <div className="text-sm">Monthly: <span className="font-bold">${(storagePricing.price_per_gb_monthly * 5).toFixed(2)}</span></div>
                  <div className="text-sm">Yearly: <span className="font-bold">${(storagePricing.price_per_gb_yearly * 5).toFixed(2)}</span></div>
                </div>
                <div className={`p-4 rounded-xl text-center ${
                  darkMode ? 'bg-gray-700/50' : 'bg-white'
                }`}>
                  <div className="font-bold text-lg mb-2">10 GB Extra</div>
                  <div className="text-sm">Monthly: <span className="font-bold">${(storagePricing.price_per_gb_monthly * 10).toFixed(2)}</span></div>
                  <div className="text-sm">Yearly: <span className="font-bold">${(storagePricing.price_per_gb_yearly * 10).toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            <button
              id="save-pricing-btn"
              onClick={updateStoragePricing}
              disabled={isSubmitting}
              className={`flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode 
                  ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white' 
                  : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white'
              } shadow-lg hover:shadow-green-500/25`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
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