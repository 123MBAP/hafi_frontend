import { useDarkMode } from '@/context/DarkMode';
import { usePhases } from '@/context/PhaseContext';
import { Menu, Transition } from '@headlessui/react';
import React, { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../pages/images/connect.png';
import { isOnlyCustomer, isTokenExpired } from '../utils/tokenUtils';
import CartIconWithCount from "./CartIcon";
import SearchResults from './ui/SearchPage';
import UpdatesIcon from "./UpdatesIcon";
import { API_BASE } from '../api/apiClient';
import { 
  User, 
  ShoppingBag, 
  MessageSquare, 
  LayoutDashboard, 
  LogOut, 
  Sun, 
  Moon, 
  ChevronDown, 
  Search as SearchIcon,
  X as CloseIcon,
  Menu as MenuIcon,
  Building2,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  notificationCount: number;
}

const NAVBAR_HEIGHT = 64; // px

const getInitials = (name?: string | null, email?: string | null) => {
  const value = (name || email || 'User').trim();
  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
};

const toProfileImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return '';
  if (/^(https?:|data:|blob:)/i.test(imageUrl)) return imageUrl;
  return `${API_BASE}/${imageUrl.replace(/^\/+/, '')}`;
};

const Navbar: React.FC<NavbarProps> = ({ notificationCount }) => {
  const { isLoggedIn, logout, token, user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { isPhaseEnabled } = usePhases();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  const profileImage = toProfileImageUrl(
    user?.profile_image || user?.profile_image_url || user?.image_url
  );
  const profileInitials = getInitials(user?.name, user?.email);

  useEffect(() => {
    setProfileImageError(false);
  }, [profileImage]);

  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const fetchProfileImage = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Profile API HTTP ${response.status}`);
        }

        const profile = await response.json();
        const image = profile?.profile_image || profile?.profile_image_url || profile?.image_url;
        if (image && image !== profileImage) {
          updateUser({ profile_image: image });
        }
      } catch (error) {
        console.error('Failed to load profile image:', error);
      }
    };

    fetchProfileImage();
  }, [isLoggedIn, token]);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMobileProfileClick = (e: React.MouseEvent) => {
    if (token && isOnlyCustomer(token) && isTokenExpired(token)) {
      e.preventDefault();
      console.log('Token expired for customer-only user, auto-logging out...');
      logout('token_expired');
      return;
    }
    closeMenu();
  };

  const isNavActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/real-estate' && location.pathname.startsWith('/real-estate/commissioners')) {
      return false;
    }
    return location.pathname.startsWith(path);
  };

  const handleSearch = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setIsSearching(true);
    setSearchOpen(true);
    try {
      const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();

      if (location.pathname === '/search') {
        if (trimmed.length > 0) {
          navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true });
        } else {
          navigate(`/search`, { replace: true });
        }
      }

      if (trimmed.length >= 3) {
        if (location.pathname !== '/search') {
          setSearchOpen(false);
          navigate(`/search?q=${encodeURIComponent(trimmed)}`);
          return;
        }
        setSearchOpen(true);
        handleSearch(trimmed);
      } else {
        setSearchResults([]);
        setSearchOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const qParam = (params.get('q') || '').trim();
      if (qParam !== searchQuery) {
        setSearchQuery(qParam);
      }
    }
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  const handleResultClick = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const primaryNavItems = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Market', path: '/market' },
    { label: 'Shops', path: '/shops' },
    { label: 'Made in Rwanda', path: '/made-in-rwanda', highlight: true },
    { label: 'Real Estate', path: '/real-estate' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        darkMode ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#151515]'
      } border-b ${darkMode ? 'border-zinc-850' : 'border-[#E5E5E5]'}`}
    >
      {/* ── Desktop Upper Header ── */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img src={logo} alt="HafiConnect Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className={`text-xl font-extrabold tracking-tight uppercase ${darkMode ? 'text-white' : 'text-[#0A0A0A]'}`}>
               <span className="text-[#E5252A]">Hafi</span>Connect
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#666666] dark:text-zinc-400 -mt-1">
                Rwanda Marketplace
              </span>
            </div>
          </Link>

          {/* Prominent Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div
                className={`flex items-center rounded-lg border px-3.5 py-2 transition-all ${
                  darkMode
                    ? 'bg-zinc-900/90 border-zinc-800 focus-within:border-[#E5252A] focus-within:ring-2 focus-within:ring-[#E5252A]/20'
                    : 'bg-[#F5F5F5] border-[#E5E5E5] focus-within:bg-white focus-within:border-[#E5252A] focus-within:ring-2 focus-within:ring-[#E5252A]/15'
                }`}
              >
                <SearchIcon className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search services, products, properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setSearchOpen(true)}
                  className={`w-full bg-transparent text-sm font-medium outline-none ${
                    darkMode ? 'text-white placeholder-zinc-400' : 'text-[#151515] placeholder-gray-500'
                  }`}
                />
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-t-[#E5252A] border-gray-300 rounded-full animate-spin shrink-0" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                    className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </form>

            {/* Live Search Results Dropdown */}
            {searchOpen && (
              <div className="absolute left-0 right-0 mt-2 z-50">
                {isSearching ? (
                  <div className={`rounded-xl border shadow-xl p-4 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-gray-300' : 'bg-white border-gray-200 text-black'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-t-[#E5252A] border-gray-300 rounded-full animate-spin" />
                      <span className="text-sm font-semibold">Searching HafiConnect...</span>
                    </div>
                  </div>
                ) : (
                  <SearchResults
                    results={searchResults}
                    onResultClick={handleResultClick}
                    darkMode={darkMode}
                    searchQuery={searchQuery}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right Action Utilities (Cart, Updates, User/Account Menu) */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-850 text-gray-700 dark:text-gray-200 transition-colors relative"
              title="View Cart"
            >
              <CartIconWithCount />
            </Link>

            {/* Notifications / Updates Icon */}
            <div className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-850 transition-colors">
              <UpdatesIcon count={notificationCount} onClick={() => navigate("/updates")} />
            </div>

            {/* User Account Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button
                className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                  darkMode
                    ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
                    : 'border-gray-200 hover:border-gray-300 bg-white shadow-sm'
                }`}
              >
                {isLoggedIn ? (
                  profileImage && !profileImageError ? (
                    <img
                      src={profileImage}
                      alt={`${user?.name || 'User'} avatar`}
                      onError={() => setProfileImageError(true)}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A0A0A] text-[11px] font-bold text-white dark:bg-white dark:text-[#0A0A0A]">
                      {profileInitials}
                    </span>
                  )
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                    <User className="w-4 h-4" />
                  </span>
                )}
                <span className="text-xs font-bold max-w-[100px] truncate hidden lg:inline">
                  {isLoggedIn ? (user?.name ? user.name.split(' ')[0] : 'Account') : 'Sign In'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-700"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items
                  className={`absolute right-0 mt-2 w-60 rounded-xl shadow-xl py-2 z-50 border focus:outline-none ${
                    darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  {isLoggedIn ? (
                    <>
                      {/* User Info Header */}
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-zinc-800">
                        <p className="text-xs font-bold truncate">{user?.name || 'HafiConnect User'}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email || ''}</p>
                        {roles.length > 0 && (
                          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                            {roles.join(' • ')}
                          </span>
                        )}
                      </div>

                      {/* Primary Account Links */}
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={`flex items-center gap-2.5 px-4 py-2 text-xs font-semibold ${
                                active ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-gray-50 text-[#E5252A]') : ''
                              }`}
                            >
                              <User className="w-4 h-4 text-gray-400" />
                              My Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/orders"
                              className={`flex items-center gap-2.5 px-4 py-2 text-xs font-semibold ${
                                active ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-gray-50 text-[#E5252A]') : ''
                              }`}
                            >
                              <ShoppingBag className="w-4 h-4 text-gray-400" />
                              My Orders
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/customer-feedbacks"
                              className={`flex items-center gap-2.5 px-4 py-2 text-xs font-semibold ${
                                active ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-gray-50 text-[#E5252A]') : ''
                              }`}
                            >
                              <MessageSquare className="w-4 h-4 text-gray-400" />
                              Customer Feedbacks
                            </Link>
                          )}
                        </Menu.Item>

                        {roles.includes('admin') ? (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin/dashboard"
                                className={`flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 ${
                                  active ? (darkMode ? 'bg-zinc-800' : 'bg-red-50') : ''
                                }`}
                              >
                                <LayoutDashboard className="w-4 h-4 text-red-600" />
                                Admin Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                        ) : (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/dashboard"
                                className={`flex items-center gap-2.5 px-4 py-2 text-xs font-semibold ${
                                  active ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-gray-50 text-[#E5252A]') : ''
                                }`}
                              >
                                <LayoutDashboard className="w-4 h-4 text-gray-400" />
                                Provider Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                      </div>

                      <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />

                      {/* Theme Toggle */}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={toggleDarkMode}
                            className={`flex items-center justify-between w-full px-4 py-2 text-xs font-semibold ${
                              active ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-gray-50 text-gray-900') : ''
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-400" />}
                              {darkMode ? 'Light Theme' : 'Dark Theme'}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                              {darkMode ? 'Dark' : 'Light'}
                            </span>
                          </button>
                        )}
                      </Menu.Item>

                      <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />

                      {/* Logout */}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => logout('manual')}
                            className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs font-bold text-red-600 transition-colors ${
                              active ? (darkMode ? 'bg-red-950/40 text-red-400' : 'bg-red-50 text-red-700') : ''
                            }`}
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        )}
                      </Menu.Item>
                    </>
                  ) : (
                    <>
                      {/* Guest Auth Options */}
                      <div className="p-3 space-y-2">
                        <Link
                          to="/login"
                          state={{ backgroundLocation: location, from: location.pathname }}
                          className="block w-full py-2 text-center text-xs font-bold uppercase tracking-wider text-white bg-[#E5252A] hover:bg-[#C81E23] rounded-lg transition-colors shadow-sm"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/register"
                          onClick={closeMenu}
                          className="block w-full py-2 text-center text-xs font-bold uppercase tracking-wider border border-gray-300 dark:border-zinc-700 hover:border-gray-400 text-gray-900 dark:text-white rounded-lg transition-colors"
                        >
                          Register
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={toggleDarkMode}
                            className={`flex items-center justify-between w-full px-4 py-2 text-xs font-semibold ${
                              active ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-gray-50 text-gray-900') : ''
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-400" />}
                              {darkMode ? 'Light Theme' : 'Dark Theme'}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                              {darkMode ? 'Dark' : 'Light'}
                            </span>
                          </button>
                        )}
                      </Menu.Item>
                    </>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* ── Desktop Primary Navigation Row (Clean Single Row) ── */}
        <div className={`border-t ${darkMode ? 'border-zinc-850 bg-[#0A0A0A]' : 'border-gray-100 bg-[#F5F5F5]/60'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
              {primaryNavItems.map((item) => {
                const active = isNavActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap rounded-md ${
                      active
                        ? 'text-[#E5252A] font-extrabold'
                        : darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-zinc-850'
                        : 'text-[#151515] hover:text-[#E5252A] hover:bg-white'
                    }`}
                  >
                    {item.label}
                    {item.highlight && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#E5252A] align-middle" />
                    )}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#E5252A] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Secondary Destinations on the right */}
            <div className="hidden lg:flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Link
                to="/real-estate/commissioners"
                className={`px-3 py-1.5 rounded-md transition-colors hover:text-[#E5252A] ${
                  isNavActive('/real-estate/commissioners') ? 'text-[#E5252A]' : ''
                }`}
              >
                Commissioners
              </Link>
              <span className="text-gray-300 dark:text-zinc-700">·</span>
              <Link
                to="/updates"
                className={`px-3 py-1.5 rounded-md transition-colors hover:text-[#E5252A] ${
                  isNavActive('/updates') ? 'text-[#E5252A]' : ''
                }`}
              >
                Updates
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Navigation Header ── */}
      <div className="md:hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMenu}
              className="p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="HafiConnect Logo" className="h-8 w-auto object-contain" />
              <span className={`text-base font-extrabold uppercase tracking-tight ${darkMode ? 'text-white' : 'text-[#0A0A0A]'}`}>
                Hafi<span className="text-[#E5252A]">Connect</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/cart" className="p-1.5 rounded-lg text-gray-700 dark:text-gray-200">
              <CartIconWithCount />
            </Link>
            <UpdatesIcon count={notificationCount} onClick={() => navigate("/updates")} />
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div
              className={`flex items-center rounded-lg border px-3 py-1.5 ${
                darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-[#F5F5F5] border-gray-200'
              }`}
            >
              <SearchIcon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search products, services, properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setSearchOpen(true)}
                className={`w-full bg-transparent text-xs font-medium outline-none ${
                  darkMode ? 'text-white placeholder-zinc-400' : 'text-[#151515] placeholder-gray-500'
                }`}
              />
              {isSearching ? (
                <div className="w-3.5 h-3.5 border-2 border-t-[#E5252A] border-gray-300 rounded-full animate-spin shrink-0" />
              ) : null}
            </div>

            {searchOpen && (
              <div className="absolute left-0 right-0 mt-1 z-50">
                {isSearching ? (
                  <div className={`rounded-xl border shadow-lg p-3 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-gray-300' : 'bg-white border-gray-200 text-black'}`}>
                    <span className="text-xs font-semibold">Searching...</span>
                  </div>
                ) : (
                  <SearchResults
                    results={searchResults}
                    onResultClick={handleResultClick}
                    darkMode={darkMode}
                    searchQuery={searchQuery}
                  />
                )}
              </div>
            )}
          </form>
        </div>

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed inset-y-0 left-0 w-4/5 max-w-sm z-50 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } ${darkMode ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#151515]'}`}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="HafiConnect Logo" className="h-8 w-auto" />
              <span className="text-sm font-extrabold uppercase tracking-tight">
                Hafi<span className="text-[#E5252A]">Connect</span>
              </span>
            </div>
            <button
              onClick={closeMenu}
              className="p-1 rounded-lg text-gray-500 hover:text-black dark:hover:text-white"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Primary Discovery */}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#666666] dark:text-zinc-500 mb-2 px-3">
                Discover
              </p>
              <nav className="flex flex-col space-y-1">
                {primaryNavItems.map((item) => {
                  const active = isNavActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        active
                          ? 'bg-red-50 text-[#E5252A] dark:bg-red-950/40 dark:text-red-400 font-extrabold'
                          : darkMode
                          ? 'text-gray-300 hover:bg-zinc-850'
                          : 'text-[#151515] hover:bg-gray-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.highlight && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">
                          Rwanda
                        </span>
                      )}
                    </Link>
                  );
                })}
                <Link
                  to="/real-estate/commissioners"
                  onClick={closeMenu}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    isNavActive('/real-estate/commissioners')
                      ? 'bg-red-50 text-[#E5252A] dark:bg-red-950/40'
                      : darkMode ? 'text-gray-300 hover:bg-zinc-850' : 'text-[#151515] hover:bg-gray-100'
                  }`}
                >
                  Commissioners
                </Link>
                <Link
                  to="/updates"
                  onClick={closeMenu}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    isNavActive('/updates')
                      ? 'bg-red-50 text-[#E5252A] dark:bg-red-950/40'
                      : darkMode ? 'text-gray-300 hover:bg-zinc-850' : 'text-[#151515] hover:bg-gray-100'
                  }`}
                >
                  Updates & Feed
                </Link>
              </nav>
            </div>

            {/* Account & Activity Section */}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#666666] dark:text-zinc-500 mb-2 px-3">
                Account & Activity
              </p>
              <nav className="flex flex-col space-y-1">
                <Link
                  to="/orders"
                  onClick={closeMenu}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    isNavActive('/orders') ? 'text-[#E5252A]' : ''
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                  My Orders
                </Link>
                <Link
                  to="/customer-feedbacks"
                  onClick={closeMenu}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    isNavActive('/customer-feedbacks') ? 'text-[#E5252A]' : ''
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  Customer Feedbacks
                </Link>
                {isLoggedIn && (
                  <>
                    <Link
                      to="/profile"
                      onClick={handleMobileProfileClick}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      My Profile
                    </Link>
                    {roles.includes('admin') ? (
                      <Link
                        to="/admin/dashboard"
                        onClick={closeMenu}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-red-600"
                      >
                        <LayoutDashboard className="w-4 h-4 text-red-600" />
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        onClick={closeMenu}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Provider Dashboard
                      </Link>
                    )}
                  </>
                )}
              </nav>
            </div>

            {/* Auth / Preferences Footer in Drawer */}
            <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-3">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-850"
              >
                <span className="flex items-center gap-2">
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-400" />}
                  Theme
                </span>
                <span className="text-[10px] text-gray-400">{darkMode ? 'Dark' : 'Light'}</span>
              </button>

              {isLoggedIn ? (
                <button
                  onClick={() => { logout('manual'); closeMenu(); }}
                  className="w-full text-center py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    state={{ backgroundLocation: location, from: location.pathname }}
                    className="py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white bg-[#E5252A] rounded-lg shadow-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="py-2.5 text-center text-xs font-bold uppercase tracking-wider border border-gray-300 dark:border-zinc-700 rounded-lg"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Backdrop */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 transition-opacity"
            onClick={closeMenu}
          />
        )}
      </div>
    </header>
  );
};

export default Navbar;
