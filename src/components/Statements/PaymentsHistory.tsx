// components/PaymentHistory.tsx
import { PaymentFilter, usePaymentHistory } from "@/components/Statements/Hooks/usePaymentHistory";
import { useState } from "react";

interface PaymentHistoryProps {
  darkMode: boolean;
}

const PaymentHistory = ({ darkMode }: PaymentHistoryProps) => {
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [disputingPaymentId, setDisputingPaymentId] = useState<string | null>(null);
  const [releasingPaymentId, setReleasingPaymentId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedPaymentForDispute, setSelectedPaymentForDispute] = useState<any | null>(null);

  const {
    payments,
    loading,
    error,
    filter,
    setFilter,
    paymentCounts,
    disputeEscrowPayment,
    releaseEscrowPayment
  } = usePaymentHistory();

  // ---------- Dispute Modal Handlers ----------
  const handleOpenDispute = (payment: any) => {
    setSelectedPaymentForDispute(payment);
    setShowDisputeModal(true);
  };

  const handleCloseDispute = () => {
    setShowDisputeModal(false);
    setDisputeReason("");
    setSelectedPaymentForDispute(null);
  };

  const handleSubmitDispute = async () => {
    if (!selectedPaymentForDispute || !disputeReason.trim()) {
      alert("Please provide a reason for the dispute");
      return;
    }

    setDisputingPaymentId(selectedPaymentForDispute.id);
    try {
      await disputeEscrowPayment(selectedPaymentForDispute.id, disputeReason.trim());
      alert("Dispute submitted successfully! Our team will review your case.");
      handleCloseDispute();
    } catch (err: any) {
      alert("Failed to submit dispute: " + (err.message || "Unknown error"));
    } finally {
      setDisputingPaymentId(null);
    }
  };

  // ---------- Escrow Actions ----------
  const handleReleaseEscrow = async (paymentId: string) => {
    if (!window.confirm("Are you sure you want to release escrow funds to the service provider?")) return;

    setReleasingPaymentId(paymentId);
    try {
      await releaseEscrowPayment(paymentId);
      alert("Escrow funds released successfully!");
    } catch (err: any) {
      alert("Failed to release escrow: " + (err.message || "Unknown error"));
    } finally {
      setReleasingPaymentId(null);
    }
  };

  // ---------- Utility Functions ----------
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  // ---------- Professional Status Display ----------
  const getPaymentStatusInfo = (payment: any) => {
    const { type, status, is_disbursed, is_released, disputed } = payment;

    if (type === "direct") {
      if (status === "pending") {
        return {
          message: "Payment pending - Please check your phone to confirm the transaction",
          color: "bg-yellow-50 text-yellow-800 border-yellow-200",
          icon: "⏳"
        };
      } else if (status === "completed" && !is_disbursed) {
        return {
          message: "Payment confirmed - Sending funds to service provider",
          color: "bg-blue-50 text-blue-800 border-blue-200",
          icon: "🔄"
        };
      } else if (is_disbursed) {
        return {
          message: "Funds successfully sent to service provider",
          color: "bg-green-50 text-green-800 border-green-200",
          icon: "✅"
        };
      } else if (status === "failed") {
        return {
          message: "Payment failed - Please try again or contact support",
          color: "bg-red-50 text-red-800 border-red-200",
          icon: "❌"
        };
      }
    }  else if (type === "escrow") {
  if (disputed) {
    return {
      message: "The customer raised a dispute and the payment is disputed currently under review by our team will be resolved soon",
      reason: payment.dispute_reason || "No reason provided",
      color: "bg-orange-50 text-orange-800 border-orange-200",
      icon: "⚠️"
    };
      } else if (is_released) {
        return {
          message: "Escrow released - Funds sent to service provider",
          color: "bg-green-50 text-green-800 border-green-200",
          icon: "💰"
        };
      } else if (status === "pending") {
        return {
          message: "Payment pending - Please check your phone to confirm",
          color: "bg-yellow-50 text-yellow-800 border-yellow-200",
          icon: "⏳"
        };
      } else if (status === "completed") {
        return {
          message: `Payment secured - ${formatCurrency(payment.total)} held in by HafiConnect until ${payment.expected_arrival ? formatDate(payment.expected_arrival) : 'release date'}`,
          color: "bg-blue-50 text-blue-800 border-blue-200",
          icon: "🔒"
        };
      }
    }

    // Default status
    return {
      message: `Payment ${status}`,
      color: "bg-gray-50 text-gray-800 border-gray-200",
      icon: "ℹ️"
    };
  };

  const getPaymentTypeDisplay = (type: string) => {
    const types = {
      direct: { name: "Direct Payment", color: "bg-green-100 text-green-800" },
      escrow: { name: "Escrow Payment", color: "bg-blue-100 text-blue-800" }
    };
    return types[type as keyof typeof types] || { name: type, color: "bg-gray-100 text-gray-800" };
  };

  // ---------- Filter Logic ----------
const filteredPayments = payments.filter(payment => {
  switch (filter) {
    case 'all':
      return true;
    case 'completedPayments':
      return (
        (payment.type === 'direct' && payment.is_disbursed) ||
        (payment.type === 'escrow' && payment.is_released) ||
        payment.resolved_by_admin === true
      );
    case 'pending':
      return payment.status === 'pending' || 
        (payment.type === 'escrow' && !payment.disputed && !payment.is_released);
    case 'disbursing':
      return payment.type === 'direct' && payment.status === 'completed' && !payment.is_disbursed;
    case 'disputed':
      return payment.disputed === true;
    case 'failed_disbursement':
      return payment.type === 'direct' && payment.status === 'failed';
    case 'refunded':
      return payment.status === 'refunded';
    case 'cancelled':
      return payment.status === 'cancelled';
    case 'pending_bookings':
      return payment.type === 'escrow' && !payment.disputed && !payment.is_released;
    default:
      return true;
  }
});


  // ---------- Toggle Payment Details ----------
  const togglePaymentDetails = (paymentId: string) => {
    setExpandedPaymentId(expandedPaymentId === paymentId ? null : paymentId);
  };

  // ---------- Render ----------
  if (loading) return (
    <div className={`flex justify-center items-center py-12 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
      Loading payments...
    </div>
  );
  
  if (error) return (
    <div className={`p-4 rounded-lg ${darkMode ? "bg-red-900/20 text-red-300" : "bg-red-50 text-red-700"} border border-red-200`}>
      <div className="flex items-center">
        <span className="text-lg mr-2">⚠️</span>
        <span>Error loading payments: {error}</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Dispute Escrow Payment
            </h3>
            <p className={`text-sm mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Please describe the issue with this payment. Our support team will review your case.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className={`w-full p-3 border rounded-md mb-4 resize-none ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "bg-white text-gray-900 border-gray-300 placeholder-gray-500"}`}
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={handleCloseDispute} 
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitDispute} 
                disabled={disputingPaymentId !== null || !disputeReason.trim()} 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {disputingPaymentId ? "Submitting..." : "Submit Dispute"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className={`mb-6 p-6 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Filter Payments</h3>
        <div className="flex flex-wrap gap-2">
          {(['all', 'completedPayments', 'pending', 'disbursing', 'disputed', 'failed_disbursement', 'refunded', 'cancelled', 'pending_bookings'] as PaymentFilter[])
            .filter(f => paymentCounts[f] > 0)
            .map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filter === f 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : `${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`
                }`}
              >
                {f.replace(/_/g, ' ').toUpperCase()} ({paymentCounts[f]})
              </button>
            ))}
        </div>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className={`text-center py-16 rounded-lg ${darkMode ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"} border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="text-6xl mb-4">💳</div>
          <p className="text-lg font-medium mb-2">No payments found</p>
          <p className="text-sm">
            {filter !== 'all' ? `No ${filter.replace('_', ' ')} payments available.` : "You haven't made any payments yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map(payment => {
            const statusInfo = getPaymentStatusInfo(payment);
            const typeInfo = getPaymentTypeDisplay(payment.type);
            
            return (
              <div key={payment.id} className={`rounded-lg shadow-sm border transition-all duration-200 ${
                darkMode ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                {/* Payment Header */}
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => togglePaymentDetails(payment.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.name}
                        </span>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${statusInfo.color} mb-3`}>
<div className="flex items-center gap-2">
  <span className="text-lg">{statusInfo.icon}</span>
  <span className="text-sm font-medium">
    {statusInfo.reason && ` The customer Said " ${statusInfo.reason}".`}
    {statusInfo.message && ` ${statusInfo.message}`}
  </span>
</div>

                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(payment.total)}
                          </p>
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {formatDate(payment.created_at)}
                          </p>
                        </div>
                        
                        {payment.provider_name && (
                          <div className="text-right">
                            <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              Service Provider
                            </p>
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {payment.provider_name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <svg 
                      className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 mt-1 ${
                        expandedPaymentId === payment.id ? "rotate-180" : ""
                      } ${darkMode ? "text-gray-400" : "text-gray-500"}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Payment Details */}
                {expandedPaymentId === payment.id && (
                  <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      {/* Payment Information */}
                      <div>
                        <h4 className={`font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Payment Details
                        </h4>
                        <div className={`space-y-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          <div className="flex justify-between">
                            <span>Order Type:</span>
                            <span className="font-medium">{payment.is_custom ? 'Custom Order' : 'Standard Order'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment Method:</span>
                            <span className="font-medium capitalize">{payment.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Network Provider:</span>
                            <span className="font-medium capitalize">{payment.network_type?.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Order Date:</span>
                            <span className="font-medium">{formatDate(payment.created_at)}</span>
                          </div>
                          {payment.customer_name && (
                            <div className="flex justify-between">
                              <span>Customer:</span>
                              <span className="font-medium">{payment.customer_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Service Details */}
                      <div>
                        <h4 className={`font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Service Information
                        </h4>
                        <div className={`space-y-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {payment.expected_arrival && (
                            <div className="flex justify-between">
                              <span>Expected Completion:</span>
                              <span className="font-medium">{formatDate(payment.expected_arrival)}</span>
                            </div>
                          )}
                          {payment.refund_after_hours && (
                            <div className="flex justify-between">
                              <span>Refund Window:</span>
                              <span className="font-medium">{payment.refund_after_hours} hours</span>
                            </div>
                          )}
                          {payment.is_disbursed && payment.disbursed_to_provider_at && (
                            <div className="flex justify-between">
                              <span>Provider Paid:</span>
                              <span className="font-medium text-green-600">{formatDate(payment.disbursed_to_provider_at)}</span>
                            </div>
                          )}
                          {payment.is_released && payment.escrow_released_at && (
                            <div className="flex justify-between">
                              <span>Escrow Released:</span>
                              <span className="font-medium text-green-600">{formatDate(payment.escrow_released_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="mt-6">
                      <h4 className={`font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {payment.is_custom ? 'Services/Products' : 'Order Items'}
                      </h4>
                      <div className={`rounded-lg border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                        {payment.items.map((item: any, idx: number) => (
                          <div key={idx} className={`flex justify-between items-center p-3 ${
                            idx !== payment.items.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                          }`}>
                            <div className="flex-1">
                              <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                {item.quantity}x {item.name}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-500 capitalize mt-1">
                                {item.type} • {formatCurrency(item.price)} each
                              </p>
                            </div>
                            <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        <div className={`flex justify-between items-center p-3 border-t-2 ${
                          darkMode ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"
                        } font-bold`}>
                          <span>Total Amount</span>
                          <span>{formatCurrency(payment.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Escrow Actions */}
                    {payment.type === "escrow" && !payment.disputed && !payment.is_released && payment.status === "completed" && (
                      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex-wrap">
                        <button
                          onClick={() => handleReleaseEscrow(payment.id)}
                          disabled={releasingPaymentId === payment.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {releasingPaymentId === payment.id ? "Releasing Funds..." : "Release to Provider"}
                        </button>

                        <button
                          onClick={() => handleOpenDispute(payment)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Raise Dispute
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default PaymentHistory;