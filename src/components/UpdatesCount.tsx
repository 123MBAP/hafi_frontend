import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import UpdatesIcon from "./UpdatesIcon";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
function Layout() {
  const [notificationCount, setNotificationCount] = useState(0);

  // Optional: Fetch notification count separately
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch(`${API_BASE}/api/notifications`);
        const data = await res.json();
        setNotificationCount(data.length); // You can also filter specific types
      } catch {
        setNotificationCount(0);
      }
    }

    fetchCount();
  }, []);

  return (
    <div>
      {/* Header or navbar */}
      <div className="flex justify-end p-4 bg-white shadow-md">
        <UpdatesIcon count={notificationCount} onClick={() => {/* navigate to notifications */}} />
      </div>

      {/* Main content */}
      <Outlet context={{ setNotificationCount }} />
    </div>
  );
}

export default Layout;
