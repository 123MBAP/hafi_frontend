import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDarkMode } from "@/context/DarkMode";
import { useAuth } from "@/context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function CompleteEscrowPaymentPage() {
  const { darkMode } = useDarkMode();
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuth();


  useEffect(() => {
    fetchPayment();
  }, []);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch payment");
      const payment = await res.json();
      setPayment(payment);
    } catch (err) {
      console.error("Payment fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/${id}/complete-escrow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to complete escrow payment");

      alert("Payment completed! Funds released to provider.");
      navigate("/payments");
    } catch (err) {
      alert("Failed to complete escrow payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading payment...</div>;
  if (!payment) return <div className="p-6">Payment not found.</div>;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}>
      <div className="max-w-2xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
          Complete Escrow Payment
        </h1>
        <div className={`p-4 rounded-lg shadow ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="mb-2 font-bold">Payment ID: {payment.id}</div>
          <div>Status: {payment.status}</div>
          <div>Type: {payment.type}</div>
          <div>Total: ${payment.total.toFixed(2)}</div>
          <div className="mt-4 font-medium">Items:</div>
          <ul className="ml-4 list-disc">
            {payment.items?.map((item: any) => (
              <li key={item.id} className="text-sm">
                {item.name} — ${item.price} × {item.quantity}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <button
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={submitting}
              onClick={handleComplete}
            >
              {submitting ? "Completing..." : "Complete Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}