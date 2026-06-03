import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function SubscriptionBanner() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { darkMode } = useDarkMode();

  const { token } = useAuth();

  useEffect(() => {
    async function fetchSubscriptions() {
      const res = await fetch(`${API_BASE}/api/provider/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.subscriptions.length > 0) {
        setSubscriptions(data.subscriptions);
        setVisible(true); // show banner when content exists
      } else {
        setVisible(false); // hide if no content
      }
    }
    fetchSubscriptions();

    // Optionally, poll for updates every minute
    const interval = setInterval(fetchSubscriptions, 60000);
    return () => clearInterval(interval);
  }, [token]);

  if (!visible || subscriptions.length === 0) return null;

  return (
    <div className={`sticky top-16 z-40 w-full overflow-hidden ${darkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-100 border-yellow-400'} border-b p-2`}>
      <div
        ref={scrollRef}
        className="inline-block whitespace-nowrap"
        style={{
          animation: `scroll 60s linear infinite`,
        }}
      >
        {subscriptions.concat(subscriptions).map((sub, idx) => {
          const start = new Date(sub.created_at).toLocaleString();
          const end = new Date(sub.ends_at).toLocaleString();
          const msg =
            sub.status === 'active'
              ? `Your ${sub.plan_name} subscription started on ${start} and will end on ${end}. `
              : `Your ${sub.plan_name} subscription has expired on ${end}. Please upgrade. `;
          return <span key={idx} className="mr-10">{msg}</span>;
        })}
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); } /* duplicated content */
        }
            .scrolling-text {
    display: inline-block;
    white-space: nowrap;
    animation: scroll 100s linear infinite; /* slower speed */
  }
      `}</style>
    </div>
  );
}
