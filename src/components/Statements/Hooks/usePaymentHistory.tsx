// hooks/usePaymentHistory.ts
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Payment {
  id: string;
  provider_id: string;
  customer_id: string;
  type: 'direct' | 'escrow';
  status: 
    | 'pending'               // waiting for customer confirmation
    | 'completed'                  // money in platform account (collection succeeded)
    | 'disbursing'            // disbursement API called, waiting for provider
    | 'disbursed'             // provider received money
    | 'released'              // escrow released
    | 'disputed'              // customer disputed payment
    | 'failed_disbursement'   // direct payment disbursement failed
  | 'refunded'
  |'failed'
  // money returned to customer
    | 'cancelled'; 
  total: number;
  is_custom: boolean;
  network_type?: string;
  expected_arrival?: string;
  refund_after_hours?: number;
  created_at: string;
  items: PaymentItem[];
  provider_name?: string;
  customer_name?: string;

  disputed?: boolean;
  dispute_reason?: string;
  escrow_released_at?: string;
  disbursement_reference_id?: string;
  disbursed_to_provider_at?: string;
  is_disbursed?: boolean;
  is_released?: boolean;
  resolved_by_admin?: boolean;
  disputed_at?: string;
  resolution?: string;
  
}

interface PaymentItem {
  id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  type: string;
  image: string | null;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

// export or declare the filter union including pending_bookings
export type PaymentFilter =
  | 'all'
  | 'direct'
  | 'escrow'
  | 'pending'
  | 'paid'
  | 'disbursing'
  | 'disbursed'
  | 'completedPayments'
  | 'released'
  | 'disputed'
  | 'failed_disbursement'
  | 'refunded'
  | 'cancelled'
  | 'pending_bookings';

export const usePaymentHistory = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PaymentFilter>('all');

  const { token } = useAuth();

  // initialize paymentCounts as a Record for the PaymentFilter keys
  const [paymentCounts, setPaymentCounts] = useState<Record<PaymentFilter, number>>({
  all: 0,
completedPayments: 0,
    direct: 0,
    escrow: 0,
    pending: 0,
    paid: 0,
    disbursing: 0,
    disbursed: 0,
    released: 0,
    disputed: 0,
    failed_disbursement: 0,
    refunded: 0,
    cancelled: 0,
    pending_bookings: 0,
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/payments/customer`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('payments',data);
        setPayments(data.payments || []);
      } else {
        console.error("Failed to fetch payments");
        setError("Failed to fetch payments");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Error fetching payments");
    } finally {
      setLoading(false);
    }
  };

  const completeEscrowPayment = async (paymentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/payments/${encodeURIComponent(paymentId)}/complete-escrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(err.message || "Failed to complete escrow");
      }
      
      // Update the payment status in local state
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { ...p, status: "disbursed" } : p
      ));
      
      return true;
    } catch (err) {
      console.error("Complete escrow error", err);
      throw err;
    }
  };

  // Filter payments based on selected filter
// Filter payments based on selected filter
const filteredPayments = payments.filter(payment => {
  switch (filter) {
    case 'all':
      return true;

    // Payment types
case 'completedPayments':
  return (
    (payment.type === 'direct' && payment.is_disbursed) ||
    (payment.type === 'escrow' && payment.is_released) ||
    payment.resolved_by_admin === true
  );

    // Statuses
    case 'pending':
      // Either direct or escrow payment that is not yet completed
      return payment.status === 'pending' || 
             (payment.type === 'escrow' && !payment.disputed && !payment.is_released);
             
    case 'paid':
      // Customer has paid successfully (even if money not yet sent to provider)
      return payment.status === 'completed';

    case 'disbursing':
      // Direct payment: completed but not yet disbursed to provider
      return payment.status === 'completed' && payment.type === 'direct' && !payment.is_disbursed;

    case 'disbursed':
      // Direct payment: money successfully sent to provider OR Escrow released
      return (payment.type === 'direct' && payment.is_disbursed) ||
             (payment.type === 'escrow' && payment.is_released);

    case 'failed_disbursement':
      // Direct payment that failed to send money
      return payment.status === 'failed';

    case 'released':
      // Escrow released (already covered in disbursed for display if needed separately)
      return payment.type === 'escrow' && payment.is_released;

    case 'disputed':
      return payment.disputed === true;

    case 'refunded':
      return payment.status === 'refunded';

    case 'cancelled':
      return payment.status === 'cancelled';

    case 'pending_bookings':
      // Escrow payments not yet disputed and not yet released
      return payment.type === 'escrow' && !payment.disputed && !payment.is_released;

    default:
      return true;
  }
});




  // Count payments by type/status for statistics
// Count payments by type/status for statistics
const paymentCountsTemp = {
  all: payments.length,
  completedPayments: payments.filter(p =>
    (p.type === 'direct' && p.is_disbursed) ||
    (p.type === 'escrow' && p.is_released) ||
    p.resolved_by_admin === true
  ).length,
  pending: payments.filter(p => p.status === 'pending').length,
  disbursing: payments.filter(p => p.status === 'disbursing').length,
  disputed: payments.filter(p => p.disputed === true || p.disputed_at !== null).length,
  failed_disbursement: payments.filter(p => p.status === 'failed_disbursement').length,
  refunded: payments.filter(p => p.status === 'refunded').length,
  cancelled: payments.filter(p => p.status === 'cancelled').length,
  pending_bookings: payments.filter(p =>
    p.type === 'escrow' && !p.disputed && !p.is_released && p.status === 'completed'
  ).length,

    direct: 0,
  escrow: 0,
  paid: 0,
  disbursed: 0,
  released: 0,
};


useEffect(() => {
  setPaymentCounts(paymentCountsTemp);
}, [payments]);



  useEffect(() => {
    fetchPayments();
  }, []);

const disputeEscrowPayment = async (paymentId: string, reason: string) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE}/api/payments/escrow/dispute/${encodeURIComponent(paymentId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || "Failed to dispute payment");
    }

    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId
          ? { ...p, status: "disputed", disputed: true, dispute_reason: reason }
          : p
      )
    );

    return true;
  } catch (err) {
    console.error("Dispute escrow error", err);
    throw err;
  }
};


const releaseEscrowPayment = async (paymentId: string) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE}/api/payments/escrow/release/${encodeURIComponent(paymentId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || "Failed to release escrow");
    }

    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId
          ? {
              ...p,
              status: "released",
              escrow_released_at: new Date().toISOString(),
              disbursed_to_provider_at: new Date().toISOString(),
            }
          : p
      )
    );

    return true;
  } catch (err) {
    console.error("Release escrow error", err);
    throw err;
  }
};

  return {
    payments: filteredPayments,
    allPayments: payments,
    loading,
    error,
    filter,
    setFilter,
    paymentCounts,
    refetch: fetchPayments,
    completeEscrowPayment,
    disputeEscrowPayment,
    releaseEscrowPayment,

  };
};