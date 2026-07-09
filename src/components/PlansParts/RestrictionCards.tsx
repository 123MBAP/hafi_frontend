// src/components/RestrictionCard.tsx
import React from "react";
// Update the import path to match the actual file location and extension
import { Subscription } from "../PlansParts/UseSubsriptions";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "@/context/DarkMode";

interface RestrictionCardProps {
  subscription: Subscription | null;
  requiredPlan?: string;
  requiredFeature?: string;
}

const RestrictionCard: React.FC<RestrictionCardProps> = ({
  subscription,
  requiredPlan,
}) => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  // Color schemes for different restriction types
  const restrictionStyles = {
    noSubscription: {
      bg: darkMode ? "bg-yellow-900/20" : "bg-yellow-50",
      border: darkMode ? "border-yellow-700" : "border-yellow-300",
      text: darkMode ? "text-yellow-200" : "text-yellow-800",
      icon: "🔒",
      title: "Access Restricted",
      button: darkMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-yellow-500 hover:bg-yellow-600"
    },
    expired: {
      bg: darkMode ? "bg-red-900/20" : "bg-red-50",
      border: darkMode ? "border-red-700" : "border-red-300",
      text: darkMode ? "text-red-200" : "text-red-800",
      icon: "⛔",
      title: "Subscription Expired",
      button: darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
    },
    planUpgrade: {
      bg: darkMode ? "bg-blue-900/20" : "bg-blue-50",
      border: darkMode ? "border-blue-700" : "border-blue-300",
      text: darkMode ? "text-blue-200" : "text-blue-800",
      icon: "🚀",
      title: "Upgrade Required",
      button: darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
    },
    featureRestricted: {
      bg: darkMode ? "bg-purple-900/20" : "bg-purple-50",
      border: darkMode ? "border-purple-700" : "border-purple-300",
      text: darkMode ? "text-purple-200" : "text-purple-800",
      icon: "🔐",
      title: "Feature Locked",
      button: darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"
    }
  };

  // Restriction card component
  const renderRestrictionCard = (styles: typeof restrictionStyles.noSubscription, message: string, buttonText: string, navigateTo: string) => {
    return (
      <div className={`relative p-6 border-2 rounded-xl ${styles.bg} ${styles.border} ${styles.text} shadow-lg`}>
        {/* Decorative corner accent */}
        <div className={`absolute top-0 right-0 w-16 h-16 overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-8 h-8 ${styles.border} border-b-2 border-l-2 rounded-bl-xl`}></div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="text-2xl flex-shrink-0">{styles.icon}</div>
          <div className="flex-1">
            <h3 className={`font-semibold text-lg mb-1 ${styles.text}`}>{styles.title}</h3>
            <p className="mb-4 leading-relaxed">{message}</p>
              <button
                onClick={() => navigate(navigateTo)}
                className={`px-5 py-2.5 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${styles.button}`}
              >
                {buttonText}
              </button>

          </div>
        </div>
        
        {/* Restriction pattern overlay */}
        <div className={`absolute inset-0 pointer-events-none opacity-5 bg-gradient-to-br from-current to-transparent rounded-xl`}></div>
      </div>
    );
  };

  // 1. No subscription at all or unpaid/implicit subscription (no ends_at)
  if (!subscription || !subscription.ends_at) {
    return renderRestrictionCard(
      restrictionStyles.noSubscription,
      "You need an active subscription to access this content. Choose a plan that fits your needs.",
      "View Plans",
      "/dashboard/upgrade"
    );
  }

  // 2. Expired subscription
  if (subscription.status === "expired") {
    return renderRestrictionCard(
      restrictionStyles.expired,
      "Your subscription has expired. Renew your plan to continue accessing premium features.",
      "Renew Plan",
      "/dashboard/upgrade"
    );
  }

  // 3. Required plan check
  if (requiredPlan && subscription.plan_name.toLowerCase() !== requiredPlan.toLowerCase()) {
    return renderRestrictionCard(
      restrictionStyles.planUpgrade,
      `This feature requires the ${requiredPlan} plan. Your current plan (${subscription.plan_name}) doesn't include this access.`,
      "Upgrade Now",
      "/dashboard/upgrade"
    );
  }

  // // 4. Required feature check
  // if (requiredFeature && !subscription.features?.includes(requiredFeature)) {
  //   return renderRestrictionCard(
  //     restrictionStyles.featureRestricted,
  //     `The "${requiredFeature}" feature is not available in your current plan. Upgrade to unlock this capability.`,
  //     "Unlock Feature",
  //     "/dashboard/upgrade"
  //   );
  // }

  return null; // ✅ Access granted
};

export default RestrictionCard;