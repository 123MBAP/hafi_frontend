import { useDarkMode } from "@/context/DarkMode";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Bell, Clock, ArrowRight, Eye, Sparkles, Grid3x3 } from "lucide-react";

type Notification = {
    id: string;
    type: string;
    title: string;
    description: string;
    created_at: string;
    category_id: string;
    seller_id: string;
    provider_id: string;
    read: boolean;
    image_url: string[];
};

type ContextType = {
    setNotificationCount: (count: number) => void;
};

// Helper to shuffle array randomly
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Generate layouts that PRIORITIZE SMALL WIDTH CARDS - more columns, less single cards
const generateRowLayout = (itemCount: number): Array<'quad' | 'quint' | 'hex' | 'triple' | 'scrolling'> => {
    // Strong bias towards multi-column layouts (quad, quint, hex) for small cards
    const layouts: Array<'quad' | 'quint' | 'hex' | 'triple' | 'scrolling'> = [
        'quad', 'quint', 'hex', 'quad', 'quint', 'hex', 'quad', 'triple', 'hex', 'quint', 'quad', 'scrolling'
    ];
    const result = [];
    let remaining = itemCount;
    
    while (remaining > 0) {
        // Random pick with HEAVY bias towards multi-column layouts (80% chance for quad/quint/hex)
        const rand = Math.random();
        let layout: 'quad' | 'quint' | 'hex' | 'triple' | 'scrolling';
        
        if (rand < 0.3) layout = 'quad';
        else if (rand < 0.55) layout = 'quint';
        else if (rand < 0.75) layout = 'hex';
        else if (rand < 0.85) layout = 'triple';
        else layout = 'scrolling';
        
        // Adjust based on remaining items
        if (layout === 'hex' && remaining < 6) layout = 'quint';
        if (layout === 'quint' && remaining < 5) layout = 'quad';
        if (layout === 'quad' && remaining < 4) layout = 'triple';
        if (layout === 'triple' && remaining < 3) layout = 'quad';
        if (layout === 'scrolling' && remaining < 4) layout = 'quad';
        
        result.push(layout);
        if (layout === 'triple') remaining -= 3;
        else if (layout === 'quad') remaining -= 4;
        else if (layout === 'quint') remaining -= 5;
        else if (layout === 'hex') remaining -= 6;
        else if (layout === 'scrolling') remaining -= 8;
    }
    return result;
};

