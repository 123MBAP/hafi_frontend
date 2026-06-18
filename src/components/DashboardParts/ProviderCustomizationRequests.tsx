import { useEffect, useState } from "react";
import { useDarkMode } from "@/context/DarkMode";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

interface CustomServiceRequest {
  id: string;
  service_id: string;
  provider_id: string;
  customer_id: string;
  customizations: string[];
  custom_price: number | null;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  customer_name?: string;
  service_name?: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function ProviderCustomizationRequests() {
  const { darkMode } = useDarkMode();
  const [requests, setRequests] = useState<CustomServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/custom-service-request/provider`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error("Failed to fetch requests");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuotePrice = async (requestId: string) => {
    if (!customPrice || isNaN(parseFloat(customPrice))) {
      alert("Please enter a valid price");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/custom/${requestId}/quote`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          custom_price: parseFloat(customPrice),
        }),
      });

      if (response.ok) {
        // Update local state
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, custom_price: parseFloat(customPrice), status: 'quoted' }
            : req
        ));
        setEditingRequestId(null);
        setCustomPrice("");
        alert("Price quoted successfully!");
      } else {
        alert("Failed to quote price");
      }
    } catch (error) {
      console.error("Error quoting price:", error);
      alert("Error quoting price");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = darkMode ? {
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      quoted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      rejected: "bg-red-500/10 text-red-400 border-red-500/20",
      completed: "bg-gray-800 text-gray-400 border-gray-700"
    } : {
      pending: "bg-amber-50 text-amber-850 border-amber-250",
      quoted: "bg-blue-50 text-blue-850 border-blue-205",
      accepted: "bg-emerald-50 text-emerald-850 border-emerald-205",
      rejected: "bg-red-50 text-red-850 border-red-205",
      completed: "bg-gray-50 text-gray-800 border-gray-250"
    };

    return (
      <span
        className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider ${statusColors[status as keyof typeof statusColors]}`}
        style={{ borderRadius: '2px' }}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6 flex items-center justify-center`}>
        <LoadingSpinner variant="dots" size="lg" message="Loading customization requests..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-gray-205" : "bg-gray-50 text-gray-800"} p-6`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-2xl font-bold tracking-tighter uppercase mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
          Customization Requests
        </h1>

        {requests.length === 0 ? (
          <div className={`text-center py-12 border ${darkMode ? "bg-gray-850 border-gray-750 text-gray-400" : "bg-white border-gray-200 text-gray-500"}`} style={{ borderRadius: '2px' }}>
            <p className="text-sm font-semibold uppercase tracking-wider">No customization requests found.</p>
            <p className="text-xs mt-1">When customers request custom services, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`p-6 border shadow-sm transition-all duration-300 ${
                  darkMode ? "bg-gray-850 border-gray-750" : "bg-white border-gray-200"
                } hover:border-emerald-500`}
                style={{ borderRadius: '2px' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-base font-bold uppercase tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Custom Service Request
                    </h3>
                    <p className={`text-xs ${darkMode ? "text-gray-450" : "text-gray-500"} mt-0.5`}>
                      Requested on {formatDate(request.created_at)}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Customization Details
                    </h4>
                    <ul className={`space-y-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {request.customizations.map((customization, index) => (
                        <li key={index} className="text-xs">
                          • {customization}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Pricing
                    </h4>
                    {request.custom_price ? (
                      <p className="text-lg font-bold text-emerald-500">
                        ${Number(request.custom_price).toFixed(2)}
                      </p>
                    ) : (
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        No price quoted yet
                      </p>
                    )}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Quote a Price
                    </h4>
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Enter custom price ($)"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          className={`w-full p-2.5 border text-sm ${
                            darkMode 
                              ? "bg-gray-900 border-gray-750 text-white" 
                              : "bg-white border-gray-250"
                          } focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all`}
                          style={{ borderRadius: '2px' }}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <button
                        onClick={() => handleQuotePrice(request.id)}
                        disabled={!customPrice || isNaN(parseFloat(customPrice))}
                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                          !customPrice || isNaN(parseFloat(customPrice))
                            ? "bg-gray-450 text-gray-200 cursor-not-allowed"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        Quote Price
                      </button>
                    </div>
                  </div>
                )}

                {request.status === 'quoted' && (
                  <div className={`border-t pt-4 mt-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3`}>
                      ✓ Price quoted - Waiting for customer acceptance
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCustomPrice(request.custom_price?.toString() || "");
                          setEditingRequestId(request.id);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                          darkMode ? "bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-250 text-gray-705 hover:bg-gray-50"
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        Edit Quote
                      </button>
                    </div>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div className={`border-t pt-4 mt-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3`}>
                      ✓ Customer accepted the quote - Ready to proceed!
                    </p>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_BASE}/api/custom/${request.id}/complete`, {
                            method: "PUT",
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (res.ok) {
                            setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'completed' } : r));
                            alert("Request marked as completed!");
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      style={{ borderRadius: '2px' }}
                    >
                      Mark as Completed
                    </button>
                  </div>
                )}

                {editingRequestId === request.id && (
                  <div className={`mt-4 p-4 ${darkMode ? "bg-gray-900 border-gray-750" : "bg-yellow-50/50 border-gray-200"} border`} style={{ borderRadius: '2px' }}>
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${darkMode ? "text-white" : "text-gray-750"}`}>
                      Edit Quote
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className={`flex-1 px-3 py-1.5 border text-sm ${
                          darkMode 
                            ? "bg-gray-800 border-gray-700 text-white" 
                            : "bg-white border-gray-250 text-gray-900"
                        } focus:ring-1 focus:ring-emerald-500 focus:outline-none`}
                        style={{ borderRadius: '2px' }}
                        placeholder="New price"
                      />
                      <button
                        onClick={() => handleQuotePrice(request.id)}
                        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                        style={{ borderRadius: '2px' }}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => setEditingRequestId(null)}
                        className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                          darkMode ? "bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-250 text-gray-705 hover:bg-gray-50"
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Statistics Card */}
        {requests.length > 0 && (
          <div className={`mt-8 p-6 border shadow-sm ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`} style={{ borderRadius: '2px' }}>
            <h3 className={`text-base font-bold uppercase tracking-tight mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Request Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border border-gray-150 dark:border-gray-750 bg-gray-50/30 dark:bg-gray-900/30" style={{ borderRadius: '2px' }}>
                <div className={`text-2xl font-bold ${darkMode ? "text-emerald-450" : "text-emerald-600"}`}>
                  {requests.length}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Requests</div>
              </div>
              <div className="text-center p-3 border border-gray-150 dark:border-gray-750 bg-gray-50/30 dark:bg-gray-900/30" style={{ borderRadius: '2px' }}>
                <div className="text-2xl font-bold text-amber-500">
                  {requests.filter(r => r.status === 'pending').length}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Pending</div>
              </div>
              <div className="text-center p-3 border border-gray-150 dark:border-gray-750 bg-gray-50/30 dark:bg-gray-900/30" style={{ borderRadius: '2px' }}>
                <div className="text-2xl font-bold text-blue-500">
                  {requests.filter(r => r.status === 'quoted').length}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Quoted</div>
              </div>
              <div className="text-center p-3 border border-gray-150 dark:border-gray-750 bg-gray-50/30 dark:bg-gray-900/30" style={{ borderRadius: '2px' }}>
                <div className="text-2xl font-bold text-emerald-500">
                  {requests.filter(r => r.status === 'accepted').length}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Accepted</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}