import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../LoadingSpinner";

import { API_BASE } from '../../api/apiClient';
import {
  AlertCircle,
  Building,
  CheckCircle,
  CreditCard,
  Smartphone,
  Wifi,
} from "lucide-react";



type MethodsShape = {
  mtn?: { phone?: string; registeredName?: string };
  airtel?: { phone?: string; registeredName?: string };
  momoPay?: { code?: string; registeredName?: string };
};

interface PaymentCredentialsProps {
  onSave?: (data: any) => void;
  className?: string;
  darkMode?: boolean;
  // when provided, component will display these methods instead of fetching
  methodsProp?: MethodsShape;
  // if true, hide edit controls and show read-only view
  readOnly?: boolean;
}

export default function PaymentSettingsCard({ className, darkMode = false, methodsProp, readOnly = false }: PaymentCredentialsProps) {
  const [methods, setMethods] = useState<MethodsShape>({});
  const [tempMethods, setTempMethods] = useState<MethodsShape>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingMethod, setEditingMethod] = useState<string | null>(null);

  const { token } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      // If methods are provided via props, use them (read-only use-case)
      if (methodsProp) {
        setMethods(methodsProp || {});
        setTempMethods(methodsProp || {});
        setLoading(false);
        return;
      }
      if (!token) {
        setError("Missing Authorization token");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/provider/get/credentials`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error((await res.json()).error || `Failed (${res.status})`);
        const data = await res.json();
        setMethods(data.methods || {});
        setTempMethods(data.methods || {});
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const setField = (method: string, field: string, value: string) =>
    setTempMethods((m) => ({ ...m, [method]: { ...(m as any)[method], [field]: value } }));

  const startEditing = (method: string) => {
    setError(null);
    setTempMethods((t) => ({ ...t, [method]: (methods as any)[method] || {} }));
    setEditingMethod(method);
  };

  const saveMethod = async (method: string) => {
    if (!token) return setError("Missing token");
    setError(null);
    try {
      const payload = {
        methods: { ...(methods || {}), [method]: (tempMethods as any)[method] || {} },
      };
      const res = await fetch(`${API_BASE}/api/provider/update/credentials`, {
        method: "PUT",
        headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || `Failed (${res.status})`);
      const data = await res.json();
      setMethods(data.methods || payload.methods);
      setTempMethods((t) => ({ ...(t || {}), ...(data.methods || {}) }));
      setEditingMethod(null);
      alert("Payment method saved successfully!");
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "mtn": return <Smartphone className="w-5 h-5 text-yellow-600" />;
      case "airtel": return <Wifi className="w-5 h-5 text-red-600" />;
      case "momoPay": return <Building className="w-5 h-5 text-blue-600" />;
      default: return <CreditCard className="w-5 h-5 text-gray-655" />;
    }
  };

  const getMethodDisplayName = (method: string) => {
    switch (method) {
      case "mtn": return "MTN Mobile Money";
      case "airtel": return "Airtel Money";
      case "momoPay": return "Mobile Money Pay";
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" message="Loading payment methods..." variant="dots" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Payment Methods Section */}
      <div className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-xs overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800 bg-gray-950/60' : 'border-[#E5E5E5] bg-[#F5F5F5]'}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-[#E5252A]' : 'bg-white border-[#E5E5E5] text-[#E5252A]'}`}>
              <CreditCard className="w-4 h-4 text-[#E5252A]" />
            </div>
            <h3 className={`text-sm font-bold uppercase tracking-wider ml-3 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
              Payment Methods
            </h3>
          </div>
          <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage your payment credentials securely
          </p>
        </div>

        <div className="p-6">
          {/* Grid Layout for Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {(["mtn", "airtel", "momoPay"] as (keyof MethodsShape)[]).map((method) => {
              const val: any = methods[method];
              const isEditing = editingMethod === method;

              return (
                <div 
                  key={method} 
                  className={`rounded-2xl border ${darkMode ? 'border-gray-800 bg-gray-800/40' : 'border-[#E5E5E5] bg-white'} p-5 transition-all duration-200 hover:border-[#E5252A]/40 hover:shadow-md flex flex-col justify-between`}
                >
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515]'}`}>
                          {getMethodIcon(method)}
                        </div>
                        <div className="ml-3">
                          <h4 className={`font-bold text-xs uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                            {getMethodDisplayName(method)}
                          </h4>
                          <p className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {val ? "Configured" : "Not configured"}
                          </p>
                        </div>
                      </div>
                      <div 
                        className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${val
                          ? 'bg-[#E5252A]/10 text-[#E5252A] border-[#E5252A]/20'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                          }`}
                      >
                        {val ? "Active" : "Inactive"}
                      </div>
                    </div>

                    {/* Display existing credentials in card format */}
                    {val && !isEditing && (
                      <div className="space-y-3 mb-4">
                        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-[#F5F5F5] border-[#E5E5E5]'}`}>
                          <div className={`text-[9px] uppercase font-bold tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {method === "momoPay" ? "Merchant Code" : "Phone Number"}
                          </div>
                          <div className={`font-mono text-sm font-bold ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                            {method === "momoPay" ? val.code : val.phone}
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-[#F5F5F5] border-[#E5E5E5]'}`}>
                          <div className={`text-[9px] uppercase font-bold tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Registered Name
                          </div>
                          <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                            {val.registeredName}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit/Record buttons */}
                  {!readOnly && !isEditing && (
                    <div className="space-y-2 mt-4">
                      <button
                        onClick={() => startEditing(method)}
                        className="w-full py-2.5 px-4 font-bold text-xs transition-all duration-200 uppercase tracking-wider rounded-xl bg-[#E5252A] hover:bg-[#c91d22] text-white shadow-xs"
                      >
                        {val ? "Edit Credentials" : "Set Up Payment"}
                      </button>
                      {!val && (
                        <button 
                          className={`w-full py-2 px-4 font-bold text-xs border rounded-xl transition-colors uppercase tracking-wider ${darkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'border-[#E5E5E5] bg-white text-gray-700 hover:bg-[#F5F5F5]'
                            }`}
                        >
                          Learn More
                        </button>
                      )}
                    </div>
                  )}

                  {/* Editing form */}
                  {!readOnly && isEditing && (
                    <div className="space-y-4 mt-2">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {method === "momoPay" ? "Merchant Code" : "Phone Number"}
                        </label>
                        <input
                          className={`w-full p-2.5 rounded-xl border text-sm ${darkMode
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                            } focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] outline-none transition-all`}
                          value={
                            method === "momoPay"
                              ? (tempMethods as any)[method]?.code || ""
                              : (tempMethods as any)[method]?.phone || ""
                          }
                          onChange={(e) =>
                            setField(method, method === "momoPay" ? "code" : "phone", e.target.value)
                          }
                          placeholder={method === "momoPay" ? "Enter code" : "Enter phone"}
                        />
                      </div>

                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Registered Name
                        </label>
                        <input
                          className={`w-full p-2.5 rounded-xl border text-sm ${darkMode
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                            } focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] outline-none transition-all`}
                          value={(tempMethods as any)[method]?.registeredName || ""}
                          onChange={(e) => setField(method, "registeredName", e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => saveMethod(method)}
                          className="w-full py-2.5 bg-[#E5252A] hover:bg-[#c91d22] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center uppercase tracking-wider"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMethod(null);
                            if (!val) {
                              setTempMethods((t) => {
                                const c = { ...t };
                                delete (c as any)[method];
                                return c;
                              });
                            }
                          }}
                          className={`w-full py-2 px-4 border rounded-xl font-bold text-xs transition-colors uppercase tracking-wider ${darkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'border-[#E5E5E5] bg-white text-gray-700 hover:bg-[#F5F5F5]'
                            }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-6 flex items-center p-4 rounded-xl border bg-red-500/10 border-red-500/20 text-[#E5252A]">
            <AlertCircle className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
