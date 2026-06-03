import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useRef, useState } from 'react';
import { FaEllipsisV, FaMicrophone, FaPaperclip, FaPaperPlane, FaSearch, FaSmile } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

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
      });
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
    : 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';

  const containerInner = inline
    ? `w-full rounded-xl flex flex-col overflow-hidden ${darkMode ? 'border border-gray-700 bg-[#111b21] text-gray-100' : 'border border-gray-200 bg-white text-gray-800'}`
    : `w-full max-w-md rounded-xl flex flex-col ${darkMode ? 'bg-[#111b21] text-gray-100' : 'bg-white text-gray-800'}`;

  const containerStyle = inline
    ? { maxHeight: '70vh', minHeight: '28rem', width: '100%' }
    : { maxHeight: '90vh', width: '400px', height: '80vh' };

  return (
    <div className={containerWrapper}>
      <div className={containerInner} style={containerStyle}>
        {/* Header - WhatsApp Style */}
        <div className={`flex items-center justify-between px-4 py-3 ${darkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'
          }`}>
          <div className="flex items-center space-x-3">
            <button
              className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              onClick={onClose}
              title="Close chat"
            >
              ←
            </button>
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white font-semibold">
                {partnerInitial}
              </span>
            </div>
            <div>
              <div className={`font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                {partnerName || (currentUserRole === 'provider' ? 'Customer' : 'Provider')}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Online
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <FaSearch className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} cursor-pointer`} size={16} />
            <FaEllipsisV className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} cursor-pointer`} size={16} />
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-2"
          style={{
            backgroundImage: darkMode
              ? 'linear-gradient(rgba(17, 27, 33, 0.9), rgba(17, 27, 33, 0.9)), url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23343a40\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
              : 'linear-gradient(rgba(240, 242, 245, 0.9), rgba(240, 242, 245, 0.9)), url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%239ba4ab\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
            backgroundSize: '400px 400px'
          }}
        >
          {Object.entries(messageGroups).map(([date, messages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex justify-center my-4">
                <div className={`px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-[#182229] text-gray-300' : 'bg-[#e6f2ff] text-gray-600'
                  }`}>
                  {date}
                </div>
              </div>

              {/* Messages for this date */}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-2 ${msg.sender === currentUserRole ? "text-right" : "text-left"
                    }`}
                >
                  <div className={`inline-block max-w-xs px-3 py-2 rounded-lg ${msg.sender === currentUserRole
                    ? darkMode
                      ? 'bg-[#005c4b] text-white'
                      : 'bg-[#d9fdd3] text-gray-800'
                    : darkMode
                      ? 'bg-[#202c33] text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                    }`}>
                    <div>{msg.text}</div>
                    <div className={`text-xs mt-1 text-right ${darkMode
                      ? msg.sender === currentUserRole ? 'text-[#99b8b1]' : 'text-gray-400'
                      : msg.sender === currentUserRole ? 'text-[#0a7e6e]' : 'text-gray-500'
                      }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area - WhatsApp Style */}
        <div className={`px-4 py-3 ${darkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
          <div className="flex items-center space-x-2">
            {/* Left Icons */}
            <div className="flex items-center space-x-3">
              <FaSmile className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} cursor-pointer`} size={20} />
              <FaPaperclip className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} cursor-pointer`} size={18} />
            </div>

            {/* Input Field */}
            <div className={`flex-1 rounded-lg px-4 py-2 ${darkMode ? 'bg-[#2a3942]' : 'bg-white'
              }`}>
              <input
                type="text"
                className={`w-full border-0 outline-none ${darkMode ? 'bg-[#2a3942] text-white placeholder-gray-400' : 'bg-white text-black placeholder-gray-500'
                  }`}
                value={chatInput}
                placeholder="Type a message"
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Right Icon */}
            <button
              className={`p-3 rounded-full ${chatInput.trim()
                ? darkMode
                  ? 'bg-[#005c4b] text-white hover:bg-[#0a7e6e]'
                  : 'bg-[#008069] text-white hover:bg-[#00a884]'
                : darkMode
                  ? 'text-gray-400'
                  : 'text-gray-600'
                }`}
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              title="Send"
            >
              {chatInput.trim() ? (
                <FaPaperPlane size={16} />
              ) : (
                <FaMicrophone size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}