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
        ? 'bg-gray-900/90 border-teal-500/50 text-white'
        : 'bg-white border-teal-500 text-gray-900';

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
            <div className={`relative max-w-lg w-full rounded-[2.5rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] border-4 ${card} transform transition-all animate-in zoom-in-95 duration-300`}>
                <div className="flex flex-col items-center text-center gap-8">
                    <div className="shrink-0 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-[2rem] p-6 shadow-2xl shadow-teal-500/40">
                        <Briefcase size={48} />
                    </div>

                    <div className="space-y-4">
                        <h2 className="font-black text-3xl tracking-tight leading-tight">
                            Complete Your Profile
                        </h2>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-500">
                            Action Required
                        </p>
                        <p className={`text-base leading-relaxed font-medium opacity-80`}>
                            Please complete your profile information and the service you are providing.
                        </p>
                    </div>

                    <div className="w-full pt-4">
                        <Link
                            to="/profile"
                            className="w-full py-5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-lg font-black rounded-3xl transition-all shadow-2xl shadow-teal-600/30 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest group"
                        >
                            Complete Profile Now <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
