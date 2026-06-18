import { useDarkMode } from "@/context/DarkMode";
import { usePhases } from "@/context/PhaseContext";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function DashboardOverviewCards() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const { isPhaseEnabled } = usePhases();
  const { isLoggedIn, user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const showProviderOrdersCard = isLoggedIn && (roles.includes('seller') || roles.includes('service_provider'));

  // Bookings and Requested Products are Phase 2 features
  const showPhase2Cards = isPhaseEnabled('phase_2');

  const cardBaseStyle = `p-5 border shadow-sm transition-all duration-300 flex flex-col justify-between`;
  const linkBtnStyle = `w-full py-1.5 px-3 border border-emerald-500 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-500 hover:text-white dark:hover:text-white text-[10px] font-bold uppercase tracking-wider text-center transition-colors duration-200 mt-4`;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Bookings Card — Phase 2 only */}
      {showPhase2Cards && (
        <div
          className={`${cardBaseStyle} ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          style={{ borderRadius: '2px' }}
        >
          <div>
            <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bookings</h3>
            <p className="text-sm">You have new service bookings.</p>
          </div>
          <Link
            to="/dashboard/payments"
            className={linkBtnStyle}
            style={{ borderRadius: '2px' }}
          >
            View Bookings
          </Link>
        </div>
      )}

      {/* Requested Products Card — Phase 2 only */}
      {showPhase2Cards && (
        <div
          className={`${cardBaseStyle} ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          style={{ borderRadius: '2px' }}
        >
          <div>
            <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Requested Products</h3>
            <p className="text-sm">Customers are requesting custom products.</p>
          </div>
          <Link
            to="/dashboard/requests"
            className={linkBtnStyle}
            style={{ borderRadius: '2px' }}
          >
            Check Requests
          </Link>
        </div>
      )}

      {/* Upgrade Plan Card */}
      <div
        className={`${cardBaseStyle} border-l-4 border-l-yellow-500 ${
          darkMode ? 'bg-gray-800 border-gray-700 text-yellow-200' : 'bg-yellow-50/50 border-gray-200 text-yellow-900'
        }`}
        style={{ borderRadius: '2px' }}
      >
        <div>
          <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>Upgrade Your Plan</h3>
          <p className="text-sm">Start uploading and make your products visible to clients.</p>
        </div>
        <Link
          to="/dashboard/upgrade"
          className="w-full py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider text-center transition-colors duration-200 mt-4"
          style={{ borderRadius: '2px' }}
        >
          Upgrade Now
        </Link>
      </div>

      {/* Provider Orders Card */}
      {showProviderOrdersCard && (
        <div
          className={`${cardBaseStyle} ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          style={{ borderRadius: '2px' }}
        >
          <div>
            <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Provider Orders</h3>
            <p className="text-sm">Review orders from customers and manage delivery status.</p>
          </div>
          <Link
            to="/dashboard/orders"
            className={linkBtnStyle}
            style={{ borderRadius: '2px' }}
          >
            View Orders
          </Link>
        </div>
      )}

      {/* Messages Card */}
      <div
        className={`${cardBaseStyle} ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
        style={{ borderRadius: '2px' }}
      >
        <div>
          <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Messages</h3>
          <p className="text-sm">Check your latest customer messages.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/messages')}
          className={linkBtnStyle}
          style={{ borderRadius: '2px' }}
        >
          View Messages
        </button>
      </div>
    </div>
  );
}