export default function NotificationsPage() {
    const { darkMode } = useDarkMode();
    const { setNotificationCount } = useOutletContext<ContextType>();
    const navigate = useNavigate();

    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [shuffledNotifications, setShuffledNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<Array<{ layout: string; items: Notification[] }>>([]);

    const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

    const normalizeImageField = (imgField: unknown): string | null => {
        if (!imgField) return null;
        const first = Array.isArray(imgField) ? imgField[0] : imgField;
        if (first === null || first === undefined) return null;

        let s = String(first).replace(/\\/g, "/").replace(/[\r\n]/g, "").trim();
        if (!s) return null;
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        if (!s.startsWith("/")) s = `/${s}`;
        return `${API_BASE}${s}`;
    };

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const res = await fetch(`${API_BASE}/api/notifications`);
                const data = await res.json();
                setAllNotifications(data);
                const unreadCount = data.filter((n: Notification) => !n.read).length;
                setNotificationCount(unreadCount);
            } catch {
                setAllNotifications([]);
                setNotificationCount(0);
            } finally {
                setLoading(false);
            }
        }

        fetchNotifications();
    }, [API_BASE, setNotificationCount]);

    // Shuffle and organize into rows when data changes
    useEffect(() => {
        if (allNotifications.length > 0) {
            const shuffled = shuffleArray([...allNotifications]);
            setShuffledNotifications(shuffled);
            
            const layouts = generateRowLayout(shuffled.length);
            let itemsLeft = [...shuffled];
            const newRows = [];
            
            for (const layout of layouts) {
                if (itemsLeft.length === 0) break;
                
                if (layout === 'triple') {
                    newRows.push({ layout, items: itemsLeft.slice(0, 3) });
                    itemsLeft = itemsLeft.slice(3);
                } else if (layout === 'quad') {
                    newRows.push({ layout, items: itemsLeft.slice(0, 4) });
                    itemsLeft = itemsLeft.slice(4);
                } else if (layout === 'quint') {
                    newRows.push({ layout, items: itemsLeft.slice(0, 5) });
                    itemsLeft = itemsLeft.slice(5);
                } else if (layout === 'hex') {
                    newRows.push({ layout, items: itemsLeft.slice(0, 6) });
                    itemsLeft = itemsLeft.slice(6);
                } else if (layout === 'scrolling') {
                    newRows.push({ layout, items: itemsLeft.slice(0, 10) });
                    itemsLeft = itemsLeft.slice(10);
                }
            }
            setRows(newRows);
        }
    }, [allNotifications]);

    const markAsRead = async (type: string, id: string) => {
        try {
            await fetch(`${API_BASE}/api/notifications/${type}/${id}/read`, {
                method: "PATCH",
            });

            setAllNotifications((prev) => {
                const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
                const unreadCount = updated.filter((n) => !n.read).length;
                setNotificationCount(unreadCount);
                return updated;
            });
            
            setShuffledNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const handleNotificationClick = async (n: Notification) => {
        try {
            await markAsRead(n.type, n.id);

            if (n.type === "adminService") {
                navigate(`/services/${n.id}`);
            } else if (n.type === "sellerProducts") {
                navigate(`/product/${n.id}`);
            } else if (n.type === "marketCat") {
                navigate(`/market?categoryId=${n.id}`);
            }
        } catch (err) {
            console.error("Failed to handle notification click", err);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // EXTREMELY SMALL CARD - prioritizes image, minimal text, small width
    const TinyCard = ({ notification }: { notification: Notification }) => {
        const src = normalizeImageField(notification.image_url);
        
        return (
            <button
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className="group w-full text-left transition-all duration-200 hover:shadow-md overflow-hidden bg-white dark:bg-gray-900 border dark:border-gray-800/60 flex flex-col"
                style={{ borderRadius: '2px' }}
            >
                {/* Image - takes priority, fixed small height */}
                <div className="relative h-36 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {src ? (
                        <img
                            src={src}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            alt={notification.title}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                    )}
                    
                    {/* Unread indicator */}
                    {!notification.read && (
                        <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        </div>
                    )}
                </div>
                
                {/* Minimal text content */}
                <div className="p-2">
                    <h3 className={`text-xs line-clamp-2 ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {notification.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-gray-400" />
                            <span className="text-[10px] text-gray-400">{formatDate(notification.created_at)}</span>
                        </div>
                        <ArrowRight className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </button>
        );
    };

    // Scrolling card - still small width
    const ScrollingCard = ({ notification }: { notification: Notification }) => {
        const src = normalizeImageField(notification.image_url);
        
        return (
            <button
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className="group w-64 flex-shrink-0 text-left transition-all duration-200 hover:shadow-md overflow-hidden bg-white dark:bg-gray-900 border dark:border-gray-800/60 flex flex-col"
                style={{ borderRadius: '2px' }}
            >
                <div className="relative h-32 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {src ? (
                        <img
                            src={src}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            alt={notification.title}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Bell className="w-6 h-6 text-gray-400" />
                        </div>
                    )}
                    {!notification.read && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    )}
                </div>
                <div className="p-2">
                    <h3 className="text-xs font-medium line-clamp-2 text-gray-800 dark:text-gray-200">
                        {notification.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-[10px] text-gray-400">{formatDate(notification.created_at)}</span>
                    </div>
                </div>
            </button>
        );
    };

    // Render a row with SMALL WIDTH CARDS
    const renderRow = (row: { layout: string; items: Notification[] }, rowIndex: number) => {
        const { layout, items } = row;
        
        // Triple row - 3 small cards
        if (layout === 'triple' && items.length >= 3) {
            return (
                <div key={rowIndex} className="mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {items.slice(0, 3).map((item, idx) => (
                            <TinyCard key={item.id + idx} notification={item} />
                        ))}
                    </div>
                </div>
            );
        }
        
        // Quad row - 4 small cards (high priority)
        if (layout === 'quad' && items.length >= 4) {
            return (
                <div key={rowIndex} className="mb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {items.slice(0, 4).map((item, idx) => (
                            <TinyCard key={item.id + idx} notification={item} />
                        ))}
                    </div>
                </div>
            );
        }
        
        // Quint row - 5 small cards
        if (layout === 'quint' && items.length >= 5) {
            return (
                <div key={rowIndex} className="mb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {items.slice(0, 5).map((item, idx) => (
                            <TinyCard key={item.id + idx} notification={item} />
                        ))}
                    </div>
                </div>
            );
        }
        
        // Hex row - 6 small cards (maximum small cards)
        if (layout === 'hex' && items.length >= 6) {
            return (
                <div key={rowIndex} className="mb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {items.slice(0, 6).map((item, idx) => (
                            <TinyCard key={item.id + idx} notification={item} />
                        ))}
                    </div>
                </div>
            );
        }
        
        // Scrolling row - horizontal scroll of small cards
        if (layout === 'scrolling' && items.length >= 4) {
            return (
                <div key={rowIndex} className="mb-4 overflow-x-auto pb-2 -mx-4 px-4">
                    <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                        {items.slice(0, 10).map((item, idx) => (
                            <ScrollingCard key={item.id + idx} notification={item} />
                        ))}
                    </div>
                </div>
            );
        }
        
        // Fallback - show whatever we have
        if (items.length > 0) {
            return (
                <div key={rowIndex} className="mb-4">
                    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-${Math.min(items.length, 4)} gap-3`}>
                        {items.map((item, idx) => (
                            <TinyCard key={item.id + idx} notification={item} />
                        ))}
                    </div>
                </div>
            );
        }
        
        return null;
    };

    const unreadCount = allNotifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className={`w-full min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <LoadingSpinner size="lg" message="Loading updates..." variant="dots" />
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tighter text-gray-900 dark:text-white uppercase">
                                Updates
                            </h1>
                            <Sparkles className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                            {unreadCount} unread · {allNotifications.length} total
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Grid3x3 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-gray-400">Small cards</span>
                    </div>
                </div>

                {/* Random rows of SMALL WIDTH cards - no categories */}
                {rows.length === 0 ? (
                    <div className="text-center py-20">
                        <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            No updates yet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rows.map((row, idx) => renderRow(row, idx))}
                    </div>
                )}
            </div>
        </div>
    );
}