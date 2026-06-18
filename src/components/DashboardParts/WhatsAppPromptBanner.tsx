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
        ? 'bg-gray-800 border-gray-700 text-gray-200'
        : 'bg-white border-gray-250 text-gray-800';

    const inputCls = darkMode
        ? 'bg-gray-900 border-gray-750 text-white placeholder-gray-550 focus:border-emerald-500'
        : 'bg-white border-gray-250 text-gray-900 placeholder-gray-400 focus:border-emerald-500';

    return (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full p-4 md:p-0">
            <div className={`relative p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl border ${card} transition-all duration-500 hover:scale-[1.02]`} style={{ borderRadius: '2px' }}>
                {/* Dismiss */}
                <button
                    onClick={() => setDismissed(true)}
                    className={`absolute top-2 right-2 p-1.5 opacity-40 hover:opacity-100 transition-colors border ${
                        darkMode ? 'bg-gray-800 border-gray-750 text-gray-350 hover:bg-gray-700' : 'bg-white border-gray-250 text-gray-750 hover:bg-gray-50'
                    }`}
                    style={{ borderRadius: '2px' }}
                    aria-label="Dismiss"
                >
                    <X size={16} />
                </button>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`shrink-0 p-3 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-600'}`} style={{ borderRadius: '2px' }}>
                            <PhoneCall size={20} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Important Update
                            </h3>
                            <p className={`text-[9px] uppercase font-bold tracking-wider ${darkMode ? 'text-gray-450' : 'text-gray-500'}`}>
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
                                className={`w-full pl-4 pr-4 py-2.5 border text-sm font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500/20 ${inputCls}`}
                                style={{ borderRadius: '2px' }}
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider transition-colors duration-200 disabled:opacity-50"
                            style={{ borderRadius: '2px' }}
                        >
                            {saving ? 'Saving...' : 'Connect WhatsApp'}
                        </button>
                    </div>

                    {saveError && (
                        <div className="bg-red-500/10 border border-red-500/20 px-3 py-2" style={{ borderRadius: '2px' }}>
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
