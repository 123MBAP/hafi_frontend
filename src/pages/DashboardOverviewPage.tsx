import React from 'react';
import { useDarkMode } from '@/context/DarkMode';
import DashboardOverviewCards from '@/components/DashboardParts/DashboardOverviewCards';
import SubscriptionBanner from '@/components/DashboardParts/PlansScrollingBanner';

export default function DashboardOverviewPage() {
  const { darkMode } = useDarkMode();

  return (
    <div className={`min-h-screen -mx-4 sm:mx-0 overflow-x-hidden transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div
        className="sticky z-40 w-full overflow-x-hidden overflow-y-visible bg-yellow-100 border-b border-yellow-400 mb-2"
        style={{ top: 'var(--navbar-height)' }}
      >
        <SubscriptionBanner />
      </div>

      <div className={`max-w-6xl mx-auto py-4 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <h1 className="text-3xl font-semibold text-center mb-4">Overview</h1>
      </div>

      <main className="max-w-full mx-auto py-8 px-0 sm:px-4">
        <section className="py-4 px-0 md:p-8">
          <DashboardOverviewCards />
        </section>
      </main>
    </div>
  );
}
