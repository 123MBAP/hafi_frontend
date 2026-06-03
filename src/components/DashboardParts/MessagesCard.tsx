import LoadingSpinner from '@/components/LoadingSpinner';
import { useDarkMode } from '@/context/DarkMode';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");


interface CustomerMessage {
  customer_id: string;
  name?: string;
  latest_time?: string;
  latest_message?: string;
  time?: string;
  latest_sender?: 'provider' | 'customer';
  unread_count?: number;
}

interface Message {
  id: number;
  sender: 'provider' | 'customer';
  message: string;
  timestamp: string;
  is_read?: boolean;
}


interface Props {
  providerId: string | null;
  onSelectCustomer: (customerId: string) => void;
}

export default function MessagesCard({ providerId }: Props) {
  const [customerMessages, setCustomerMessages] = useState<CustomerMessage[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMessage | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useDarkMode();
  const {token}=useAuth()

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await fetch(`${API_BASE}/api/messages/provider/customers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCustomerMessages(data);
      } catch (err) {
        console.error("Error fetching customer messages:", err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    if (providerId) fetchCustomers();
  }, [providerId]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/messages/provider/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCustomerMessages(data);
    } catch (err) {
      console.error("Error fetching customer messages:", err);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchMessages(selectedCustomer.customer_id);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (customerId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`${API_BASE}/api/messages/conversation/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);

      // Refresh customer list to update unread counts
      await fetchCustomers();
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCustomer) return;

    setSendingMessage(true);
    try {
      await fetch(`${API_BASE}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: selectedCustomer.customer_id,
          message: newMessage
        })
      });
      setNewMessage('');
      fetchMessages(selectedCustomer.customer_id);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectCustomer = (customer: CustomerMessage) => {
    setSelectedCustomer(customer);
  };

  function formatMessageTime(dateString: string): string {
    const messageDate = new Date(dateString);
    const now = new Date();

    const messageDay = messageDate.getDate();
    const messageMonth = messageDate.getMonth();
    const messageYear = messageDate.getFullYear();

    const nowDay = now.getDate();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();

    const isToday =
      messageDay === nowDay &&
      messageMonth === nowMonth &&
      messageYear === nowYear;

    const yesterday = new Date();
    yesterday.setDate(nowDay - 1);
    const isYesterday =
      messageDay === yesterday.getDate() &&
      messageMonth === yesterday.getMonth() &&
      messageYear === yesterday.getFullYear();

    let label = "";

    if (isToday) {
      label = "Today";
    } else if (isYesterday) {
      label = "Yesterday";
    } else {
      label = messageDate.toLocaleDateString(undefined, {
        weekday: "long",
      });
    }

    const timePart = messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${label}, ${timePart}`;
  }

  return (
    <>
      {/* Mobile View - Full Width Modern Design */}
      <div className={`lg:hidden flex flex-col w-full min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-4 py-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-700'
            }`}>
            Messages
          </h2>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loadingCustomers ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="md" message="Loading conversations..." />
            </div>
          ) : customerMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="text-6xl mb-4">💬</div>
              <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                <p className="font-medium mb-1">No messages yet</p>
                <p className="text-sm">Start a conversation with your customers</p>
              </div>
            </div>
          ) : (
            <div className="divide-y ${
              darkMode ? 'divide-gray-800' : 'divide-gray-200'
            }">
              {customerMessages.map((cust) => (
                <Link
                  to={`/chat/${cust.customer_id}`}
                  key={cust.customer_id}
                  className={`flex items-center gap-3 p-4 transition ${darkMode
                    ? 'hover:bg-gray-800 active:bg-gray-700'
                    : 'hover:bg-gray-100 active:bg-gray-200'
                    }`}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${darkMode ? 'bg-purple-600' : 'bg-purple-500'
                    }`}>
                    {cust.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Message Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className={`text-base font-semibold truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                        {cust.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          {cust.latest_time && new Date(cust.latest_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {cust.unread_count && cust.unread_count > 0 && (
                          <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                            }`}>
                            {cust.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      {cust.latest_message?.trim()
                        ? `${cust.latest_sender === 'provider' ? 'You: ' : ''}${cust.latest_message}`
                        : 'No messages yet'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop WhatsApp-like View */}
      <div className={`hidden lg:flex shadow rounded-lg h-[600px] w-full ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        {/* Sidebar - Chat List */}
        <div className={`w-1/3 border-r flex flex-col ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
            }`}>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-purple-400' : 'text-purple-700'
              }`}>
              Chats
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingCustomers ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner size="md" message="Loading conversations..." />
              </div>
            ) : customerMessages.length === 0 ? (
              <div className={`text-center mt-8 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                No messages yet.
              </div>
            ) : (
              <div>
                {customerMessages.map((cust) => (
                  <div
                    key={cust.customer_id}
                    onClick={() => handleSelectCustomer(cust)}
                    className={`p-4 cursor-pointer border-b transition ${darkMode
                      ? 'border-gray-700 hover:bg-gray-700'
                      : 'border-gray-100 hover:bg-gray-100'
                      } ${selectedCustomer?.customer_id === cust.customer_id
                        ? darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${darkMode ? 'bg-purple-600' : 'bg-purple-500'
                        }`}>
                        {cust.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <div className={`text-sm font-medium truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                            {cust.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                              {cust.latest_time && new Date(cust.latest_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {cust.unread_count && cust.unread_count > 0 && (
                              <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                                }`}>
                                {cust.unread_count}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          {cust.latest_message?.trim()
                            ? `${cust.latest_sender === 'provider' ? 'You: ' : ''}${cust.latest_message}`
                            : 'No messages yet'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedCustomer ? (
            <>
              {/* Chat Header */}
              <div className={`p-4 border-b flex items-center gap-3 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
                }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${darkMode ? 'bg-purple-600' : 'bg-purple-500'
                  }`}>
                  {selectedCustomer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                    {selectedCustomer.name}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className={`flex-1 overflow-y-auto p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner size="md" message="Loading messages..." />
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-3 flex ${msg.sender === 'provider' ? 'justify-end' : 'justify-start'
                          }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${msg.sender === 'provider'
                            ? darkMode
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-500 text-white'
                            : darkMode
                              ? 'bg-gray-800 text-gray-100'
                              : 'bg-white text-gray-900'
                            }`}
                        >
                          <div className="text-sm break-words">{msg.message}</div>
                          <div className={`text-xs mt-1 ${msg.sender === 'provider'
                            ? 'text-purple-200'
                            : darkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
                }`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && sendMessage()}
                    placeholder="Type a message"
                    disabled={sendingMessage}
                    className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 ${darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-400'
                      } ${sendingMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className={`px-6 py-2 rounded-full font-medium transition flex items-center gap-2 ${darkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                      } ${(sendingMessage || !newMessage.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {sendingMessage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-500'
              }`}>
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <div className="text-lg">Select a chat to start messaging</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}