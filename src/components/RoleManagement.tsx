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
import { useState } from "react";

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
        <div className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg overflow-hidden`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Role Management
                    </h3>
                </div>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Manage your account roles and permissions securely
                </p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Active Roles */}
                    {currentRoles.map(role => (
                        <div key={role} className={`rounded-xl border-2 ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} p-5 transition-all duration-200 hover:border-indigo-300 hover:shadow-md`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-600' : 'from-gray-100 to-gray-200'}`}>
                                        {getRoleIcon(role)}
                                    </div>
                                    <div className="ml-3">
                                        <h4 className={`font-semibold text-sm capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {role.replace('_', ' ')}
                                        </h4>
                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Active
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`}>
                                    Active
                                </div>
                            </div>

                            <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {getRoleDescription(role)}
                                </p>
                            </div>

                            {role !== "customer" && (
                                <button
                                    onClick={() => handleRemoveRoleClick(role)}
                                    className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 border ${darkMode
                                        ? 'border-red-900/50 text-red-400 hover:bg-red-900/20'
                                        : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                                >
                                    <span className="flex items-center justify-center">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove Role
                                    </span>
                                </button>
                            )}
                            {role === "customer" && (
                                <div className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm text-center opacity-50 cursor-not-allowed border ${darkMode ? 'border-gray-600 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                                    Default Role
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Available Roles to Add */}
                    {availableRoles.map(role => (
                        <div key={role} className={`rounded-xl border-2 border-dashed ${darkMode ? 'border-gray-700 bg-gray-800/20' : 'border-gray-300 bg-gray-50'} p-5 transition-all duration-200 hover:border-gray-400`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-lg grayscale opacity-70 bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-600' : 'from-gray-100 to-gray-200'}`}>
                                        {getRoleIcon(role)}
                                    </div>
                                    <div className="ml-3">
                                        <h4 className={`font-semibold text-sm capitalize ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {role.replace('_', ' ')}
                                        </h4>
                                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                            Not Active
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} opacity-70`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {getRoleDescription(role)}
                                </p>
                            </div>

                            <button
                                onClick={() => handleUpdateRole(role, "add")}
                                disabled={isUpdatingRole}
                                className="w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg"
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
                    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all`}>
                        <div className="flex items-center mb-4 text-red-600">
                            <AlertTriangle className="w-6 h-6 mr-2" />
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Confirm Removal</h3>
                        </div>

                        <div className={`bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-6`}>
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                                Warning: removing the <span className="uppercase font-bold">{roleToRemove.replace('_', ' ')}</span> role is destructive.
                            </p>
                            <ul className="text-xs text-red-700 dark:text-red-300 mt-2 list-disc list-inside">
                                <li>Associated products and services will be deleted</li>
                                <li>Images and videos will be removed</li>
                                <li>This action cannot be undone</li>
                            </ul>
                        </div>

                        <p className={`mb-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-red-500">remove the {roleToRemove.replace('_', ' ')}</span> to confirm:
                        </p>

                        <input
                            type="text"
                            value={confirmationInput}
                            onChange={(e) => setConfirmationInput(e.target.value)}
                            placeholder={`remove the ${roleToRemove.replace('_', ' ')}`}
                            className={`w-full p-3 border rounded-xl mb-6 outline-none focus:ring-2 focus:ring-red-500 transition-all ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
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
                                className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRemoveRole}
                                disabled={isUpdatingRole || confirmationInput.toLowerCase() !== `remove the ${roleToRemove.replace('_', ' ')}`.toLowerCase()}
                                className={`px-5 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all
                  ${isUpdatingRole || confirmationInput.toLowerCase() !== `remove the ${roleToRemove.replace('_', ' ')}`.toLowerCase()
                                        ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'}`}
                            >
                                {isUpdatingRole ? 'Removing...' : 'Confirm Removal'}
                            </button>
                        </div>

                        {deletionSummary && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm border border-green-100 dark:border-green-900/30">
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
        </div>
    );
}
