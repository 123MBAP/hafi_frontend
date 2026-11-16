import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Tells the user when their internet connection drops and when it comes back, so a page
 * that stops loading or a save that fails is not mistaken for a fault in the app.
 *
 * - Offline: a red bar stays at the top of the screen until the connection returns.
 * - Back online: a green bar confirms it for a few seconds, then disappears.
 */
export default function ConnectionStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [showRestored, setShowRestored] = useState(false);
  const wasOffline = useRef(!online);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const goOffline = () => {
      window.clearTimeout(hideTimer.current);
      wasOffline.current = true;
      setShowRestored(false);
      setOnline(false);
    };
    const goOnline = () => {
      setOnline(true);
      if (wasOffline.current) {
        wasOffline.current = false;
        setShowRestored(true);
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setShowRestored(false), 4000);
      }
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  if (online && !showRestored) return null;

  return (
    <div
      role={online ? 'status' : 'alert'}
      aria-live="assertive"
      className={`fixed top-0 inset-x-0 z-[10001] flex items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:text-sm font-bold text-white shadow-md ${
        online ? 'bg-emerald-600' : 'bg-[#E5252A]'
      }`}
    >
      {online ? (
        <>
          <Wifi className="w-4 h-4 shrink-0" />
          <span>You're back online.</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>No internet connection. Check your network — changes won't be saved until you're back online.</span>
        </>
      )}
    </div>
  );
}
