import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

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
const completedBookings = bookings.filter(b => b.status === 'completed');
console.log('Completed bookings:', completedBookings);
console.log('Total values:', completedBookings.map(b => ({total: b.total, type: typeof b.total})));

const totalRevenue = completedBookings.reduce((sum, booking) => {
  const numericTotal = Number(booking.total);
  console.log(`Adding: ${sum} + ${booking.total} (as number: ${numericTotal})`);
  return sum + numericTotal;
}, 0);

console.log('Final total revenue:', totalRevenue);

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
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Bookings</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Bookings & Payments History</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm">Total Bookings</h3>
          <p className="text-2xl font-bold">{bookings.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm">Completed</h3>
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => b.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} RWF</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="font-medium">Filter by status:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('refunded')}
            className={`px-4 py-2 rounded ${filter === 'refunded' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
          >
            Refunded
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow border text-center">
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow border overflow-hidden">
              {/* Booking Header */}
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                <div>
      <h3 className="font-semibold">Booking #{String(booking.id).slice(-6)}</h3>
      <p className="text-sm text-gray-500">{formatDate(booking.created_at)}</p>
      {booking.customer_name && (
        <p className="text-sm text-gray-600">Customer: {booking.customer_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium
                    ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${booking.status === 'refunded' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {booking.status.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium
                    ${booking.type === 'direct' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                  `}>
                    {booking.type.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Booking Items */}
              <div className="p-4">
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-3">
                  {booking.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <img 
                        src={item.image || '/api/placeholder/80/80'} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEM0My4zMTM3IDQwIDQ2IDM3LjMxMzcgNDYgMzRDNDYgMzAuNjg2MyA0My4zMTM3IDI4IDQwIDI4QzM2LjY4NjMgMjggMzQgMzAuNjg2MyAzNCAzNEMzNCAzNy4zMTM3IDM2LjY4NjMgNDAgNDAgNDBaTTQwIDUyQzQ2LjYgNTIgNTIuOCA0OC40IDU2IDQyLjRDNjAgMzYuNCA1Ni44IDMyIDQwIDMyQzIzLjIgMzIgMjAgMzYuNCAyNCA0Mi40QzI3LjIgNDguNCAzMy40IDUyIDQwIDUyWiIgZmlsbD0iIzlDQTBCRiIvPgo8L3N2Zz4K';
                        }}
                      />
                      <div className="flex-1">
                        <h5 className="font-medium">{item.name}</h5>
                        <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                        <p className="text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{(item.price * item.quantity).toLocaleString()} RWF</p>
                        <p className="text-sm text-gray-500">{item.price.toLocaleString()} RWF each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Footer */}
              <div className="p-4 border-t bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                <div>
                  {booking.expected_arrival && (
                    <p className="text-sm text-gray-600">
                      Expected arrival: {formatDate(booking.expected_arrival)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{booking.total.toLocaleString()} RWF</p>
                  <p className="text-sm text-gray-500">Total amount</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}