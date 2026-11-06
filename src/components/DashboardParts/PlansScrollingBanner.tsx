import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import { Link } from 'react-router-dom';
import { AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { API_BASE } from '../../api/apiClient';

export default function SubscriptionBanner() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { darkMode } = useDarkMode();
  const { token } = useAuth();

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch(`${API_BASE}/api/provider/subscription-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          if (data.subscriptions && data.subscriptions.length > 0) {
            setSubscriptions(data.subscriptions);
          } else {
            setSubscriptions([{
              plan_name: '',
              created_at: null,
              ends_at: null,
              status: 'inactive'
            }]);
          }
          setVisible(true);
        } else {
          setVisible(false);
        }
      } catch (err) {
        console.error("Error fetching subscription status:", err);
      }
    }
    fetchSubscriptions();

    const interval = setInterval(fetchSubscriptions, 60000);
    return () => clearInterval(interval);
  }, [token]);

  if (!visible || subscriptions.length === 0) return null;

  const firstSub = subscriptions[0];
  const isInactive = !firstSub?.ends_at || firstSub?.status !== 'active';

  return (
    <div className={`sticky top-14 z-30 w-full overflow-hidden border-b transition-colors duration-200 text-xs font-medium py-2 px-4 ${
      isInactive
        ? darkMode
          ? 'bg-[#E5252A]/15 border-[#E5252A]/30 text-red-200'
          : 'bg-[#FFF5F5] border-[#E5252A]/20 text-[#151515]'
        : darkMode
          ? 'bg-gray-900 border-gray-800 text-gray-300'
          : 'bg-white border-[#E5E5E5] text-[#151515]'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={scrollRef}
            className="inline-block whitespace-nowrap animate-marquee"
            style={{
              animation: `scroll 45s linear infinite`,
            }}
          >
            {subscriptions.concat(subscriptions).map((sub, idx) => {
              if (!sub.ends_at) {
                return (
                  <span key={idx} className="mr-12 inline-flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#E5252A] flex-shrink-0" />
                    <span>You need an active provider subscription to publish services and listings.</span>
                  </span>
                );
              }
              const start = new Date(sub.created_at).toLocaleDateString();
              const end = new Date(sub.ends_at).toLocaleDateString();
              const isActive = sub.status === 'active';
              return (
                <span key={idx} className="mr-12 inline-flex items-center gap-1.5">
                  {isActive ? (
                    <Sparkles className="w-3.5 h-3.5 text-[#E5252A] flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-[#E5252A] flex-shrink-0" />
                  )}
                  <span>
                    {isActive
                      ? `Active ${sub.plan_name} plan (${start} — ${end})`
                      : `Your ${sub.plan_name} plan expired on ${end}. Renew to maintain storefront visibility.`}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <Link
          to="/dashboard/upgrade"
          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-[#E5252A] hover:bg-[#c91d22] text-white transition-colors shadow-xs"
        >
          <span>{isInactive ? 'Subscribe Now' : 'Manage Plans'}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
