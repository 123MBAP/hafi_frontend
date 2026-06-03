import { useEffect, useState } from "react";
import { useDarkMode } from "@/context/DarkMode";
import { useAuth } from "@/context/AuthContext";

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
  // const [selectedRequest, setSelectedRequest] = useState<CustomServiceRequest | null>(null);

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
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      quoted: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {status.toUpperCase()}
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
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 bg-gray-300 rounded w-1/4 mb-6`}></div>
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow`}>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
          Customization Requests
        </h1>

        {requests.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            <p className="text-lg">No customization requests found.</p>
            <p className="text-sm">When customers request custom services, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`p-6 rounded-lg shadow transition-all duration-200 ${
                  darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
                } hover:shadow-lg`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Custom Service Request
                    </h3>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Requested on {formatDate(request.created_at)}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className={`font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Customization Details
                    </h4>
                    <ul className={`space-y-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {request.customizations.map((customization, index) => (
                        <li key={index} className="text-sm">
                          • {customization}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className={`font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Pricing
                    </h4>
                    {request.custom_price ? (
                      <p className={`text-lg font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                        ${Number(request.custom_price).toFixed(2)}
                      </p>
                    ) : (
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        No price quoted yet
                      </p>
                    )}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className={`font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Quote a Price
                    </h4>
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Enter custom price ($)"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            darkMode 
                              ? "bg-gray-700 border-gray-600 text-white" 
                              : "bg-white border-gray-300"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <button
                        onClick={() => handleQuotePrice(request.id)}
                        disabled={!customPrice || isNaN(parseFloat(customPrice))}
                        className={`px-4 py-2 rounded-md font-medium ${
                          !customPrice || isNaN(parseFloat(customPrice))
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        Quote Price
                      </button>
                    </div>
                  </div>
                )}

                {request.status === 'quoted' && (
                  <div className={`border-t pt-4 mt-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <p className={`text-sm ${darkMode ? "text-green-400" : "text-green-600"} mb-2`}>
                      ✅ Price quoted - Waiting for customer acceptance
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCustomPrice(request.custom_price?.toString() || "");
                          setEditingRequestId(request.id);
                        }}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Edit Quote
                      </button>
                    </div>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div className={`border-t pt-4 mt-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <p className={`text-sm ${darkMode ? "text-green-400" : "text-green-600"} mb-2`}>
                      ✅ Customer accepted the quote - Ready to proceed!
                    </p>
                    <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                      Mark as Completed
                    </button>
                  </div>
                )}

                {editingRequestId === request.id && (
                  <div className={`mt-4 p-4 rounded-md ${darkMode ? "bg-gray-700" : "bg-yellow-50"} border ${
                    darkMode ? "border-gray-600" : "border-yellow-200"
                  }`}>
                    <h4 className={`font-medium mb-2 ${darkMode ? "text-white" : "text-yellow-800"}`}>
                      Edit Quote
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className={`flex-1 px-3 py-1 border rounded-md ${
                          darkMode 
                            ? "bg-gray-600 border-gray-500 text-white" 
                            : "bg-white border-gray-300"
                        }`}
                        placeholder="New price"
                      />
                      <button
                        onClick={() => handleQuotePrice(request.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => setEditingRequestId(null)}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
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
          <div className={`mt-8 p-6 rounded-lg shadow ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Request Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  {requests.length}
                </div>
                <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Requests</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                  {requests.filter(r => r.status === 'pending').length}
                </div>
                <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Pending</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  {requests.filter(r => r.status === 'quoted').length}
                </div>
                <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Quoted</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                  {requests.filter(r => r.status === 'accepted').length}
                </div>
                <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Accepted</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}