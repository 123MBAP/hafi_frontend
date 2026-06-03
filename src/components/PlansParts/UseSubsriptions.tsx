// src/hooks/useSubscription.ts
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
export interface Subscription {
  plan_id: number;
  plan_name: string;
  status: "active" | "expired";
  created_at?: string;
  ends_at?: string;
  features: string[]; // <-- added features from DB
}

export function useSubscription() {
  const { fetchWithAutoLogout } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetchWithAutoLogout(`${API_BASE}/api/provider/restrict/features`);
        const json = await res.json();

        if (json.success && json.subscription) {
          setSubscription(json.subscription); // backend sends a single subscription object
        } else {
          setSubscription(null);
        }
      } catch (err) {
        console.error("❌ Error fetching subscription:", err);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, [fetchWithAutoLogout]);

  return { subscription, loading };
}
