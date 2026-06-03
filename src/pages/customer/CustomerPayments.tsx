import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "@/context/DarkMode";
import { useAuth } from "@/context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

interface Payment {
  id: number;
  provider_id: number;
  customer_id: number;
  type: "direct" | "escrow";
  status: "pending" | "completed" | "cancelled";
  total: number;
  expected_arrival?: string;
  refund_after_hours?: number;
  created_at: string;
  items: Array<{
    id: number;
    product_id: number | null;
    name: string;
    price: number;
    quantity: number;
    type: string;
    image?: string;
  }>;
  customer_name?: string;
}

export default function CustomerPaymentsPage() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/payments/customer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      const { payments } = await res.json();
      setPayments(payments);
    } catch (err) {
      console.error("Payments fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();

  if (loading) {
    return <div className="p-6">Loading payments...</div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
          My Payments
        </h1>
        {payments.length === 0 ? (
          <div className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            No payments found.
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map(payment => (
              <div
                key={payment.id}
                className={`p-4 rounded-lg shadow ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {payment.type === "escrow" ? "Escrow Payment" : "Direct Payment"}
                    </div>
                    <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Date: {formatDate(payment.created_at)}
                    </div>
                    <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Status: <span className="font-semibold">{payment.status}</span>
                    </div>
                  </div>
                  {payment.type === "escrow" && payment.status === "pending" && (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => navigate(`/payments/escrow/complete/${payment.id}`)}
                    >
                      Complete Payment
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  <div className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Items:</div>
                  <ul className="ml-4 list-disc">
                    {payment.items.map(item => (
                      <li key={item.id} className="text-sm">
                        {item.name} — ${item.price} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-2 font-bold">
                  Total: ${payment.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}