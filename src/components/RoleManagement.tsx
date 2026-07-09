import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkMode";
import {
    AlertTriangle,
    Briefcase,
    CheckCircle,
    Plus,
    Shield,
    Store,
    Trash2,
    User
} from "lucide-react";
import { useState, useEffect } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

type RoleManagementProps = {
    currentRoles: string[];
    userEmail?: string;
    onRoleUpdate?: () => void;
};

const allowedRoles = ["customer", "seller", "service_provider"];

export default function RoleManagement({ currentRoles, onRoleUpdate }: RoleManagementProps) {
    const { darkMode } = useDarkMode();
    const { updateToken } = useAuth();

    const [isUpdatingRole, setIsUpdatingRole] = useState(false);
    const [showRemoveRoleModal, setShowRemoveRoleModal] = useState(false);
    const [roleToRemove, setRoleToRemove] = useState<string | null>(null);
    const [confirmationInput, setConfirmationInput] = useState("");
    const [deletionSummary, setDeletionSummary] = useState<{
        products: number;
        images: number;
        videos: number;
    } | null>(null);

    const [shopCategory, setShopCategory] = useState<{ id: number; name: string; key?: string | null } | null>(null);
    const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string; key?: string | null }>>([]);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const token = localStorage.getItem("token");

    const fetchSellerProfileAndCategories = async () => {
        try {
            const profileRes = await fetch(`${API_BASE}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                if (profileData.shopping_type_id) {
                    setShopCategory({
                        id: profileData.shopping_type_id,
                        name: profileData.shopping_type_name,
                        key: profileData.shopping_type_key
                    });
                } else {
                    setShopCategory(null);
                }
            }
            
            const typesRes = await fetch(`${API_BASE}/api/shopping-types`);
            if (typesRes.ok) {
                const typesData = await typesRes.json();
                setAvailableCategories(typesData.shopping_types || []);
            }
        } catch (err) {
            console.error("Error loading seller category info:", err);
        }
    };

    useEffect(() => {
        if (currentRoles.includes('seller')) {
            fetchSellerProfileAndCategories();
        }
    }, [currentRoles]);

    const handleRemoveCategory = async () => {
        if (!window.confirm("Are you sure you want to remove your shop category? This will reset your VIP plan limits.")) return;
        setIsUpdatingRole(true);
        try {
            const res = await fetch(`${API_BASE}/api/profile`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ shopping_type_id: null }),
            });
            if (!res.ok) throw new Error("Failed to remove category");
            alert("Shop category removed successfully.");
            setShopCategory(null);
            if (onRoleUpdate) {
                onRoleUpdate();
            } else {
                window.location.reload();
            }
        } catch (err) {
            alert("Error removing category");
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const handleAddCategory = async () => {
        if (!selectedCategoryId) {
            alert("Please select a category.");
            return;
        }
        setIsUpdatingRole(true);
        try {
            const res = await fetch(`${API_BASE}/api/profile`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ shopping_type_id: selectedCategoryId }),
            });
            if (!res.ok) throw new Error("Failed to assign category");
            alert("Shop category assigned successfully.");
            setShowAddCategoryModal(false);
            setSelectedCategoryId(null);
            await fetchSellerProfileAndCategories();
            if (onRoleUpdate) {
                onRoleUpdate();
            } else {
                window.location.reload();
            }
        } catch (err) {
            alert("Error assigning category");
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const availableRoles = allowedRoles.filter(role => !currentRoles.includes(role));

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'seller': return <Store className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
            case 'service_provider': return <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            default: return <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
        }
    };

    const getRoleDescription = (role: string) => {
        switch (role) {
            case 'seller': return "Sell products on the marketplace";
            case 'service_provider': return "Offer professional services";
            default: return "Basic account access";
        }
    };

    const handleUpdateRole = async (role: string, action: "add" | "remove") => {
        if (!role) return;

        if (action === "remove") {
            handleRemoveRoleClick(role);
            return;
        }

        setIsUpdatingRole(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/profile/roles`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role, action }),
            });

            if (!res.ok) throw new Error("Failed to update roles");
            const data = await res.json();

            if (data.token) {
                updateToken(data.token);
            }

            alert(data.message || "Role updated");

            if (onRoleUpdate) {
                onRoleUpdate();
            } else {
                window.location.reload();
            }

        } catch {
            alert("Error updating roles");
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const handleRemoveRoleClick = (role: string) => {
        if (role === 'customer') {
            alert('The customer role cannot be removed.');
            return;
        }

        setRoleToRemove(role);
        setConfirmationInput("");
        setDeletionSummary(null);
        setShowRemoveRoleModal(true);
    };

    const handleConfirmRemoveRole = async () => {
        if (!roleToRemove) return;

        const expectedPhrase = `remove the ${roleToRemove.replace('_', ' ')}`;
        if (confirmationInput.toLowerCase() !== expectedPhrase.toLowerCase()) {
            alert(`Please type "${expectedPhrase}" to confirm.`);
            return;
        }

        setIsUpdatingRole(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/profile/roles/remove-with-cleanup`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role: roleToRemove }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to remove role");
            }

            const data = await res.json();
            setDeletionSummary(data.deletedItems || { products: 0, images: 0, videos: 0 });

            if (data.token) {
                updateToken(data.token);
            }

            alert(data.message || "Role removed successfully");
            setShowRemoveRoleModal(false);
            setRoleToRemove(null);

            if (onRoleUpdate) {
                onRoleUpdate();
            } else {
                window.location.reload();
            }

        } catch (error) {
            alert(`Error removing role: ${error instanceof Error ? error.message : ""}`);
            setShowRemoveRoleModal(false);
            setRoleToRemove(null);
        } finally {
            setIsUpdatingRole(false);
        }
    };

    return (
        <div 
            className={`border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm overflow-hidden`}
            style={{ borderRadius: '2px' }}
        >
            {/* Header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center">
                    <div 
                        className={`p-2 border ${darkMode ? 'bg-gray-900 border-gray-750 text-indigo-400' : 'bg-white border-gray-150 text-indigo-650'}`}
                        style={{ borderRadius: '2px' }}
                    >
                        <Shield className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h3 className={`text-base font-bold uppercase tracking-tight ml-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Manage how you use HafiConnect!
                    </h3>
                </div>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Add, remove or switch the usage of Haficonnect. You can sell products (Seller), upgrade to premium shop (Premium Seller) or offer services (Service Provider) or both. You can modify this anytime as you wish.
                </p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6">
                    {/* Active Roles */}
                    {currentRoles.map(role => (
                        <div 
                            key={role} 
                            className={`p-5 border ${darkMode ? 'bg-gray-850/40 border-gray-800' : 'bg-gray-50 border-gray-150 hover:border-emerald-500'}`}
                            style={{ borderRadius: '2px' }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div 
                                        className={`p-2 border ${darkMode ? 'bg-gray-900 border-gray-750' : 'bg-white border-gray-150'}`}
                                        style={{ borderRadius: '2px' }}
                                    >
                                        {getRoleIcon(role)}
                                    </div>
                                    <div className="ml-3">
                                        <h4 className={`text-sm font-bold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                                            {role.replace('_', ' ')}
                                        </h4>
                                        <p className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Active
                                        </p>
                                    </div>
                                </div>
                                <span 
                                    className="px-2 py-0.5 text-[9px] font-bold bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
                                    style={{ borderRadius: '2px' }}
                                >
                                    Active
                                </span>
                            </div>

                            <div 
                                className={`p-3 border mb-4 text-xs ${darkMode ? 'bg-gray-900/30 border-gray-755 text-gray-405' : 'bg-white border-gray-200'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                                    {getRoleDescription(role)}
                                </p>
                            </div>

                            {role === 'seller' && (
                                <div 
                                    className={`p-3 border mb-4 text-xs font-semibold ${
                                        darkMode ? 'bg-indigo-950/20 border-indigo-900/50 text-indigo-400' : 'bg-indigo-50 border-indigo-150 text-indigo-850'
                                    }`}
                                    style={{ borderRadius: '2px' }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                                                Premium Shop Category
                                            </span>
                                            <span className="text-sm font-bold block mt-0.5">
                                                {shopCategory && shopCategory.key !== 'other' && shopCategory.name?.toLowerCase() !== 'other'
                                                    ? shopCategory.name
                                                    : "None (Default/Other)"}
                                            </span>
                                        </div>
                                        {shopCategory && shopCategory.key !== 'other' && shopCategory.name?.toLowerCase() !== 'other' ? (
                                            <button
                                                onClick={handleRemoveCategory}
                                                disabled={isUpdatingRole}
                                                className="text-xs font-semibold text-red-500 hover:text-red-655 focus:outline-none flex items-center transition-colors animate-fadeIn"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    const filtered = availableCategories.filter(c => c.key !== 'other' && c.name?.toLowerCase() !== 'other');
                                                    setSelectedCategoryId(filtered[0]?.id || null);
                                                    setShowAddCategoryModal(true);
                                                }}
                                                disabled={isUpdatingRole}
                                                className="text-xs font-semibold text-emerald-500 hover:text-emerald-655 focus:outline-none flex items-center transition-colors animate-fadeIn"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                Add
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {role !== "customer" && (
                                <button
                                    onClick={() => handleRemoveRoleClick(role)}
                                    className={`w-full py-2 border font-semibold text-xs transition-colors uppercase tracking-wider ${
                                        darkMode 
                                            ? 'border-red-900/50 bg-red-950/10 text-red-400 hover:bg-red-900/20' 
                                            : 'border-red-200 bg-red-50/50 text-red-650 hover:bg-red-50'
                                    }`}
                                    style={{ borderRadius: '2px' }}
                                >
                                    <span className="flex items-center justify-center">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove Role
                                    </span>
                                </button>
                            )}
                            {role === "customer" && (
                                <div 
                                    className={`w-full py-2 border text-center text-xs font-semibold uppercase tracking-wider opacity-60 ${
                                        darkMode ? 'border-gray-700 bg-gray-900/20 text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-400'
                                    }`}
                                    style={{ borderRadius: '2px' }}
                                >
                                    Default Role
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Available Roles to Add */}
                    {availableRoles.map(role => (
                        <div 
                            key={role} 
                            className={`p-5 border border-dashed opacity-75 ${darkMode ? 'bg-gray-900/10 border-gray-800' : 'bg-gray-50/50 border-gray-150'}`}
                            style={{ borderRadius: '2px' }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div 
                                        className={`p-2 border opacity-70 ${darkMode ? 'bg-gray-900 border-gray-750' : 'bg-white border-gray-150'}`}
                                        style={{ borderRadius: '2px' }}
                                    >
                                        {getRoleIcon(role)}
                                    </div>
                                    <div className="ml-3">
                                        <h4 className={`text-sm font-bold uppercase tracking-tight ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {role.replace('_', ' ')}
                                        </h4>
                                        <p className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                            Not Active
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div 
                                className={`p-3 border mb-4 text-xs opacity-70 ${darkMode ? 'bg-gray-900/30 border-gray-750 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                <p>
                                    {getRoleDescription(role)}
                                </p>
                            </div>

                            <button
                                onClick={() => handleUpdateRole(role, "add")}
                                disabled={isUpdatingRole}
                                className="w-full py-2 bg-emerald-500 hover:bg-emerald-650 hover:bg-emerald-600 text-white font-semibold text-xs uppercase tracking-wider transition-all duration-200"
                                style={{ borderRadius: '2px' }}
                            >
                                <span className="flex items-center justify-center">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add {role.replace('_', ' ')}
                                </span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showRemoveRoleModal && roleToRemove && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div 
                        className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-850'} border p-6 max-w-md w-full shadow-2xl transform transition-all`}
                        style={{ borderRadius: '2px' }}
                    >
                        <div className="flex items-center mb-4 text-red-600">
                            <AlertTriangle className="w-6 h-6 mr-2" />
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Confirm Removal</h3>
                        </div>

                        <div className={`bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 mb-6`} style={{ borderRadius: '2px' }}>
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                                Warning: removing the <span className="uppercase font-bold">{roleToRemove.replace('_', ' ')}</span> role is destructive.
                            </p>
                            <ul className="text-xs text-red-700 dark:text-red-300 mt-2 list-disc list-inside">
                                <li>Associated products and services will be deleted</li>
                                <li>Images and videos will be removed</li>
                                <li>This action cannot be undone</li>
                            </ul>
                        </div>

                        <p className={`mb-3 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-350' : 'text-gray-600'}`}>
                            Type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-red-500">remove the {roleToRemove.replace('_', ' ')}</span> to confirm:
                        </p>

                        <input
                            type="text"
                            value={confirmationInput}
                            onChange={(e) => setConfirmationInput(e.target.value)}
                            placeholder={`remove the ${roleToRemove.replace('_', ' ')}`}
                            className={`w-full p-2.5 border text-sm focus:ring-1 focus:ring-red-500 focus:outline-none transition-all mb-6 ${
                                darkMode ? 'bg-gray-900 border-gray-750 text-white placeholder-gray-500' : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                            }`}
                            style={{ borderRadius: '2px' }}
                            autoFocus
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowRemoveRoleModal(false);
                                    setRoleToRemove(null);
                                    setConfirmationInput("");
                                }}
                                disabled={isUpdatingRole}
                                className={`px-5 py-2 border font-semibold text-xs transition-colors uppercase tracking-wider ${
                                    darkMode ? 'border-gray-750 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'border-gray-250 bg-white text-gray-755 hover:bg-gray-50'
                                }`}
                                style={{ borderRadius: '2px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRemoveRole}
                                disabled={isUpdatingRole || confirmationInput.toLowerCase() !== `remove the ${roleToRemove.replace('_', ' ')}`.toLowerCase()}
                                className={`px-5 py-2 text-white font-semibold text-xs uppercase tracking-wider transition-all ${
                                    isUpdatingRole || confirmationInput.toLowerCase() !== `remove the ${roleToRemove.replace('_', ' ')}`.toLowerCase()
                                        ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                        : 'bg-red-505 bg-red-500 hover:bg-red-600'
                                }`}
                                style={{ borderRadius: '2px' }}
                            >
                                {isUpdatingRole ? 'Removing...' : 'Confirm Removal'}
                            </button>
                        </div>

                        {deletionSummary && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-sm border border-green-150 dark:border-green-900/30" style={{ borderRadius: '2px' }}>
                                <p className="font-bold text-green-700 dark:text-green-400 mb-1 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-1" /> Deleted Items:
                                </p>
                                <ul className="text-green-600 dark:text-green-300 pl-5 list-disc text-xs">
                                    <li>Products/Services: {deletionSummary.products}</li>
                                    <li>Images: {deletionSummary.images}</li>
                                    <li>Videos: {deletionSummary.videos}</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Shop Category Assignment Modal */}
            {showAddCategoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div 
                        className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-850'} border p-6 max-w-md w-full shadow-2xl transform transition-all`}
                        style={{ borderRadius: '2px' }}
                    >
                        <div className="flex items-center mb-4 text-indigo-500">
                            <Store className="w-6 h-6 mr-2" />
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assign Shop Category</h3>
                        </div>

                        <p className={`mb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Select a marketplace category to assign to your shop. Premium categories come with custom storage, product limits, and VIP plans.
                        </p>

                        <div className="mb-6">
                            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-450' : 'text-gray-600'}`}>
                                Select Category
                            </label>
                            <select
                                value={selectedCategoryId || ""}
                                onChange={(e) => setSelectedCategoryId(Number(e.target.value) || null)}
                                className={`w-full p-2.5 border text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                                    darkMode ? 'bg-gray-900 border-gray-750 text-white placeholder-gray-505' : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400'
                                }`}
                                style={{ borderRadius: '2px' }}
                            >
                                <option value="" disabled>-- Select a Shop Category --</option>
                                {availableCategories
                                    .filter(cat => cat.key !== 'other' && cat.name?.toLowerCase() !== 'other')
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowAddCategoryModal(false);
                                    setSelectedCategoryId(null);
                                }}
                                disabled={isUpdatingRole}
                                className={`px-5 py-2 border font-semibold text-xs transition-colors uppercase tracking-wider ${
                                    darkMode ? 'border-gray-750 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'border-gray-250 bg-white text-gray-755 hover:bg-gray-50'
                                }`}
                                style={{ borderRadius: '2px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCategory}
                                disabled={isUpdatingRole || !selectedCategoryId}
                                className={`px-5 py-2 text-white font-semibold text-xs uppercase tracking-wider transition-all ${
                                    isUpdatingRole || !selectedCategoryId
                                        ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                        : 'bg-emerald-500 hover:bg-emerald-600'
                                }`}
                                style={{ borderRadius: '2px' }}
                            >
                                {isUpdatingRole ? 'Assigning...' : 'Assign Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
