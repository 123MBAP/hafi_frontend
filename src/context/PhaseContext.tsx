import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { cachedFetch } from '@/utils/cachedFetch';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

interface Phase {
    id: number;
    name: string;
    label: string;
    description: string | null;
    is_enabled: boolean;
}

interface PhaseContextValue {
    phases: Phase[];
    isPhaseEnabled: (name: string) => boolean;
    refreshPhases: () => Promise<void>;
    loading: boolean;
}

const PhaseContext = createContext<PhaseContextValue>({
    phases: [],
    isPhaseEnabled: () => false,
    refreshPhases: async () => { },
    loading: true,
});

// ── Module-level cache so HMR remounts / React Strict Mode double-invocations
//    don't fire a second request within the same 30-second window ──
// Caching is now handled by the shared cachedFetch utility.

export function PhaseProvider({ children }: { children: React.ReactNode }) {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshPhases = useCallback(async (force = false) => {
        try {
            const data = await cachedFetch<{ phases: Phase[] }>(
                `${API_BASE}/api/phases`,
                {},
                { force }
            );
            setPhases(data.phases || []);
        } catch {
            // silently fail — phases just stay empty
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshPhases();
    }, [refreshPhases]);

    const isPhaseEnabled = useCallback(
        (name: string) => phases.some((p) => p.name === name && p.is_enabled),
        [phases]
    );

    return (
        <PhaseContext.Provider value={{ phases, isPhaseEnabled, refreshPhases, loading }}>
            {children}
        </PhaseContext.Provider>
    );
}

/** Hook — use this anywhere in the app to gate features behind a phase. */
export function usePhases() {
    return useContext(PhaseContext);
}

export default PhaseContext;
