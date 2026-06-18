/**
 * ServicePromptBanner
 *
 * Shown when:
 *   - The user has the 'service_provider' role, AND
 *   - They have no service assigned (service_id is null/missing)
 *
 * Guides the user to the profile page to select a service.
 */
import { useAuth } from '@/context/AuthContext';
import { Briefcase, X, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

interface Props {
    darkMode?: boolean;
}

export default function ServicePromptBanner({ darkMode = false }: Props) {
    const { user } = useAuth();
    const [noService, setNoService] = useState<boolean | null>(null); // null = loading

    // Check if user is a service provider first
    const isServiceProvider = user?.roles?.includes('service_provider');

    useEffect(() => {
        if (!isServiceProvider) {
            setNoService(false);
            return;
        }

        const token = localStorage.getItem('token');
        fetch(`${API_BASE}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                // If service_id is missing, show the prompt
                setNoService(!data.service_id);
            })
            .catch(() => setNoService(false)); // fail-safe
    }, [isServiceProvider]);

    // Don't render if not a service provider, has a service, still loading
    if (!isServiceProvider || noService === null || !noService) return null;

    const card = darkMode
        ? 'bg-gray-850 border-gray-800 text-white'
        : 'bg-white border-gray-250 text-gray-900';

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
            <div className={`relative max-w-md w-full p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border ${card} transform transition-all animate-in zoom-in-95 duration-300`} style={{ borderRadius: '2px' }}>
                <div className="flex flex-col items-center text-center gap-6">
                    <div className={`shrink-0 p-4 border ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-450' : 'bg-gray-50 border-gray-200 text-emerald-600'}`} style={{ borderRadius: '2px' }}>
                        <Briefcase size={32} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="font-bold text-lg uppercase tracking-tight">
                            Complete Your Profile
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                            Action Required
                        </p>
                        <p className={`text-xs leading-relaxed font-medium opacity-80 mt-2`}>
                            Please complete your profile information and select the service you are providing.
                        </p>
                    </div>

                    <div className="w-full pt-2">
                        <Link
                            to="/profile"
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                            style={{ borderRadius: '2px' }}
                        >
                            Complete Profile Now <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
