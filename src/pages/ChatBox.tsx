import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useRef, useState } from 'react';
import { FaEllipsisV, FaMicrophone, FaPaperclip, FaPaperPlane, FaSearch, FaSmile } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from '../api/apiClient';

interface ChatMessage {
  sender: string; // 'provider' or 'customer'
  text: string;
  timestamp: string; // ISO string
}

export default function ChatBox({
  providerId,
  customerId,
  currentUserRole,
  onClose,
  inline = false,
  partnerName,
}: {
  providerId: string;
  customerId: string;
  currentUserRole: 'provider' | 'customer';
  onClose: () => void;
  inline?: boolean;
  partnerName?: string;
}) {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isLoggedIn } = useAuth();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const partnerInitial = partnerName ? partnerName.charAt(0).toUpperCase() : currentUserRole === 'provider' ? 'C' : 'P';

  // Fetch initial messages
  useEffect(() => {
    if (!providerId || !customerId) return;

    const url = currentUserRole === 'provider'
      ? `${API_BASE}/api/messages/conversation/${customerId}`
      : `${API_BASE}/api/messages?providerId=${providerId}&customerId=${customerId}`;

    const headers: Record<string, string> = {};
    if (currentUserRole === 'provider' && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch(url, { headers })
      .then(res => res.json())
      .then(data => {
        const normalized = Array.isArray(data)
          ? data.map((item: any) => ({
              sender: item.sender,
              text: item.text ?? item.message,
              timestamp: item.timestamp,
            }))
          : [];
        setChatMessages(normalized);
      })
      .catch(console.error);
  }, [providerId, customerId, currentUserRole, token]);

  // Poll for new messages
  useEffect(() => {
    if (!providerId || !customerId) return;

    const getUrl = () => currentUserRole === 'provider'
      ? `${API_BASE}/api/messages/conversation/${customerId}`
      : `${API_BASE}/api/messages?providerId=${providerId}&customerId=${customerId}`;

    const getHeaders = () => {
      const headers: Record<string, string> = {};
      if (currentUserRole === 'provider' && token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return headers;
    };

    const interval = setInterval(() => {
      fetch(getUrl(), { headers: getHeaders() })
        .then(res => res.json())
        .then(data => {
          const normalized = Array.isArray(data)
            ? data.map((item: any) => ({
                sender: item.sender,
                text: item.text ?? item.message,
                timestamp: item.timestamp,
              }))
            : [];
          setChatMessages(msgs => {
            if (JSON.stringify(msgs) !== JSON.stringify(normalized)) {
              return normalized;
            }
            return msgs;
          });
        })
        .catch(console.error);
    }, 3000);

    return () => clearInterval(interval);
  }, [providerId, customerId, currentUserRole, token]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    // Check if user is logged in
    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          from: location.pathname + location.search,
          message: 'Please log in to send a message'
        }
      });
      return;
    }

    const newMsg = {
      providerId,
      customerId,
      sender: currentUserRole,
      text: chatInput,
    };

    // Optimistic update
    setChatMessages(msgs => [
      ...msgs,
      { sender: currentUserRole, text: chatInput, timestamp: new Date().toISOString() }
    ]);
    setChatInput('');

    try {
      if (currentUserRole === 'provider' && token) {
        await fetch(`${API_BASE}/api/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ customerId, message: chatInput }),
        });
      } else {
        await fetch(`${API_BASE}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMsg),
        });
      }
    } catch (e) {
      console.error("Send error", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  // Format date for message groups
  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: ChatMessage[] } = {};

    chatMessages.forEach(message => {
      const date = formatMessageDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  const containerWrapper = inline
    ? 'w-full'
    : 'fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-xs p-4';

  const containerInner = inline
    ? `w-full rounded-2xl flex flex-col overflow-hidden border ${darkMode ? 'border-gray-800 bg-[#0A0A0A] text-gray-100' : 'border-[#E5E5E5] bg-white text-[#151515]'}`
    : `w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl border ${darkMode ? 'border-gray-800 bg-[#0A0A0A] text-gray-100' : 'border-[#E5E5E5] bg-white text-[#151515]'}`;

  const containerStyle = inline
    ? { maxHeight: '70vh', minHeight: '28rem', width: '100%' }
    : { maxHeight: '90vh', width: '420px', height: '80vh' };

  return (
    <div className={containerWrapper}>
      <div className={containerInner} style={containerStyle}>
        {/* Header - HafiConnect Premium Dark */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-[#0A0A0A] text-white border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <button
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              onClick={onClose}
              title="Close chat"
            >
              ←
            </button>
            <div className="w-10 h-10 rounded-full bg-[#E5252A] flex items-center justify-center shadow-xs">
              <span className="text-white font-bold text-sm">
                {partnerInitial}
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight">
                {partnerName || (currentUserRole === 'provider' ? 'Customer' : 'Provider')}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-gray-400">
            <button type="button" className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <FaSearch size={14} />
            </button>
            <button type="button" className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <FaEllipsisV size={14} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className={`flex-1 overflow-y-auto px-4 py-4 ${
            darkMode ? 'bg-gray-950' : 'bg-[#F5F5F5]'
          }`}
        >
          {Object.entries(messageGroups).map(([date, messages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex justify-center my-3">
                <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-gray-900 text-[#666666] dark:text-gray-400 border border-[#E5E5E5] dark:border-gray-800 shadow-2xs">
                  {date}
                </div>
              </div>

              {/* Messages for this date */}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-3 ${msg.sender === currentUserRole ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === currentUserRole
                        ? 'bg-[#E5252A] text-white rounded-tr-xs shadow-xs text-left'
                        : darkMode
                        ? 'bg-gray-900 text-white rounded-tl-xs border border-gray-800 shadow-xs'
                        : 'bg-white text-[#151515] rounded-tl-xs border border-[#E5E5E5] shadow-xs'
                    }`}
                  >
                    <div className="leading-relaxed break-words">{msg.text}</div>
                    <div
                      className={`text-[10px] mt-1 text-right font-medium ${
                        msg.sender === currentUserRole
                          ? 'text-red-100'
                          : darkMode
                          ? 'text-gray-400'
                          : 'text-[#666666]'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className={`px-4 py-3 border-t ${
          darkMode ? 'bg-[#0A0A0A] border-gray-800' : 'bg-white border-[#E5E5E5]'
        }`}>
          <div className="flex items-center space-x-2">
            {/* Left Icons */}
            <div className="flex items-center space-x-2 text-gray-400">
              <button type="button" className="p-1.5 hover:text-[#E5252A] transition-colors">
                <FaSmile size={18} />
              </button>
              <button type="button" className="p-1.5 hover:text-[#E5252A] transition-colors">
                <FaPaperclip size={16} />
              </button>
            </div>

            {/* Input Field */}
            <div className={`flex-1 rounded-xl px-3.5 py-2 border transition-all ${
              darkMode
                ? 'bg-gray-900 border-gray-800 focus-within:border-[#E5252A]'
                : 'bg-[#F5F5F5] border-[#E5E5E5] focus-within:border-[#E5252A] focus-within:bg-white'
            }`}>
              <input
                type="text"
                className={`w-full text-sm border-0 outline-none bg-transparent ${
                  darkMode ? 'text-white placeholder-gray-500' : 'text-[#151515] placeholder-gray-400'
                }`}
                value={chatInput}
                placeholder="Type a message..."
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Right Action Button */}
            <button
              className={`p-3 rounded-full transition-all cursor-pointer ${
                chatInput.trim()
                  ? 'bg-[#E5252A] text-white hover:bg-[#c91d22] shadow-xs'
                  : darkMode
                  ? 'text-gray-500 hover:text-white'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              title={chatInput.trim() ? "Send message" : "Record audio"}
            >
              {chatInput.trim() ? (
                <FaPaperPlane size={14} />
              ) : (
                <FaMicrophone size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
