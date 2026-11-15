import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Crown, Shield } from 'lucide-react';
import { API_BASE } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkMode';

type Plan = {
  plan_display_name?: string;
  plan_name?: string;
  subscription_end?: string | null;
};

type Methods = {
  mtn?: { phone?: string };
  airtel?: { phone?: string };
  momoPay?: { code?: string };
};

const ROLE_LABELS: Record<string, string> = {
  seller: 'Seller',
  service_provider: 'Service Provider',
  customer: 'Customer',
  admin: 'Admin',
  agent: 'Agent',
};

const METHOD_LABELS: { key: keyof Methods; label: string }[] = [
  { key: 'mtn', label: 'MTN MoMo' },
  { key: 'airtel', label: 'Airtel Money' },
  { key: 'momoPay', label: 'MoMo Pay' },
];

// Same DD:HH:MM:SS countdown as the account dashboard.
function countdown(end?: string | null): { text: string; expired: boolean } {
  const diff = end ? new Date(end).getTime() - Date.now() : NaN;
  if (Number.isNaN(diff) || diff <= 0) return { text: '00:00:00:00', expired: true };
  const pad = (n: number) => n.toString().padStart(2, '0');
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { text: `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`, expired: false };
}

/**
 * Compact account overview shown at the top of the seller and provider dashboards:
 * subscription time left, configured payment methods and roles, each with a link
 * to where it is managed.
 */
export default function AccountSummaryCard({ className = '' }: { className?: string }) {
  const { token } = useAuth();
  const { darkMode } = useDarkMode();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [methods, setMethods] = useState<Methods>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      const [accountRes, credsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/users/account-dashboard`, { headers }),
        fetch(`${API_BASE}/api/provider/get/credentials`, { headers }),
      ]);
      if (cancelled) return;

      if (accountRes.status === 'fulfilled' && accountRes.value.ok) {
        const account = await accountRes.value.json();
        if (cancelled) return;
        setPlan(account?.plan || null);
        setRoles(Array.isArray(account?.user_profile?.roles) ? account.user_profile.roles : []);
      }
      if (credsRes.status === 'fulfilled' && credsRes.value.ok) {
        const creds = await credsRes.value.json();
        if (cancelled) return;
        setMethods(creds?.methods || {});
      }
      setLoading(false);
    };

    load().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Tick once a second so the countdown stays live
  const [, setTick] = useState(0);
  const subscriptionEnd = plan?.subscription_end;
  useEffect(() => {
    if (!subscriptionEnd) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [subscriptionEnd]);

  const remaining = countdown(subscriptionEnd);
  const planName = plan?.plan_display_name || plan?.plan_name || 'No plan';
  const methodRows = METHOD_LABELS.map(({ key, label }) => {
    const m: any = methods?.[key];
    return { key, label, number: (m?.phone || m?.code || '') as string };
  });

  const card = darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200';
  const divider = darkMode ? 'divide-zinc-800' : 'divide-gray-200';
  const label = darkMode ? 'text-zinc-400' : 'text-[#666666]';
  const value = darkMode ? 'text-white' : 'text-[#151515]';
  const chip = darkMode
    ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
    : 'bg-[#F5F5F5] border-gray-200 text-[#151515]';
  const editBtn = `shrink-0 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors hover:border-[#E5252A] hover:text-[#E5252A] ${
    darkMode ? 'border-zinc-700 text-zinc-200' : 'border-gray-200 text-[#151515]'
  }`;
  const placeholder = <span className={`text-xs ${label}`}>Loading…</span>;

  return (
    <div className={`rounded-xl border shadow-sm ${card} ${className}`}>
      <div className={`grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x ${divider}`}>
        {/* Subscription */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3 min-w-0">
            <Crown className="w-4 h-4 mt-0.5 shrink-0 text-[#E5252A]" />
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-widest ${label}`}>Subscription</div>
              {loading ? placeholder : (
                <>
                  <div className={`text-lg font-mono font-black tracking-widest leading-tight ${remaining.expired ? 'text-red-500' : 'text-[#E5252A]'}`}>
                    {remaining.text}
                  </div>
                  <div className={`flex gap-3 text-[8px] font-bold uppercase tracking-widest ${label}`}>
                    <span>Days</span>
                    <span>Hrs</span>
                    <span>Mins</span>
                    <span>Secs</span>
                  </div>
                  <div className={`text-xs truncate mt-1 ${label}`}>
                    {remaining.expired ? `${planName} · Expired` : planName}
                  </div>
                </>
              )}
            </div>
          </div>
          <Link
            to="/dashboard/upgrade"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#E5252A] hover:bg-[#c91d22] text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            Upgrade
          </Link>
        </div>

        {/* Payment methods */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3 min-w-0">
            <CreditCard className="w-4 h-4 mt-0.5 shrink-0 text-[#E5252A]" />
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${label}`}>Payment Methods</div>
              {loading ? placeholder : (
                <div className="space-y-1">
                  {methodRows.map(({ key, label: name, number }) => (
                    <div key={key} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                      <span className={label}>{name}</span>
                      {number ? (
                        <span className={`font-mono font-bold ${value}`}>{number}</span>
                      ) : (
                        <span className={`italic ${label}`}>Not set</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Link to="/dashboard/account#payment-methods" className={editBtn}>
            Edit
          </Link>
        </div>

        {/* Roles */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3 min-w-0">
            <Shield className="w-4 h-4 mt-0.5 shrink-0 text-[#E5252A]" />
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${label}`}>Roles</div>
              {loading ? placeholder : roles.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <span key={role} className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${chip}`}>
                      {ROLE_LABELS[role] || role.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={`text-xs ${label}`}>No roles</div>
              )}
            </div>
          </div>
          <Link to="/dashboard/account#roles" className={editBtn}>
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
