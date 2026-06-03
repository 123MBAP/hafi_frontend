/**
 * WhatsAppPromptBanner
 *
 * Shown on dashboards when:
 *   - phase_2 is disabled  (checkout falls back to WhatsApp), AND
 *   - the logged-in provider has no whatsapp_number set
 *
 * Lets the provider enter their WhatsApp number inline and save it
 * without leaving the dashboard.
 */
import { usePhases } from '@/context/PhaseContext';
import { PhoneCall, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearFetchCache } from '../../utils/cachedFetch';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

interface Props {
    /** The logged-in provider's ID (from localStorage or AuthContext) */
    providerId: string | null;
    darkMode?: boolean;
}

export default function WhatsAppPromptBanner({ providerId, darkMode = false }: Props) {
    const { isPhaseEnabled } = usePhases();
    const phase2On = isPhaseEnabled('phase_2');

    const [hasWhatsApp, setHasWhatsApp] = useState<boolean | null>(null); // null = loading
    const [dismissed, setDismissed] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saved, setSaved] = useState(false);

    // Fetch profile to check for whatsapp_number
    useEffect(() => {
        if (!providerId || phase2On) return; // only relevant when phase_2 is OFF

        const token = localStorage.getItem('token');
        fetch(`${API_BASE}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                setHasWhatsApp(!!(data.whatsapp_number && String(data.whatsapp_number).trim()));
            })
            .catch(() => setHasWhatsApp(true)); // fail-safe: don't block on error
    }, [providerId, phase2On]);

    const handleSave = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed) {
            setSaveError('Please enter a WhatsApp number.');
            return;
        }
        setSaving(true);
        setSaveError('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/profile`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ whatsapp_number: trimmed }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save number');
            }

            // Invalidate cached profile so other components re-fetch fresh data
            clearFetchCache(`${API_BASE}/api/profile`);
            setSaved(true);
            setHasWhatsApp(true);
        } catch (e: any) {
            setSaveError(e.message || 'Could not save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    // Don't render if: phase_2 is on, already has number, still loading, or dismissed
    if (phase2On || hasWhatsApp === null || hasWhatsApp || dismissed || saved) return null;

    const card = darkMode
        ? 'bg-orange-900/30 border border-orange-700 text-orange-100'
        : 'bg-orange-50 border border-orange-300 text-orange-900';

    const inputCls = darkMode
        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-400'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500';

    return (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full p-4 md:p-0">
            <div className={`relative rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl border-2 ${card} transition-all duration-500 hover:scale-[1.02]`}>
                {/* Dismiss */}
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-4 right-4 opacity-40 hover:opacity-100 hover:rotate-90 transition-all duration-300 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                    aria-label="Dismiss"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="shrink-0 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl p-3 shadow-lg shadow-orange-500/30">
                            <PhoneCall size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg tracking-tight">
                                Important Update
                            </h3>
                            <p className="text-[10px] uppercase font-black opacity-60 tracking-widest">
                                Orders are waiting
                            </p>
                        </div>
                    </div>

                    <p className="text-xs leading-relaxed opacity-80 font-medium">
                        Customers are currently checking out via WhatsApp. Please add your number to ensure you receive their orders.
                    </p>

                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type="tel"
                                placeholder="+250 7XX XXX XXX"
                                value={inputValue}
                                onChange={e => { setInputValue(e.target.value); setSaveError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                className={`w-full pl-4 pr-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${inputCls}`}
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-orange-600/25 active:scale-[0.97] disabled:opacity-50 uppercase tracking-wider"
                        >
                            {saving ? 'Saving...' : 'Connect WhatsApp'}
                        </button>
                    </div>

                    {saveError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                            <p className="text-[10px] font-bold text-red-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> {saveError}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
