import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "../Navbar";
import { useDarkMode } from "@/context/DarkMode";

export default function Layout() {
  const [notificationCount, setNotificationCount] = useState(0);
  const { darkMode } = useDarkMode();

  return (
    <div
      className={`flex flex-col min-h-screen transition-colors duration-300 overflow-x-hidden ${
        darkMode ? 'bg-gray-950 text-white' : 'bg-white text-hafi-teal'
      }`} 
    >
      <Navbar notificationCount={notificationCount} />
      <main className="flex-grow min-w-0 overflow-x-hidden px-0 py-4 sm:px-2">
        <Outlet context={{ setNotificationCount }} />
      </main>
    </div>
  );
}
