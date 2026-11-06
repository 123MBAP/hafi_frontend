import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkMode';
import { LayoutDashboard, User, Store, Briefcase, ShoppingBag, MessageCircle, TrendingUp, LogOut, ShieldCheck } from 'lucide-react';

export default function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
  const { darkMode } = useDarkMode();
  const location = useLocation();

  const isActiveExact = (p: string) => location.pathname === p;
  const isActivePrefix = (p: string) => location.pathname === p || (p !== '/dashboard' && location.pathname.startsWith(p + '/'));

  const getIcon = (path: string) => {
    if (path === '/dashboard') return <LayoutDashboard className="w-4 h-4" />;
    if (path === '/dashboard/account') return <User className="w-4 h-4" />;
    if (path === '/dashboard/seller') return <Store className="w-4 h-4" />;
    if (path === '/dashboard/provider') return <Briefcase className="w-4 h-4" />;
    if (path === '/dashboard/orders') return <ShoppingBag className="w-4 h-4" />;
    if (path === '/dashboard/messages') return <MessageCircle className="w-4 h-4" />;
    if (path === '/dashboard/upgrade') return <TrendingUp className="w-4 h-4" />;
    if (path === '/dashboard/agent') return <ShieldCheck className="w-4 h-4" />;
    return null;
  };

  const tabClass = (active: boolean) => `
    inline-flex items-center gap-2 px-3.5 py-3 text-xs sm:text-sm font-semibold transition-all duration-200 border-b-2
    ${active 
      ? 'text-[#E5252A] border-[#E5252A]' 
      : darkMode 
        ? 'text-gray-400 hover:text-white border-transparent hover:border-gray-700' 
        : 'text-[#666666] hover:text-[#151515] border-transparent hover:border-gray-300'
    }
  `;

  const navItems = [
    { path: '/dashboard', label: 'Overview', roles: ['all'] },
    { path: '/dashboard/seller', label: 'Seller Area', roles: ['seller'], icon: <Store className="w-4 h-4" /> },
    { path: '/dashboard/provider', label: 'Service Provider', roles: ['service_provider'], icon: <Briefcase className="w-4 h-4" /> },
    { path: '/dashboard/agent', label: 'Agent Area', roles: ['agent'], icon: <ShieldCheck className="w-4 h-4" /> },
    { path: '/dashboard/account', label: 'Account', roles: ['all'] },
    { path: '/dashboard/orders', label: 'Client Orders', roles: ['all'] },
    { path: '/dashboard/messages', label: 'Messages', roles: ['all'] },
    { path: '/dashboard/upgrade', label: 'Upgrade', roles: ['all'] },
  ];

  const isAgent = roles.includes('agent');
  const allNavItems = navItems.filter(item => {
    if (isAgent) {
      return item.roles.includes('agent');
    }
    return item.roles.some(role => role === 'all' || roles.includes(role));
  });

  // Desktop navigation - aligned to right
  const DesktopNav = () => (
    <nav className="hidden md:flex items-center justify-end gap-1 px-4">
      {allNavItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={tabClass(item.path === '/dashboard' ? isActiveExact(item.path) : isActivePrefix(item.path))}
        >
          {getIcon(item.path)}
          <span>{item.label}</span>
        </Link>
      ))}
      <button
        onClick={logout}
        className={`ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
          darkMode
            ? 'text-gray-400 hover:text-[#E5252A] hover:bg-gray-800'
            : 'text-[#666666] hover:text-[#E5252A] hover:bg-gray-100'
        }`}
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Exit</span>
      </button>
    </nav>
  );

  // Mobile navigation - right-aligned with horizontal scroll
  const MobileNav = () => (
    <nav className="md:hidden overflow-x-auto whitespace-nowrap px-3 py-1 scrollbar-none">
      <div className="flex items-center justify-start sm:justify-end gap-1 min-w-max">
        {allNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={tabClass(item.path === '/dashboard' ? isActiveExact(item.path) : isActivePrefix(item.path))}
          >
            {getIcon(item.path)}
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          onClick={logout}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            darkMode ? 'text-gray-400 hover:text-[#E5252A]' : 'text-[#666666] hover:text-[#E5252A]'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F5]'}`}>
      {/* Header Bar */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-md ${
        darkMode ? 'bg-[#0A0A0A]/90 border-gray-800' : 'bg-white/90 border-[#E5E5E5]'
      }`}>
        <div className="max-w-7xl mx-auto">
          {/* Desktop Navigation - Right Aligned */}
          <DesktopNav />
          {/* Mobile Navigation - Right Aligned */}
          <MobileNav />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
