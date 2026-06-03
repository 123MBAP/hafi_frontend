import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDarkMode } from '@/context/DarkMode';

type PendingTx = {
  id: number;
  plan_id?: number | null;
  plan_name?: string | null;
  method?: string | null;
  phone?: string | null;
  amount: number;
  status: string;
  reference_id?: string | null;
  provider_external_id?: string | null;
  created_at: string;
};

type StoragePendingTx = {
  id: number;
  size_gb: number;
  amount: number;
  payment_method: string;
  phone_number?: string | null;
  status: string;
  reference_id?: string | null;
  provider_external_id?: string | null;
  purchase_type?: 'base' | 'addon';
  created_at: string;
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PendingTransactionsPage() {
  const { darkMode } = useDarkMode();
  const [items, setItems] = useState<PendingTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const [storageItems, setStorageItems] = useState<StoragePendingTx[]>([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [completingStorageId, setCompletingStorageId] = useState<number | null>(null);

  const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;

  // Helper: map of reference_id -> total storage add-on amount
  const storageAmountByRef = (refs => {
    const map = new Map<string, number>();
    storageItems.forEach(s => {
      if (s.reference_id) {
        map.set(s.reference_id, (map.get(s.reference_id) || 0) + Number(s.amount || 0));
      }
    });
    return map;
  })();

  // Storage items not linked to any plan pending (so we don't show duplicates)
  const unlinkedStorageItems = storageItems.filter(s => !items.some(tx => tx.reference_id && tx.reference_id === s.reference_id));

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/provider/upgrade/transactions/pending`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: PendingTx[] = Array.isArray(data) ? data : (data.data || []);
      setItems(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load pending transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoragePending = async () => {
    setLoadingStorage(true);
    setStorageError(null);
    try {
      const res = await fetch(`${API_BASE}/api/storage/purchase/pending`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: StoragePendingTx[] = Array.isArray(data) ? data : (data.data || []);
      setStorageItems(list);
    } catch (e: any) {
      setStorageError(e?.message || 'Failed to load storage pending transactions');
    } finally {
      setLoadingStorage(false);
    }
  };

  const markCompleted = async (tx: PendingTx) => {
    setCompletingId(tx.id);
    setError(null);
    try {
      if (!tx.reference_id) throw new Error('Missing reference ID for this transaction');
      // Use combined callback to ensure storage add-on (if any) is also finalized  
      const res = await fetch(`${API_BASE}/api/provider/upgrade/combined/momo/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referenceId: tx.reference_id, status: 'SUCCESSFUL' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchPending();
      await fetchStoragePending();
    } catch (e: any) {
      setError(e?.message || 'Failed to complete transaction');
    } finally {
      setCompletingId(null);
    }
  };

  const markStorageCompleted = async (tx: StoragePendingTx) => {
    setCompletingStorageId(tx.id);
    setStorageError(null);
    try {
      if (!tx.reference_id) throw new Error('Missing reference ID for this storage transaction');
      const res = await fetch(`${API_BASE}/api/storage/purchase/momo/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referenceId: tx.reference_id, status: 'SUCCESSFUL' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchStoragePending();
    } catch (e: any) {
      setStorageError(e?.message || 'Failed to complete storage transaction');
    } finally {
      setCompletingStorageId(null);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchStoragePending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pending Upgrade Transactions</h1>
        <Link to="/dashboard/upgrade" className={`text-sm ${darkMode ? 'text-teal-300 hover:text-teal-200' : 'text-blue-600 hover:text-blue-700'}`}>Back to Plans</Link>
      </div>

      {loading && (
        <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>Loading...</div>
      )}

      {error && (
        <div className={`p-4 mb-3 rounded-md border ${darkMode ? 'bg-red-900/30 text-red-200 border-red-700' : 'bg-red-50 text-red-700 border-red-200'}`}>{error}</div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className={`p-6 rounded-md text-center ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
          No pending transactions.
        </div>
      )}

      <div className="space-y-3">
        {items.map((tx) => (
          <div key={tx.id} className={`p-4 rounded-lg border flex items-center justify-between ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
            <div className="min-w-0">
              <div className="font-medium truncate">{tx.plan_name || 'Unknown Plan'}</div>
              {(() => {
                const addOn = tx.reference_id ? (storageAmountByRef.get(tx.reference_id) || 0) : 0;
                const total = Number(tx.amount || 0) + addOn;
                const isCombined = addOn > 0;
                return (
                  <>
                    <div className="text-sm opacity-80">
                      Amount: {total.toLocaleString?.() || total} {isCombined && (
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${darkMode ? 'bg-teal-900 text-teal-200' : 'bg-teal-100 text-teal-700'}`}>Combined</span>
                      )} | Method: {tx.method || '—'} | Phone: {tx.phone || '—'}
                    </div>
                    {isCombined && (
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Breakdown: Base {Number(tx.amount || 0).toLocaleString?.() || tx.amount} + Add-ons {addOn.toLocaleString?.() || addOn}
                      </div>
                    )}
                  </>
                );
              })()}
              <div className="text-xs opacity-60">Ref: {tx.reference_id || '—'} | Created: {new Date(tx.created_at).toLocaleString()}</div>
            </div>
            <button
              onClick={() => markCompleted(tx)}
              disabled={completingId === tx.id}
              className={`ml-4 px-3 py-2 rounded-md text-sm ${darkMode ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} disabled:opacity-60`}
            >
              {completingId === tx.id ? 'Marking...' : 'Mark as Completed'}
            </button>
          </div>
        ))}
      </div>

      <hr className={`my-8 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pending Storage Purchases</h2>
      </div>

      {loadingStorage && (
        <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>Loading...</div>
      )}

      {storageError && (
        <div className={`p-4 mb-3 rounded-md border ${darkMode ? 'bg-red-900/30 text-red-200 border-red-700' : 'bg-red-50 text-red-700 border-red-200'}`}>{storageError}</div>
      )}

      {!loadingStorage && storageItems.length === 0 && !storageError && (
        <div className={`p-6 rounded-md text-center ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
          No pending storage purchases.
        </div>
      )}

      <div className="space-y-3">
        {unlinkedStorageItems.map((tx) => (
          <div key={tx.id} className={`p-4 rounded-lg border flex items-center justify-between ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
            <div className="min-w-0">
              <div className="font-medium truncate">{tx.purchase_type === 'base' ? 'Base Storage Plan' : 'Storage Add-on'}</div>
              <div className="text-sm opacity-80">Amount: {tx.amount} | Size: {tx.size_gb}GB | Method: {tx.payment_method || '—'} | Phone: {tx.phone_number || '—'}</div>
              <div className="text-xs opacity-60">Ref: {tx.reference_id || '—'} | Created: {new Date(tx.created_at).toLocaleString()}</div>
            </div>
            <button
              onClick={() => markStorageCompleted(tx)}
              disabled={completingStorageId === tx.id}
              className={`ml-4 px-3 py-2 rounded-md text-sm ${darkMode ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} disabled:opacity-60`}
            >
              {completingStorageId === tx.id ? 'Marking...' : 'Mark as Completed'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
