import { useDarkMode } from '@/context/DarkMode';
import { usePhases } from '@/context/PhaseContext';
import { Menu } from '@headlessui/react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../pages/images/connect.png';
import { isOnlyCustomer, isTokenExpired } from '../utils/tokenUtils';
import CartIconWithCount from "./CartIcon";
import SearchResults from './ui/SearchPage';
import UpdatesIcon from "./UpdatesIcon";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

interface NavbarProps {
  notificationCount: number;
}

const NAVBAR_HEIGHT = 64; // px

const Navbar: React.FC<NavbarProps> = ({ notificationCount }) => {
  const { isLoggedIn, logout, token, user } = useAuth();
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

  // Statements is a Phase 2 feature — hide it when phase_2 is not yet enabled.
  // It is also hidden while only phase_1 is active (phase_1 = core-only launch).
  const showStatements = isPhaseEnabled('phase_2');

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Handle mobile profile click for customer-only users
  const handleMobileProfileClick = (e: React.MouseEvent) => {
    // Check if user is only a customer and token is expired
    if (token && isOnlyCustomer(token) && isTokenExpired(token)) {
      e.preventDefault(); // Prevent navigation
      console.log('Token expired for customer-only user, auto-logging out...');
      logout('token_expired');
      return;
    }

    // If token is valid or user has other roles, proceed normally
    closeMenu();
  };

  const isActive = (path: string) => {
    const isCurrent = location.pathname === path;
    return isCurrent
      ? 'text-blue-500 font-semibold border-b-2 border-blue-500 pb-1'
      : `${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-500'} hover:border-b hover:border-gray-300 pb-1`;
  };

  const handleSearch = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setIsSearching(true);
    // Open dropdown immediately while searching
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

  // Debounced search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();

      // Always keep the URL in sync when on /search so the page reacts live
      if (location.pathname === '/search') {
        if (trimmed.length > 0) {
          navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true });
        } else {
          navigate(`/search`, { replace: true });
        }
      }

      if (trimmed.length >= 3) {
        // If we're not on the search page yet, navigate there so the full page shows live results
        if (location.pathname !== '/search') {
          setSearchOpen(false); // close inline dropdown when switching pages
          navigate(`/search?q=${encodeURIComponent(trimmed)}`);
          return; // navigation will trigger URL sync effect above next runs
        }
        // Show dropdown as user types and start searching
        setSearchOpen(true);
        handleSearch(trimmed);
      } else {
        setSearchResults([]);
        setSearchOpen(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keep the input in sync with the URL when navigating to /search with a q param
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const qParam = (params.get('q') || '').trim();
      // Only update local state if it differs, to avoid loops
      if (qParam !== searchQuery) {
        setSearchQuery(qParam);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <header
      className={`sticky top-0 z-50 shadow-md transition-colors duration-300 overflow-visible ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}
      style={{ "--navbar-height": `${NAVBAR_HEIGHT}px` } as React.CSSProperties}
    >

      {/* Desktop Navigation */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 justify-between items-center">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <img src={logo} alt="HafiConnect Logo" className="h-12" />
            <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>HafiConnect</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-grow max-w-2xl mx-8 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className={`flex items-center border rounded-lg px-4 py-1 shadow-sm transition-colors duration-300 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
              <input
                type="text"
                placeholder="Search services, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setSearchOpen(true)}
                className={`flex-grow outline-none bg-transparent transition-colors duration-300 ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-700 placeholder-gray-500'}`}
              />
              <button
                type="submit"
                className={`p-1 rounded-md ml-2 transition-colors ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-blue-600'}`}
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103 10.5a7.5 7.5 0 0013.15 6.15z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </form>
          {/* Search Results Dropdown */}
          {searchOpen && (
            <div className="absolute left-0 right-0 mt-2 z-50 max-w-full overflow-x-hidden">
              {isSearching ? (
                <div className={`rounded-lg border shadow-sm p-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
                    <span>Searching...</span>
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

        {/* Right-side actions (auth, cart, theme) */}
        <nav className="flex items-center space-x-6">
          <Link to="/market" className={`text-sm font-medium transition-colors ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-500'}`}>Market</Link>
          {/* Made in Rwanda with gradient text (no background) */}
          <Link
            to="/made-in-rwanda"
            className={`text-sm font-bold bg-gradient-to-r from-sky-500 via-yellow-400 to-green-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-200 ${location.pathname === '/made-in-rwanda' ? 'border-b-2 border-green-600 pb-1' : ''
              }`}
          >
            Made in Rwanda
          </Link>
          <Link to="/cart" className="relative">
            <CartIconWithCount />
          </Link>
      
          <UpdatesIcon count={notificationCount} onClick={() => navigate("/updates")} />
          {/* Authentication Section */}
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="flex items-center space-x-2 focus:outline-none"
            >
              <img
                src="https://ui-avatars.com/api/?name=User&background=00838F&color=fff"
                alt="Profile"
                className="w-8 h-8 rounded-full border border-hafi-teal"
              />
            </Link>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/register" className={`text-sm font-medium transition-colors ${isActive('/register')}`}>Register</Link>
              <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Login</Link>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <Menu as="div" className="relative">
            <Menu.Button className={`p-2 rounded-md transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Menu.Button>
            <Menu.Items className={`absolute right-0 mt-2 w-44 rounded-md shadow-lg py-1 z-50 transition-colors duration-300
              ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={toggleDarkMode}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-300
                      ${active ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') :
                        (darkMode ? 'text-gray-200' : 'text-gray-700')}`}
                  >
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => logout('manual')}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-300
                      ${active ? (darkMode ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700') :
                        (darkMode ? 'text-red-300' : 'text-red-600')}`}
                  >
                    Logout
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </nav>
      </div>

      {/* Desktop secondary navigation row (full-width) */}
      <div className={`hidden md:block border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 text-sm overflow-x-auto">
            <Link to="/" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/')}`}>Home</Link>
            <Link to="/services" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/services')}`}>Services</Link>
            <Link to="/market" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/market')}`}>Market</Link>
            {/* Made in Rwanda with gradient text */}
            <Link to="/made-in-rwanda"
              className={`mt-2 mb-1 text-sm font-bold bg-gradient-to-r from-sky-500 via-yellow-400 to-green-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-200 ${location.pathname === '/made-in-rwanda' ? 'border-b-2 border-green-600 pb-1' : ''
                }`}
            >
              Made in Rwanda
            </Link>
            <Link to="/real-estate" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/real-estate')}`}>Real Estate</Link>
            <Link to="/real-estate/commissioners" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/real-estate/commissioners')}`}>Commissioners</Link>
            <Link to="/updates" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/updates')}`}>Updates</Link>
            <Link to="/orders" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/orders')}`}>Orders</Link>

            <Link to="/customer-feedbacks" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/customer-feedbacks')}`}>Customer Feedbacks</Link>
            {isLoggedIn && (
              <>
                {roles.includes('admin') ? (
                  <Link to="/admin/dashboard" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/admin/dashboard')}`}>Admin Dashboard</Link>
                ) : (
                  <>
                    <Link to="/dashboard" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/dashboard')}`}>Dashboard</Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation - Unified Header */}
      <div className="md:hidden">
        {/* Unified Mobile Header */}
        <div className={`flex flex-col gap-0 px-4 pt-3 pb-3 transition-colors duration-300
          ${darkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-200'}
          rounded-b-xl shadow-md relative`} // Card look
          style={{ minHeight: `${NAVBAR_HEIGHT}px` }}
        >
          {/* Top Bar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button onClick={toggleMenu} className={`p-1 rounded-md ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <img src={logo} alt="HafiConnect Logo" className="h-10" />
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative">
                <CartIconWithCount />
              </Link>
              <UpdatesIcon count={notificationCount} onClick={() => navigate("/updates")} />
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-2 mb-1 relative">
            <div className={`flex items-center border rounded-lg px-4 py-2 shadow-sm w-full transition-colors duration-300 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
              <input
                type="text"
                placeholder="Search services, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setSearchOpen(true)}
                className={`flex-grow outline-none bg-transparent transition-colors duration-300 ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-700 placeholder-gray-500'}`}
              />
              <button
                type="submit"
                className={`p-1 rounded-md ml-2 transition-colors ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-blue-600'}`}
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103 10.5a7.5 7.5 0 0013.15 6.15z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
            {/* Search Results Dropdown for Mobile */}
            {searchOpen && (
              <div className="absolute left-0 right-0 mt-1 z-50 max-w-full overflow-x-hidden">
                {isSearching ? (
                  <div className={`rounded-lg border shadow-sm p-3 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
                      <span>Searching...</span>
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
          </form>
        </div>

        {/* Mobile Sidebar Drawer - offset by header */}
        <div
          className={`fixed left-0 w-3/4 h-full z-50 shadow-xl transition-transform duration-300 ease-in-out
            ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}
          style={{ top: `${NAVBAR_HEIGHT}px` }} // Offset so header is always visible
        >
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="HafiConnect Logo" className="h-10" />
              <h1 className="text-lg font-semibold">HafiConnect</h1>
            </div>
            <button onClick={closeMenu} className={`p-1 rounded-md ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col space-y-1 p-4">
            <Link
              to="/made-in-rwanda"
              className={`px-4 py-3 text-sm font-bold bg-gradient-to-r from-sky-500 via-yellow-400 to-green-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-200 rounded-md ${location.pathname === '/made-in-rwanda' ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
              onClick={closeMenu}
            >
              Made in Rwanda
            </Link>
            <Link to="/" className={`px-4 py-3 rounded-md transition-colors ${isActive('/')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Home</Link>
            <Link to="/services" className={`px-4 py-3 rounded-md transition-colors ${isActive('/services')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Services</Link>
            <Link to="/market" className={`px-4 py-3 rounded-md transition-colors ${isActive('/market')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Market</Link>
            <Link to="/real-estate" className={`px-4 py-3 rounded-md transition-colors ${isActive('/real-estate')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Real Estate</Link>
            <Link to="/real-estate/commissioners" className={`px-4 py-3 rounded-md transition-colors ${isActive('/real-estate/commissioners')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Commissioners</Link>
            <Link to="/updates" className={`px-4 py-3 rounded-md transition-colors ${isActive('/updates')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Updates</Link>
            <Link to="/orders" className={`mt-2 mb-1 font-medium transition-colors ${isActive('/orders')}`}>My Orders</Link>
            <Link to="/customer-feedbacks" className={`px-4 py-3 rounded-md transition-colors ${isActive('/customer-feedbacks')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Customer Feedbacks</Link>
            {isLoggedIn ? (
              <>
                    {roles.includes('admin') ? (
                      <>
                        <Link to="/admin/dashboard" className={`px-4 py-3 rounded-md transition-colors ${isActive('/admin/dashboard')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Admin Dashboard</Link>
                        <button onClick={() => { logout('manual'); closeMenu(); }} className="text-left px-4 py-3 rounded-md text-red-600 hover:bg-red-50 transition-colors">Logout</button>
                      </>
                    ) : (
                      <>
                        <Link to="/profile" className={`px-4 py-3 rounded-md transition-colors ${isActive('/profile')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={handleMobileProfileClick}>My Profile</Link>
                        <Link to="/dashboard" className={`px-4 py-3 rounded-md transition-colors ${isActive('/dashboard')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Dashboard</Link>
                        <button onClick={() => { logout('manual'); closeMenu(); }} className="text-left px-4 py-3 rounded-md text-red-600 hover:bg-red-50 transition-colors">Logout</button>
                      </>
                    )}
              </>
            ) : (
              <>
                <Link to="/register" className={`px-4 py-3 rounded-md transition-colors ${isActive('/register')} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={closeMenu}>Register</Link>
                <Link to="/login" className="px-4 py-3 rounded-md bg-blue-600 text-white text-center hover:bg-blue-700 transition-colors" onClick={closeMenu}>Login</Link>
              </>
            )}
            <div className="border-t my-2"></div>
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-3 rounded-md text-left transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
          </nav>
        </div>

        {/* Overlay */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMenu}
          ></div>
        )}
      </div>
    </header>
  );
};

export default Navbar;