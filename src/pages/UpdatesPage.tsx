import { useDarkMode } from "@/context/DarkMode";
import { API_BASE } from "@/api/apiClient";
import { fetchEdgeNotifications } from "@/api/workerClient";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
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
    provider_id?: string;
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
    const result: Array<'quad' | 'quint' | 'hex' | 'triple' | 'scrolling'> = [];
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
                let data: Notification[] = [];
                try {
                    data = await fetchEdgeNotifications();
                } catch {
                    const res = await fetch(`${API_BASE}/api/notifications`);
                    data = await res.json();
                }
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
            } else if (n.type === "uploadedProduct" && n.provider_id) {
                navigate(`/product-or-service-detail/${n.provider_id}/${n.id}`);
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

    // Refined card with consistent design tokens
    const TinyCard = ({ notification }: { notification: Notification }) => {
        const src = normalizeImageField(notification.image_url);
        
        return (
            <button
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className="group w-full text-left transition-all duration-200 hover:shadow-lg rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[#E5252A] dark:hover:border-[#E5252A] flex flex-col h-full shadow-sm"
            >
                {/* Image */}
                <div className="relative h-36 w-full overflow-hidden bg-gray-50 dark:bg-black">
                    {src ? (
                        <img
                            src={src}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            alt={notification.title}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Bell className="w-7 h-7" />
                        </div>
                    )}
                    
                    {/* Unread indicator */}
                    {!notification.read && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#E5252A] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span>New</span>
                        </div>
                    )}
                </div>
                
                {/* Text content */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                    <h3 className={`text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-[#E5252A] transition-colors ${
                        !notification.read ? 'font-bold text-[#151515] dark:text-white' : 'font-medium text-[#666666] dark:text-zinc-400'
                    }`}>
                        {notification.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{formatDate(notification.created_at)}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-[#E5252A] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </button>
        );
    };

    // Scrolling card
    const ScrollingCard = ({ notification }: { notification: Notification }) => {
        const src = normalizeImageField(notification.image_url);
        
        return (
            <button
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className="group w-60 flex-shrink-0 text-left transition-all duration-200 hover:shadow-lg rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[#E5252A] dark:hover:border-[#E5252A] flex flex-col shadow-sm"
            >
                <div className="relative h-32 w-full overflow-hidden bg-gray-50 dark:bg-black">
                    {src ? (
                        <img
                            src={src}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            alt={notification.title}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Bell className="w-6 h-6" />
                        </div>
                    )}
                    {!notification.read && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#E5252A] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span>New</span>
                        </div>
                    )}
                </div>
                <div className="p-3">
                    <h3 className={`text-xs font-semibold line-clamp-2 leading-snug group-hover:text-[#E5252A] transition-colors ${
                        !notification.read ? 'text-[#151515] dark:text-white' : 'text-[#666666] dark:text-zinc-400'
                    }`}>
                        {notification.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(notification.created_at)}</span>
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
        <div className={`w-full min-h-screen ${darkMode ? 'bg-black' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Editorial Header */}
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: '/' },
                        { label: 'Updates' },
                    ]}
                    title="Platform Updates"
                    subtitle="Latest notifications, product releases, service listings, and announcements across HafiConnect."
                    badge={unreadCount > 0 ? `${unreadCount} unread updates` : undefined}
                />

                {/* Rows of cards */}
                {rows.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-[#E5252A]" />
                        </div>
                        <h3 className="text-base font-bold text-[#151515] dark:text-white mb-1">
                            No updates yet
                        </h3>
                        <p className="text-xs sm:text-sm text-[#666666] dark:text-zinc-400">
                            Check back soon for new announcements and market arrivals.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rows.map((row, idx) => renderRow(row, idx))}
                    </div>
                )}
            </div>
        </div>
    );
}