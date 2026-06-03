import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentPage from "./PaymentPage";
import PaymentHistory from "@/components/Statements/PaymentsHistory";

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
  provider_name?: string;
  service_name?: string;
  service_image?: string;
  provider_contact?: string;
  is_paid: boolean;
  payment_id?: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

type StatusFilter = 'all' | 'pending' | 'quoted' | 'accepted' | 'rejected' | 'completed';

export default function CustomerStatements() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CustomServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'payments'>('requests');
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CustomServiceRequest | null>(null);
  // Filter requests based on selected status
  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'accepted') return request.status === 'accepted' && !request.is_paid;
    if (statusFilter === 'completed') return request.is_paid || request.status === 'completed';
    return request.status === statusFilter;
  });

  // Count requests by status for statistics
  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    quoted: requests.filter(r => r.status === 'quoted').length,
    accepted: requests.filter(r => r.status === 'accepted' && !r.is_paid).length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    completed: requests.filter(r => r.is_paid || r.status === 'completed').length,
  };

  useEffect(() => {
    fetchRequests();

  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/custom-service-request/customer`, {
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



  const getStatusMessage = (status: string, isPaid: boolean) => {
    switch (status) {
      case 'pending':
        return "Your request is awaiting a quote from the provider.";
      case 'quoted':
        return isPaid 
          ? "You've accepted the quote and paid for the service." 
          : "The provider has sent you a quote. Please review and accept or reject.";
      case 'accepted':
        return isPaid 
          ? "Your payment has been processed. The provider will begin work soon." 
          : "You've accepted the quote. Please proceed to payment.";
      case 'rejected':
        return "You've rejected the provider's quote.";
      case 'completed':
        return "The service has been completed successfully.";
      default:
        return "";
    }
  };

  const handleAcceptQuote = async (requestId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/custom/${requestId}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'accepted' }
            : req
        ));
        alert("Quote accepted successfully! You can now proceed with payment.");
      } else {
        alert("Failed to accept quote");
      }
    } catch (error) {
      console.error("Error accepting quote:", error);
      alert("Error accepting quote");
    }
  };

  const handleRejectQuote = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to reject this quote? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/custom/${requestId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected' }
            : req
        ));
        alert("Quote rejected successfully.");
      } else {
        alert("Failed to reject quote");
      }
    } catch (error) {
      console.error("Error rejecting quote:", error);
      alert("Error rejecting quote");
    }
  };

  const handlePayment = (request: CustomServiceRequest) => {
    if (!request.custom_price) {
      alert("No custom price available for this request.");
      return;
    }

    const customServiceItem = {
      id: request.id,
      productId: request.service_id,
      name: request.service_name || "Custom Service",
      price: request.custom_price,
      quantity: 1,
      image: request.service_image || "/default-service.jpg",
      providerId: request.provider_id,
      type: "service" as const,
      customizations: request.customizations
    };

    sessionStorage.setItem("checkoutItems", JSON.stringify([customServiceItem]));
    sessionStorage.setItem("customServiceRequest", JSON.stringify(request));
    
    setSelectedRequest(request);
    setShowPaymentPage(true);
  };

  const handlePaymentSuccess = () => {
    if (selectedRequest) {
      setRequests(prev => prev.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: 'completed', is_paid: true }
          : req
      ));
    }
    setShowPaymentPage(false);
    setSelectedRequest(null);
    fetchRequests(); // Refresh data to ensure consistency
  };
    
  const getStatusBadge = (status: string, isPaid: boolean) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      quoted: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800"
    };
    
    const displayStatus = isPaid ? "completed" : status;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusColors[displayStatus as keyof typeof statusColors]
      }`}>
        {displayStatus.toUpperCase()}
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

  const toggleRequestDetails = (requestId: string) => {
    if (expandedRequestId === requestId) {
      setExpandedRequestId(null);
    } else {
      setExpandedRequestId(requestId);
    }
  };

  // Complete escrow payment (calls backend POST /api/payments/:id/complete-escrow)


  if (showPaymentPage) {
    return <PaymentPage onPaymentSuccess={handlePaymentSuccess} />;
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}>
        <div className="max-w-4xl mx-auto">
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
  

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 ${darkMode ? "bg-gray-700" : "bg-gray-300"} rounded w-1/4 mb-6`}></div>
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow`}>
                  <div className={`h-4 ${darkMode ? "bg-gray-700" : "bg-gray-300"} rounded w-3/4 mb-2`}></div>
                  <div className={`h-4 ${darkMode ? "bg-gray-700" : "bg-gray-300"} rounded w-1/2`}></div>
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
          My Account
        </h1>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button onClick={() => setActiveTab('requests')} className="px-4 py-2 font-medium hover:text-blue-600 focus:text-blue-600 border-b-2 border-transparent hover:border-blue-600 focus:border-blue-600 transition-all">
            Customization Requests
          </button>
          <button onClick={() => setActiveTab('payments')}  className="px-4 py-2 font-medium hover:text-blue-600 focus:text-blue-600 border-b-2 border-transparent hover:border-blue-600 focus:border-blue-600 transition-all ml-6">
            Payment History
          </button>
        </div>

        {activeTab === 'requests' ? (
          <>
            {/* Status Filter Tabs */}
            {requests.length > 0 && (
              <div
                className={`mb-6 p-4 rounded-lg shadow ${
                  darkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Filter Requests
                </h3>
                <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                  {(['all', 'pending', 'quoted', 'accepted', 'rejected', 'completed'] as StatusFilter[]).map((status) => {
                    const colorClasses: Record<StatusFilter, string> = {
                      all: darkMode ? "text-blue-400" : "text-blue-600",
                      pending: darkMode ? "text-yellow-400" : "text-yellow-600",
                      quoted: darkMode ? "text-blue-400" : "text-blue-600",
                      accepted: darkMode ? "text-green-400" : "text-green-600",
                      rejected: darkMode ? "text-red-400" : "text-red-600",
                      completed: darkMode ? "text-gray-400" : "text-gray-600",
                    };
                    const isActive = statusFilter === status;
                    const borderClass = isActive
                      ? "border-2 border-blue-500 shadow-lg"
                      : "";
                    const bgClass = isActive
                      ? darkMode
                        ? "bg-gray-700"
                        : "bg-blue-50"
                      : "";

                    return (
                      <div
                        key={status}
                        className={`min-w-[110px] px-2 py-3 text-center cursor-pointer hover:opacity-80 rounded-lg transition-all duration-200 ${borderClass} ${bgClass}`}
                        onClick={() => setStatusFilter(status)}
                      >
                        <div className={`text-2xl font-bold ${colorClasses[status]}`}>
                          {statusCounts[status]}
                        </div>
                        <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg mb-2">No {statusFilter !== 'all' ? statusFilter : ''} customization requests.</p>
                <p className="text-sm">Browse our marketplace to request custom services!</p>
                <button
                  onClick={() => navigate("/marketplace")}
                  className={`mt-4 px-6 py-2 rounded-md ${
                    darkMode 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Browse Services
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {statusFilter === 'all' ? 'All Requests' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests`}
                </h2>
                
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg shadow transition-all duration-200 ${
                      darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
                    }`}
                  >
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleRequestDetails(request.id)}
                    >
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {request.service_name || "Custom Service Request"}
                        </h3>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Requested on {formatDate(request.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status, request.is_paid)}
                        <svg 
                          className={`w-5 h-5 transition-transform ${darkMode ? "text-gray-400" : "text-gray-500"} ${
                            expandedRequestId === request.id ? "transform rotate-180" : ""
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {expandedRequestId === request.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <h4 className={`font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              Your Customization Requests
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
                              Provider Information
                            </h4>
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              <strong>Name:</strong> {request.provider_name || "Unknown Provider"}
                            </p>
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              <strong>Contact:</strong> {request.provider_contact || "Not provided"}
                            </p>
                          </div>
                        </div>

                        {request.custom_price && (
                          <div className={`border-t pt-4 mt-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <h4 className={`font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              Quoted Price
                            </h4>
                            <p className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                              ${Number(request.custom_price).toFixed(2)}
                            </p>
                          </div>
                        )}

                        <div className={`border-t pt-4 mt-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                          <p className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {getStatusMessage(request.status, request.is_paid)}
                          </p>

                          {request.status === 'quoted' && !request.is_paid && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleAcceptQuote(request.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Accept Quote
                              </button>
                              <button
                                onClick={() => handleRejectQuote(request.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Reject Quote
                              </button>
                            </div>
                          )}

                          {(request.status === 'accepted' && !request.is_paid) && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => handlePayment(request)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Proceed to Payment
                              </button>
                              <button
                                onClick={() => handleRejectQuote(request.id)}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                Cancel Request
                              </button>
                            </div>
                          )}

                          {(request.is_paid) && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => alert(`Service details would open here for ${request.service_name}`)}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                              >
                                Generate report
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <PaymentHistory darkMode={darkMode} />
        )}
      </div>
    </div>
  );
}