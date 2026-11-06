// src/components/RestrictionCard.tsx
import React from "react";
import { Subscription } from "../PlansParts/UseSubsriptions";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "@/context/DarkMode";
import { Lock, AlertOctagon, Sparkles, ArrowRight } from "lucide-react";

interface RestrictionCardProps {
  subscription: Subscription | null;
  loading?: boolean;
  requiredPlan?: string;
  requiredFeature?: string;
}

const RestrictionCard: React.FC<RestrictionCardProps> = ({
  subscription,
  loading = false,
  requiredPlan,
}) => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  if (loading) {
    return null;
  }

  const renderRestrictionCard = (
    icon: React.ReactNode,
    title: string,
    message: string,
    buttonText: string,
    navigateTo: string
  ) => {
    return (
      <div className={`relative p-6 sm:p-8 rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-[#0A0A0A] border-gray-800 text-white'
          : 'bg-gradient-to-br from-white via-white to-[#F5F5F5] border-[#E5E5E5] text-[#151515]'
      }`}>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#E5252A]/10 text-[#E5252A]">
            {icon}
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E5252A]/10 text-[#E5252A] mb-2">
              Membership Feature
            </div>
            <h3 className="font-bold text-lg text-[#151515] dark:text-white mb-1.5">{title}</h3>
            <p className="text-sm text-[#666666] dark:text-gray-400 mb-5 leading-relaxed max-w-xl">
              {message}
            </p>
            <button
              onClick={() => navigate(navigateTo)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs active:scale-[0.98]"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 1. No active subscription
  if (!subscription || subscription.status !== "active") {
    return renderRestrictionCard(
      <Lock className="w-6 h-6" />,
      "Active Subscription Required",
      "You need an active provider subscription to publish listings, manage service inventory, and accept customer bookings.",
      "View Available Plans",
      "/dashboard/upgrade"
    );
  }

  // 2. Expired subscription
  if (subscription.status === "expired") {
    return renderRestrictionCard(
      <AlertOctagon className="w-6 h-6" />,
      "Subscription Expired",
      "Your subscription has expired. Renew your plan to continue accessing publishing tools and client bookings.",
      "Renew Subscription",
      "/dashboard/upgrade"
    );
  }

  // 3. Required plan check
  if (requiredPlan && subscription.plan_name.toLowerCase() !== requiredPlan.toLowerCase()) {
    return renderRestrictionCard(
      <Sparkles className="w-6 h-6" />,
      "Upgrade Required",
      `This feature requires the ${requiredPlan} tier. Your current tier (${subscription.plan_name}) does not include this permission.`,
      "Upgrade Plan Tier",
      "/dashboard/upgrade"
    );
  }

  return null; // Access granted
};

export default RestrictionCard;
