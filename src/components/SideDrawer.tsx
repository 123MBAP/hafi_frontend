// components/SideDrawer.tsx
import { useDarkMode } from "@/context/DarkMode";
import React from "react";
import { Link } from "react-router-dom";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userType: string;
  logout: (reason?: 'manual' | 'token_expired' | 'session_expired') => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({
  open,
  onClose,
  isLoggedIn,
  userType,
  logout,
}) => {
  const { darkMode } = useDarkMode();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={onClose}
        />
      )}

      {/* Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 shadow-lg z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } ${darkMode ? "bg-gray-900 text-white" : "bg-yellow-100 text-gray-900"}`}
        style={{ overflowY: "auto" }}
      >
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="text-2xl font-bold">
            &times;
          </button>
        </div>
        <nav className="flex flex-col space-y-4 px-6 py-4">
          <Link to="/" className="hover:text-purple-700" onClick={onClose}>
            Home
          </Link>
          <Link to="/services" className="hover:text-purple-700" onClick={onClose}>
            Services
          </Link>

          {!isLoggedIn ? (
            <>
              <Link to="/register" className="hover:text-purple-700" onClick={onClose}>
                Register
              </Link>
              <Link to="/login" className="hover:text-purple-700" onClick={onClose}>
                Login
              </Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="hover:text-purple-700" onClick={onClose}>
                My Profile
              </Link>
              {userType === "serviceProvider" && (
                <Link to="/dashboard" className="hover:text-purple-700" onClick={onClose}>
                  Dashboard
                </Link>
              )}
              <Link to="/wallet" className="hover:text-purple-700" onClick={onClose}>
                Wallet
              </Link>
              <button
                onClick={() => {
                  logout('manual');
                  onClose();
                }}
                className="text-left hover:text-purple-700"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </>
  );
};

export default SideDrawer;
