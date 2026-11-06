import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../LoadingSpinner";

import { API_BASE } from '../../api/apiClient';
import {
  AlertCircle,
  Building,
  CheckCircle,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Smartphone,
  Wifi,
  XCircle
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

  const [authPromptFor, setAuthPromptFor] = useState<string | null>(null);
  const [passwordInputs, setPasswordInputs] = useState<{ [k: string]: string }>({});
  const [authorized, setAuthorized] = useState<{ [k: string]: boolean }>({});
  const [editingMethod, setEditingMethod] = useState<string | null>(null);

  const [hasPassword, setHasPassword] = useState(false);

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCreateFields, setShowCreateFields] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      // If methods are provided via props, use them (read-only use-case)
      if (methodsProp) {
        setMethods(methodsProp || {});
        setTempMethods(methodsProp || {});
        setHasPassword(false);
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
        setHasPassword(!!data?.password_hash);
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

  const setPasswordInput = (method: string, value: string) =>
    setPasswordInputs((p) => ({ ...p, [method]: value }));

  const verifyPassword = async (pwd: string) => {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/api/provider/verify-password`, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: pwd }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleAuthSubmit = async (method: string) => {
    setError(null);
    const pwd = passwordInputs[method] || "";
    if (!pwd) return setError("Enter password to continue");
    const ok = await verifyPassword(pwd);
    if (!ok) {
      setError("Password incorrect");
      return;
    }
    setTempMethods((t) => ({ ...t, [method]: (t as any)[method] || (methods as any)[method] || {} }));
    setAuthorized((a) => ({ ...a, [method]: true }));
    setEditingMethod(method);
    setAuthPromptFor(null);
  };

  const saveMethod = async (method: string) => {
    if (!token) return setError("Missing token");
    try {
      const payload = {
        methods: { ...(methods || {}), [method]: (tempMethods as any)[method] || {} },
        currentPassword: passwordInputs[method],
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
      setAuthorized((a) => ({ ...a, [method]: false }));
      setPasswordInputs((p) => ({ ...p, [method]: "" }));
      alert("Payment method saved successfully!");
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  const validatePasswordRules = (pwd: string) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      symbol: /[!@#$%^&*(),.?"':{}|<>]/.test(pwd),
    };
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!token) {
      setPasswordError("Missing token");
      return;
    }
    if (!oldPassword || !newPassword) {
      setPasswordError("Enter both old and new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/provider/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `Failed (${res.status})`);
      alert("Password updated successfully");
      setShowPasswordFields(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err?.message || "Something went wrong");
    }
  };

  const handleCreatePasswordAndSave = async () => {
    setPasswordError(null);
    const rules = validatePasswordRules(newPassword);
    if (!Object.values(rules).every(Boolean)) {
      setPasswordError("Password does not meet all requirements");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/provider/create/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ methods: tempMethods, password: newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create credentials");
      const data = await res.json();
      setMethods(data.methods || tempMethods);
      setTempMethods(data.methods || tempMethods);
      setNewPassword("");
      setConfirmPassword("");
      setHasPassword(true);
      setShowCreateFields(false);
      alert("Payment credentials saved successfully!");
    } catch (err: any) {
      setPasswordError(err?.message || "Something went wrong");
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

  const rules = validatePasswordRules(newPassword);

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
              const isAuthorized = authorized[method];

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
                        onClick={() => {
                          setAuthPromptFor(method);
                          setPasswordInputs((p) => ({ ...p, [method]: "" }));
                          setError(null);
                        }}
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
                  {!readOnly && (isEditing || isAuthorized) && (
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
                            setAuthorized((a) => ({ ...a, [method]: false }));
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

                  {/* Password verification prompt */}
                  {!readOnly && authPromptFor === method && !authorized[method] && (
                    <div className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20">
                      <div className="flex items-center mb-3">
                        <Shield className="w-4 h-4 text-[#E5252A] mr-2" />
                        <h5 className={`font-bold text-xs uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                          Security Verification
                        </h5>
                      </div>
                      <p className={`text-[10px] uppercase font-bold tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Enter your payment password to modify credentials
                      </p>
                      <div className="relative mb-3">
                        <input
                          type="password"
                          value={passwordInputs[method] || ""}
                          onChange={(e) => setPasswordInput(method, e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-sm ${darkMode
                            ? 'bg-gray-900 border-gray-700 text-white'
                            : 'bg-white border-[#E5E5E5] text-[#151515]'
                            } focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] outline-none pr-8`}
                          placeholder="Payment password"
                        />
                        <Lock className="absolute right-2.5 top-3 w-4 h-4 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAuthSubmit(method)}
                          className="w-full py-2.5 bg-[#E5252A] hover:bg-[#c91d22] text-white font-bold text-xs rounded-xl transition-all shadow-xs uppercase tracking-wider"
                        >
                          Verify & Continue
                        </button>
                        <button
                          onClick={() => setAuthPromptFor(null)}
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

      {/* Password Management Section */}
      <div className={`mt-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-xs overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800 bg-gray-950/60' : 'border-[#E5E5E5] bg-[#F5F5F5]'}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-[#E5252A]' : 'bg-white border-[#E5E5E5] text-[#E5252A]'}`}>
              <Lock className="w-4 h-4 text-[#E5252A]" />
            </div>
            <h3 className={`text-sm font-bold uppercase tracking-wider ml-3 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
              {hasPassword ? "Change Payment Password" : "Create Payment Password"}
            </h3>
          </div>
          <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Secure your payment credentials with a strong password
          </p>
        </div>

        <div className="p-6">
          {!hasPassword ? (
            <>
              {!showCreateFields ? (
                <div className="text-center py-6">
                  <div className={`w-14 h-14 mx-auto mb-4 border rounded-2xl flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700 text-[#E5252A]' : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#E5252A]'}`}>
                    <Lock className="w-6 h-6 text-[#E5252A]" />
                  </div>
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                    No Payment Password Set
                  </h4>
                  <p className={`text-xs mb-6 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Create a secure password to protect your payment credentials
                  </p>
                  <button
                    onClick={() => setShowCreateFields(true)}
                    className="bg-[#E5252A] hover:bg-[#c91d22] text-white py-2.5 px-6 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all duration-200"
                  >
                    Create Payment Password
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-sm ${darkMode
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                            } focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] outline-none pr-10 transition-all`}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-sm ${darkMode
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                            } focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] outline-none pr-10 transition-all`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-[#F5F5F5] border-[#E5E5E5]'}`}>
                    <h5 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                      Password Requirements:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(rules).map(([key, met]) => (
                        <div key={key} className="flex items-center">
                          {met ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-600 mr-2" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-500 mr-2" />
                          )}
                          <span className={met ? (darkMode ? 'text-green-400' : 'text-green-700') : (darkMode ? 'text-red-400' : 'text-red-700')}>
                            {key === 'length' && 'At least 8 characters'}
                            {key === 'uppercase' && 'One uppercase letter'}
                            {key === 'lowercase' && 'One lowercase letter'}
                            {key === 'number' && 'One number'}
                            {key === 'symbol' && 'One special character'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCreatePasswordAndSave}
                      disabled={!Object.values(rules).every(Boolean) || newPassword !== confirmPassword}
                      className="flex-1 py-2.5 bg-[#E5252A] hover:bg-[#c91d22] disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs transition-all duration-200 flex items-center justify-center uppercase tracking-wider rounded-xl shadow-xs"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      Save Payment Password
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateFields(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError(null);
                      }}
                      className={`py-2.5 px-6 border rounded-xl font-bold text-xs transition-colors uppercase tracking-wider ${darkMode
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        : 'border-[#E5E5E5] text-gray-700 hover:bg-[#F5F5F5]'
                        }`}
                    >
                      Cancel
                    </button>
                  </div>

                  {passwordError && (
                    <div className="flex items-center p-3 rounded-xl border bg-red-500/10 border-red-500/20 text-[#E5252A]">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-xs font-semibold">{passwordError}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {!showPasswordFields ? (
                <div className="text-center py-6">
                  <div className={`w-14 h-14 mx-auto mb-4 border rounded-2xl flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700 text-[#E5252A]' : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#E5252A]'}`}>
                    <Shield className="w-6 h-6 text-[#E5252A]" />
                  </div>
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-[#151515]'}`}>
                    Payment Password Active
                  </h4>
                  <p className={`text-xs mb-6 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Your payment credentials are secured with a password
                  </p>
                  <button
                    onClick={() => setShowPasswordFields(true)}
                    className="bg-[#E5252A] hover:bg-[#c91d22] text-white py-2.5 px-6 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all duration-200"
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-sm ${darkMode
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                            } focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] outline-none pr-10 transition-all`}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                          {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-sm ${darkMode
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                            } focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] outline-none pr-10 transition-all`}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-sm ${darkMode
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400'
                            } focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] outline-none pr-10 transition-all`}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={!oldPassword || !newPassword || newPassword !== confirmPassword}
                      className="flex-1 py-2.5 bg-[#E5252A] hover:bg-[#c91d22] disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs transition-all duration-200 flex items-center justify-center uppercase tracking-wider rounded-xl shadow-xs"
                    >
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordFields(false);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError(null);
                      }}
                      className={`py-2.5 px-6 border rounded-xl font-bold text-xs transition-colors uppercase tracking-wider ${darkMode
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        : 'border-[#E5E5E5] text-gray-700 hover:bg-[#F5F5F5]'
                        }`}
                    >
                      Cancel
                    </button>
                  </div>

                  {passwordError && (
                    <div className="flex items-center p-3 rounded-xl border bg-red-500/10 border-red-500/20 text-[#E5252A]">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-xs font-semibold">{passwordError}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
