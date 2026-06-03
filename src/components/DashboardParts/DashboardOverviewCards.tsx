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

  return (
    <div className={`grid md:grid-cols-4 gap-6 mb-6 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Bookings Card — Phase 2 only */}
      {showPhase2Cards && (
        <div className={`shadow-lg rounded-2xl p-4 border hover:shadow-xl transition-all
          ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <h3 className="text-xl font-semibold mb-2">Bookings</h3>
          <p>You have new service bookings.</p>
          <Link
            to="/dashboard/payments"
            className={`mt-2 inline-block ${darkMode ? 'text-teal-300 hover:text-teal-400' : 'text-blue-600 hover:text-blue-800'} hover:underline`}
          >
            View Bookings
          </Link>
        </div>
      )}

      {/* Requested Products Card — Phase 2 only */}
      {showPhase2Cards && (
        <div className={`shadow-lg rounded-2xl p-4 border hover:shadow-xl transition-all
          ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <h3 className="text-xl font-semibold mb-2">Requested Products</h3>
          <p>Customers are requesting custom products.</p>
          <Link
            to="/dashboard/requests"
            className={`mt-2 inline-block ${darkMode ? 'text-teal-300 hover:text-teal-400' : 'text-blue-600 hover:text-blue-800'} hover:underline`}
          >
            Check Requests
          </Link>
        </div>
      )}


      {/* Upgrade Plan Card */}
      <div className={`shadow-lg rounded-2xl p-4 border hover:shadow-xl transition-all
        ${darkMode ? 'bg-yellow-900 border-yellow-700 text-yellow-200' : 'bg-yellow-100 border-yellow-300 text-yellow-800'}`}>
        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Upgrade Your Plan</h3>
        <p>Start uploading and make your products visible to clients.</p>
        <Link
          to="/dashboard/upgrade"
          className={`mt-2 inline-block font-medium ${darkMode ? 'text-yellow-300 hover:text-yellow-400' : 'text-yellow-700 hover:text-yellow-900'} hover:underline`}
        >
          Upgrade Now
        </Link>
      </div>


      {/* Provider Orders Card */}
      {showProviderOrdersCard && (
        <div className={`shadow-lg rounded-2xl p-4 border hover:shadow-xl transition-all ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <h3 className="text-xl font-semibold mb-2">Provider Orders</h3>
          <p>Review orders from customers and manage provider delivery status.</p>
          <Link
            to="/dashboard/orders"
            className={`mt-2 inline-block ${darkMode ? 'text-teal-300 hover:text-teal-400' : 'text-blue-600 hover:text-blue-800'} hover:underline`}
          >
            View Provider Orders
          </Link>
        </div>
      )}

      {/* Messages Card */}
      <div className={`shadow-lg rounded-2xl p-4 border hover:shadow-xl transition-all ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        <h3 className="text-xl font-semibold mb-2">Messages</h3>
        <p>Check your latest customer messages.</p>
        <button onClick={() => navigate('/dashboard/messages')} className={`mt-2 inline-block ${darkMode ? 'text-teal-300 hover:text-teal-400' : 'text-blue-600 hover:text-blue-800'} hover:underline`}>
          View Messages
        </button>
      </div>



    </div>
  );
}
