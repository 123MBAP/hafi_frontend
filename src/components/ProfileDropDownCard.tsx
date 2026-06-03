import { Menu } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { isOnlyCustomer, isTokenExpired } from '../utils/tokenUtils';

interface ProfileDropdownProps {
  roles: string[];
  logout: (reason?: 'manual' | 'token_expired' | 'session_expired') => void;
  darkMode: boolean;
  closeMenu?: () => void;
  token?: string | null;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ roles, logout, darkMode, closeMenu, token }) => {
  
  // Function to handle profile click for customer-only users
  const handleProfileClick = () => {
    // Check if user is only a customer and token is expired
    if (token && isOnlyCustomer(token) && isTokenExpired(token)) {
      console.log('Token expired for customer-only user, auto-logging out...');
      logout('token_expired');
      return;
    }
    
    // If token is valid or user has other roles, proceed normally
    if (closeMenu) closeMenu();
  };

  const handleStatenentsClick = () => {
        // Check if user is only a customer and token is expired
    if (token && isOnlyCustomer(token) && isTokenExpired(token)) {
      console.log('Token expired for customer-only user, auto-logging out...');
      logout('token_expired');
      return;
    }
    
    // If token is valid or user has other roles, proceed normally
    if (closeMenu) closeMenu();
  };

  return (
    <Menu as="div" className="relative">
    <Menu.Button className="flex items-center space-x-2 focus:outline-none">
      <img
        src="https://ui-avatars.com/api/?name=User&background=00838F&color=fff"
        alt="Profile"
        className="w-8 h-8 rounded-full border border-hafi-teal"
      />
    </Menu.Button>
    <Menu.Items className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50 overflow-hidden
      transition-colors duration-300
      ${darkMode ? 'bg-gray-800 border border-gray-600 text-white' : 'bg-white border border-hafi-teal text-gray-700'}`}>
      <Menu.Item>
        {({ active }) => (
          <Link
            to="/profile"
            onClick={handleProfileClick}
            className={`block px-4 py-2 text-sm ${active ? 'bg-hafi-teal text-white' : ''}`}
          >
            My Profile
          </Link>
        )}
      </Menu.Item>
      <Menu.Item>
        {({ active }) => (
          <Link
            to="/storage-dashboard"
            onClick={closeMenu}
            className={`block px-4 py-2 text-sm ${active ? 'bg-hafi-teal text-white' : ''}`}
          >
            Account Dashboard
          </Link>
        )}
      </Menu.Item>
      {roles.includes('seller') && (
        <Menu.Item>
          {({ active }) => (
            <Link
              to="/seller/dashboard"
              onClick={closeMenu}
              className={`block px-4 py-2 text-sm ${active ? 'bg-hafi-teal text-white' : ''}`}
            >
              Seller Dashboard
            </Link>
          )}
        </Menu.Item>
      )}
      {roles.includes('service_provider') && (
        <Menu.Item>
          {({ active }) => (
            <Link
              to="/dashboard"
              onClick={closeMenu}
              className={`block px-4 py-2 text-sm ${active ? 'bg-hafi-teal text-white' : ''}`}
            >
              Service Dashboard
            </Link>
          )}
        </Menu.Item>
      )}
      <Menu.Item>
        {({ active }) => (
          <Link
            to="/statements"
            onClick={handleStatenentsClick}
            className={`block px-4 py-2 text-sm ${active ? 'bg-hafi-teal text-white' : ''}`}
          >
            Statements/pending actions
          </Link>
        )}
      </Menu.Item>
      <Menu.Item>
        {({ active }) => (
          <button
            onClick={() => logout('manual')}
            className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-hafi-teal text-white' : ''}`}
          >
            Logout
          </button>
        )}
      </Menu.Item>
    </Menu.Items>
  </Menu>
  );
};

export default ProfileDropdown;