// filepath: src/components/DashboardParts/PaymentCredentials.tsx
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
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";


const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

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
      default: return <CreditCard className="w-5 h-5 text-gray-600" />;
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
      <div className={`flex items-center justify-center py-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
        Loading payment methods...
      </div>
    );
  }

  const rules = validatePasswordRules(newPassword);

  return (
    <div className={className}>
      {/* Payment Methods Section */}
      <div className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg mr-3">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Payment Methods
            </h3>
          </div>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                <div key={method} className={`rounded-xl border-2 ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} p-5 transition-all duration-200 hover:border-teal-300 hover:shadow-md`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                        {getMethodIcon(method)}
                      </div>
                      <div className="ml-3">
                        <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {getMethodDisplayName(method)}
                        </h4>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {val ? "Configured" : "Not configured"}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${val
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                      {val ? "Active" : "Inactive"}
                    </div>
                  </div>

                  {/* Display existing credentials in card format */}
                  {val && !isEditing && (
                    <div className="space-y-3 mb-4">
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {method === "momoPay" ? "Merchant Code" : "Phone Number"}
                        </div>
                        <div className={`font-mono text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {method === "momoPay" ? val.code : val.phone}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Registered Name
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {val.registeredName}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit/Record buttons */}
                  {!readOnly && !isEditing && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setAuthPromptFor(method);
                          setPasswordInputs((p) => ({ ...p, [method]: "" }));
                          setError(null);
                        }}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${val
                          ? 'bg-teal-600 hover:bg-teal-700 text-white'
                          : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white'
                          }`}
                      >
                        {val ? "Edit Credentials" : "Set Up Payment"}
                      </button>
                      {!val && (
                        <button className={`w-full py-2 px-4 rounded-lg font-medium text-sm border transition-colors ${darkMode
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}>
                          Learn More
                        </button>
                      )}
                    </div>
                  )}

                  {/* Editing form */}
                  {!readOnly && (isEditing || isAuthorized) && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {method === "momoPay" ? "Merchant Code" : "Phone Number"}
                        </label>
                        <input
                          className={`w-full p-3 rounded-lg border text-sm ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all`}
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
                        <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Registered Name
                        </label>
                        <input
                          className={`w-full p-3 rounded-lg border text-sm ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all`}
                          value={(tempMethods as any)[method]?.registeredName || ""}
                          onChange={(e) => setField(method, "registeredName", e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => saveMethod(method)}
                          className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
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
                          className={`w-full py-2 px-4 border rounded-lg font-medium text-sm transition-colors ${darkMode
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Password prompt */}
                  {!readOnly && authPromptFor === method && !authorized[method] && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center mb-3">
                        <Shield className="w-4 h-4 text-orange-600 mr-2" />
                        <h5 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Security Verification
                        </h5>
                      </div>
                      <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Enter your payment password to modify credentials
                      </p>
                      <div className="relative mb-3">
                        <input
                          type="password"
                          value={passwordInputs[method] || ""}
                          onChange={(e) => setPasswordInput(method, e.target.value)}
                          className={`w-full p-2.5 rounded-lg border text-sm ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8`}
                          placeholder="Payment password"
                        />
                        <Lock className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAuthSubmit(method)}
                          className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium text-sm transition-all duration-200"
                        >
                          Verify & Continue
                        </button>
                        <button
                          onClick={() => setAuthPromptFor(null)}
                          className={`w-full py-2 px-4 border rounded-lg font-medium text-sm transition-colors ${darkMode
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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
          <div className="mx-6 mb-6 flex items-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-800'}`}>{error}</span>
          </div>
        )}
      </div>

      {/* Password Management Section */}
      <div className={`mt-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {hasPassword ? "Change Payment Password" : "Create Payment Password"}
            </h3>
          </div>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Secure your payment credentials with a strong password
          </p>
        </div>

        <div className="p-6">
          {!hasPassword ? (
            <>
              {!showCreateFields ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    No Payment Password Set
                  </h4>
                  <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Create a secure password to protect your payment credentials
                  </p>
                  <button
                    onClick={() => setShowCreateFields(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-8 rounded-lg font-medium transition-all duration-200 shadow-lg"
                  >
                    Create Payment Password
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`w-full p-3 rounded-lg border ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-all`}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full p-3 rounded-lg border ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-all`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h5 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Password Requirements:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(rules).map(([key, met]) => (
                        <div key={key} className="flex items-center">
                          {met ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mr-2" />
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
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Save Payment Password
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateFields(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError(null);
                      }}
                      className="py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {passwordError && (
                    <div className="flex items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <span className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{passwordError}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {!showPasswordFields ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Payment Password Active
                  </h4>
                  <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Your payment credentials are secured with a password
                  </p>
                  <button
                    onClick={() => setShowPasswordFields(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-8 rounded-lg font-medium transition-all duration-200 shadow-lg"
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className={`w-full p-3 rounded-lg border ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10 transition-all`}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`w-full p-3 rounded-lg border ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10 transition-all`}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full p-3 rounded-lg border ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10 transition-all`}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                    >
                      <Shield className="w-4 h-4 mr-2" />
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
                      className="py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {passwordError && (
                    <div className="flex items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <span className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{passwordError}</span>
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