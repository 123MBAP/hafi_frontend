import { useDarkMode } from "@/context/DarkMode";
import { usePhases } from "@/context/PhaseContext";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, PackageSearch, Sparkles, ShoppingBag, MessageSquare } from "lucide-react";

export default function DashboardOverviewCards() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const { isPhaseEnabled } = usePhases();
  const { isLoggedIn, user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const showProviderOrdersCard = isLoggedIn && (roles.includes('seller') || roles.includes('service_provider'));

  // Bookings and Requested Products are Phase 2 features
  const showPhase2Cards = isPhaseEnabled('phase_2');

  const cardBaseStyle = `p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between shadow-xs`;
  const linkBtnStyle = `w-full py-2 px-3 border border-[#E5E5E5] dark:border-gray-700 hover:border-[#E5252A] hover:bg-[#E5252A] hover:text-white dark:hover:border-[#E5252A] dark:hover:bg-[#E5252A] dark:hover:text-white text-xs font-semibold rounded-lg text-center transition-colors duration-200 mt-4`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Bookings Card — Phase 2 only */}
      {showPhase2Cards && (
        <div
          className={`${cardBaseStyle} ${
            darkMode
              ? 'bg-gray-900 border-gray-800 text-white'
              : 'bg-white border-[#E5E5E5] text-[#151515]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400">
                Bookings
              </h3>
            </div>
            <p className="text-sm font-medium">You have new service bookings.</p>
          </div>
          <Link to="/dashboard/payments" className={linkBtnStyle}>
            View Bookings
          </Link>
        </div>
      )}

      {/* Requested Products Card — Phase 2 only */}
      {showPhase2Cards && (
        <div
          className={`${cardBaseStyle} ${
            darkMode
              ? 'bg-gray-900 border-gray-800 text-white'
              : 'bg-white border-[#E5E5E5] text-[#151515]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <PackageSearch className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400">
                Requested Products
              </h3>
            </div>
            <p className="text-sm font-medium">Customers are requesting custom products.</p>
          </div>
          <Link to="/dashboard/requests" className={linkBtnStyle}>
            Check Requests
          </Link>
        </div>
      )}

      {/* Upgrade Plan Card */}
      <div
        className={`${cardBaseStyle} ${
          darkMode
            ? 'bg-gradient-to-br from-gray-900 to-gray-850 border-[#E5252A]/40 text-white'
            : 'bg-gradient-to-br from-[#FFF5F5] to-white border-[#E5252A]/30 text-[#151515]'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-[#E5252A]/10 text-[#E5252A]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5252A]">
              Upgrade Your Plan
            </h3>
          </div>
          <p className="text-sm font-medium">Start uploading and make your products visible to clients.</p>
        </div>
        <Link
          to="/dashboard/upgrade"
          className="w-full py-2 px-3 bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-semibold rounded-lg text-center transition-colors duration-200 mt-4 shadow-xs"
        >
          Upgrade Now
        </Link>
      </div>

      {/* Provider Orders Card */}
      {showProviderOrdersCard && (
        <div
          className={`${cardBaseStyle} ${
            darkMode
              ? 'bg-gray-900 border-gray-800 text-white'
              : 'bg-white border-[#E5E5E5] text-[#151515]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400">
                Provider Orders
              </h3>
            </div>
            <p className="text-sm font-medium">Review orders from customers and manage delivery status.</p>
          </div>
          <Link to="/dashboard/orders" className={linkBtnStyle}>
            View Orders
          </Link>
        </div>
      )}

      {/* Messages Card */}
      <div
        className={`${cardBaseStyle} ${
          darkMode
            ? 'bg-gray-900 border-gray-800 text-white'
            : 'bg-white border-[#E5E5E5] text-[#151515]'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[#151515] dark:text-gray-200">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400">
              Messages
            </h3>
          </div>
          <p className="text-sm font-medium">Check your latest customer messages.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/messages')}
          className={linkBtnStyle}
        >
          View Messages
        </button>
      </div>
    </div>
  );
}
