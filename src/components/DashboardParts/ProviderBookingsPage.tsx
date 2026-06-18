import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import LoadingSpinner from '@/components/LoadingSpinner';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

type Booking = {
  id: string;
  provider_id: string;
  customer_id: string;
  type: 'direct' | 'escrow';
  status: 'pending' | 'completed' | 'refunded';
  total: number;
  expected_arrival?: string;
  refund_after_hours?: number;
  created_at: string;
  items: BookingItem[];
  customer_name?: string;
};

type BookingItem = {
  id: string;
  payment_id: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
  image: string;
};

export default function ProviderBookingsPage() {
  const { darkMode } = useDarkMode();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'refunded'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {token} = useAuth();

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/api/provider-bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBookings(data.bookings || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || `Failed to fetch bookings: ${response.status}`);
          console.error('Failed to fetch bookings:', response.status, errorData);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Network error: ${errorMessage}`);
        console.error('Failed to fetch bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [token]);

  // Filter bookings based on selected filter
  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  // Calculate total revenue
  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total), 0);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={`min-h-[50vh] flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <LoadingSpinner variant="dots" size="lg" message="Loading bookings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className={`border p-6 text-center ${darkMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-800"}`} style={{ borderRadius: '2px' }}>
          <h2 className="font-bold text-base uppercase tracking-tight mb-2">Error Loading Bookings</h2>
          <p className="text-xs">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-750 text-white font-semibold text-xs uppercase tracking-wider transition-colors duration-200"
            style={{ borderRadius: '2px' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-6xl mx-auto ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
      <h1 className={`text-2xl font-bold tracking-tighter uppercase text-center mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
        Bookings & Payments History
      </h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 border shadow-sm ${darkMode ? "bg-gray-850 border-gray-750" : "bg-white border-gray-200"}`} style={{ borderRadius: '2px' }}>
          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Bookings</h3>
          <p className="text-2xl font-extrabold mt-1">{bookings.length}</p>
        </div>
        <div className={`p-4 border shadow-sm ${darkMode ? "bg-gray-850 border-gray-750" : "bg-white border-gray-200"}`} style={{ borderRadius: '2px' }}>
          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Completed</h3>
          <p className="text-2xl font-extrabold mt-1 text-emerald-500">
            {bookings.filter(b => b.status === 'completed').length}
          </p>
        </div>
        <div className={`p-4 border shadow-sm ${darkMode ? "bg-gray-850 border-gray-750" : "bg-white border-gray-200"}`} style={{ borderRadius: '2px' }}>
          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Pending</h3>
          <p className="text-2xl font-extrabold mt-1 text-amber-500">
            {bookings.filter(b => b.status === 'pending').length}
          </p>
        </div>
        <div className={`p-4 border shadow-sm ${darkMode ? "bg-gray-850 border-gray-750" : "bg-white border-gray-200"}`} style={{ borderRadius: '2px' }}>
          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Revenue</h3>
          <p className="text-2xl font-extrabold mt-1 text-emerald-500">{totalRevenue.toLocaleString()} RWF</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className={`p-4 border shadow-sm mb-6 ${darkMode ? "bg-gray-850 border-gray-750" : "bg-white border-gray-200"}`} style={{ borderRadius: '2px' }}>
        <div className="flex flex-wrap gap-3 items-center">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Filter status:</span>
          {(['all', 'completed', 'pending', 'refunded'] as const).map((status) => {
            const active = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                  active 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                    : darkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                style={{ borderRadius: '2px' }}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className={`p-8 border text-center ${darkMode ? "bg-gray-850 border-gray-750 text-gray-400" : "bg-white border-gray-200 text-gray-500"}`} style={{ borderRadius: '2px' }}>
            <p className="text-sm font-semibold uppercase tracking-wider">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className={`border shadow-sm overflow-hidden ${darkMode ? "bg-gray-850 border-gray-750" : "bg-white border-gray-200"}`} style={{ borderRadius: '2px' }}>
              {/* Booking Header */}
              <div className={`p-4 border-b flex justify-between items-center flex-wrap gap-2 ${darkMode ? "border-gray-750 bg-gray-900/40" : "border-gray-150 bg-gray-50/50"}`}>
                <div>
                  <h3 className={`font-bold text-sm uppercase tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>Booking #{String(booking.id).slice(-6)}</h3>
                  <p className={`text-xs ${darkMode ? "text-gray-450" : "text-gray-500"} mt-0.5`}>{formatDate(booking.created_at)}</p>
                  {booking.customer_name && (
                    <p className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>Customer: {booking.customer_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider
                    ${booking.status === 'completed' ? (darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : ''}
                    ${booking.status === 'pending' ? (darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200') : ''}
                    ${booking.status === 'refunded' ? (darkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200') : ''}
                  `} style={{ borderRadius: '2px' }}>
                    {booking.status}
                  </span>
                  <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider
                    ${booking.type === 'direct' ? (darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200') : (darkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200')}
                  `} style={{ borderRadius: '2px' }}>
                    {booking.type}
                  </span>
                </div>
              </div>

              {/* Booking Items */}
              <div className="p-4">
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Items</h4>
                <div className="space-y-3">
                  {booking.items.map((item) => (
                    <div key={item.id} className={`flex items-center gap-4 p-3 border ${darkMode ? "border-gray-750 bg-gray-900/10" : "border-gray-150 bg-white"}`} style={{ borderRadius: '2px' }}>
                      <img 
                        src={item.image || '/api/placeholder/80/80'} 
                        alt={item.name}
                        className="w-16 h-16 object-cover border dark:border-gray-700"
                        style={{ borderRadius: '2px' }}
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEM0My4zMTM3IDQwIDQ2IDM3LjMxMzcgNDYgMzRDNDYgMzAuNjg2MyA0My4zMTM3IDI4IDQwIDI4QzM2LjY4NjMgMjggMzQgMzAuNjg2MyAzNCAzNEMzNCAzNy4zMTM3IDM2LjY4NjMgNDAgNDAgNDBaTTQwIDUyQzQ2LjYgNTIgNTIuOCA0OC40IDU2IDQyLjRDNjAgMzYuNCA1Ni44IDMyIDQwIDMyQzIzLjIgMzIgMjAgMzYuNCAyNCA0Mi40QzI3LjIgNDguNCAzMy40IDUyIDQwIDUyWiIgZmlsbD0iIzlDQTBCRiIvPgo8L3N2Zz4K';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-bold text-sm truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{item.name}</h5>
                        <p className={`text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5`}>{item.type}</p>
                        <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-emerald-500">{(item.price * item.quantity).toLocaleString()} RWF</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5`}>{item.price.toLocaleString()} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Footer */}
              <div className={`p-4 border-t flex justify-between items-center flex-wrap gap-2 ${darkMode ? "border-gray-750 bg-gray-900/40" : "border-gray-150 bg-gray-50/50"}`}>
                <div>
                  {booking.expected_arrival && (
                    <p className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Expected arrival: {formatDate(booking.expected_arrival)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-500">{booking.total.toLocaleString()} RWF</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">Total amount</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}