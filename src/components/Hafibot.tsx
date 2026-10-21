import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, X, Send, Trash2 } from 'lucide-react';
import { useDarkMode } from '../context/DarkMode';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const SUGGESTIONS = [
  { text: "Find house rentals", prompt: "I am looking for a house or apartment to rent. Can you recommend some real estate options?" },
  { text: "Made in Rwanda crafts", prompt: "Show me some Made in Rwanda products and where to find them." },
  { text: "Professional photography", prompt: "I need a professional photo studio or photographer. What services do you have?" },
  { text: "Best restaurants", prompt: "Recommend some restaurants or catering services in Kigali." }
];

export default function Hafibot() {
  const { darkMode } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize with greeting (without emojis)
  useEffect(() => {
    const savedMessages = localStorage.getItem('hafibot_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(parsed);
        setShowTooltip(false);
        return;
      } catch (e) {
        console.error('Error parsing stored messages:', e);
      }
    }

    // Default intro
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I am Hafibot, your HafiConnect search assistant.\n\nTell me what you are looking for (e.g. \"I need a rental house\", \"I want to buy clothes\", or \"I need a photographer\") and I will find the best services, products, or real estate listings for you.",
        timestamp: new Date()
      }
    ]);

    // Tooltip timer
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('hafibot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    if (!textToSend) {
      setInput('');
    }

    const newUserMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
      const history = messages
        .concat(newUserMessage)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await fetch(`${API_BASE}/api/hafibot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: history })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message.content,
          timestamp: new Date()
        }]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I am having trouble connecting to the assistant. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      localStorage.removeItem('hafibot_messages');
      setMessages([
        {
          role: 'assistant',
          content: "Chat history cleared. How can I help you find services, products, or properties today?",
          timestamp: new Date()
        }
      ]);
    }
  };

  // Parsing utility to format markdown links, images and bold text into React nodes
  const parseMessageContent = (text: string) => {
    const regex = /(!)?\[([^\]]*)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      const isImage = !!match[1];
      const textVal = match[2];
      const urlVal = match[3].trim();

      if (isImage) {
        let resolvedImgUrl = urlVal;
        if (!urlVal.startsWith('http') && !urlVal.startsWith('data:') && !urlVal.startsWith('blob:')) {
          resolvedImgUrl = `${API_BASE}/${urlVal.replace(/^\/+/, '')}`;
        }
        parts.push(
          <div
            key={matchIndex}
            className="my-2.5 overflow-hidden border border-gray-200/60 dark:border-gray-800/80 shadow-sm bg-white dark:bg-gray-950 flex flex-col group max-w-full"
            style={{ borderRadius: '2px' }}
          >
            <img
              src={resolvedImgUrl}
              alt={textVal || 'Hafibot recommendation'}
              className="w-full h-40 object-contain bg-gray-50/80 dark:bg-gray-900/50"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        );
      } else {
        if (urlVal.startsWith('/')) {
          const isButton = textVal.toLowerCase().includes('view details') ||
            textVal.toLowerCase().includes('view more') ||
            textVal.toLowerCase().includes('book now') ||
            textVal.toLowerCase().includes('order now');
          if (isButton) {
            parts.push(
              <Link
                key={matchIndex}
                to={urlVal}
                onClick={() => setIsOpen(false)}
                className={`mt-2 inline-flex text-sm font-medium transition-colors ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
              >
                {textVal} &rarr;
              </Link>
            );
          } else {
            parts.push(
              <Link
                key={matchIndex}
                to={urlVal}
                onClick={() => setIsOpen(false)}
                className="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-0.5"
              >
                {textVal}
              </Link>
            );
          }
        } else {
          parts.push(
            <a
              key={matchIndex}
              href={urlVal}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-0.5"
            >
              {textVal}
            </a>
          );
        }
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.map((part, idx) => {
      if (typeof part === 'string') {
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const subParts: React.ReactNode[] = [];
        let subLastIndex = 0;
        let subMatch;

        while ((subMatch = boldRegex.exec(part)) !== null) {
          const subMatchIndex = subMatch.index;
          if (subMatchIndex > subLastIndex) {
            subParts.push(part.substring(subLastIndex, subMatchIndex));
          }
          subParts.push(<strong key={subMatchIndex} className="font-bold text-gray-900 dark:text-white">{subMatch[1]}</strong>);
          subLastIndex = boldRegex.lastIndex;
        }
        if (subLastIndex < part.length) {
          subParts.push(part.substring(subLastIndex));
        }

        return (
          <React.Fragment key={idx}>
            {subParts.map((sub, sIdx) =>
              typeof sub === 'string'
                ? sub.split('\n').map((line, lIdx, arr) => (
                  <React.Fragment key={lIdx}>
                    {line}
                    {lIdx < arr.length - 1 && <br />}
                  </React.Fragment>
                ))
                : sub
            )}
          </React.Fragment>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end">
      <style>{`
        @keyframes hafibot-shake {
          0%, 85%, 100% { transform: scale(1) rotate(0deg); }
          88%, 92%, 96% { transform: scale(1.08) rotate(-4deg); }
          90%, 94%, 98% { transform: scale(1.08) rotate(4deg); }
        }
        .animate-hafibot-shake {
          animation: hafibot-shake 4.5s infinite ease-in-out;
        }
      `}</style>

      {/* Welcome Tooltip */}
      {showTooltip && !isOpen && (
        <div
          className="mb-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-4 py-2.5 shadow-xl border border-gray-100 dark:border-gray-800 text-xs font-medium max-w-xs animate-bounce flex items-center gap-2"
          style={{ borderRadius: '2px' }}
        >
          <span>Need help searching services, products, or rentals? Ask Hafibot!</span>
          <button onClick={() => setShowTooltip(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Chat Panel */}
      {isOpen && (
        <div
          className="mb-4 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[80vh] flex flex-col overflow-hidden shadow-2xl backdrop-blur-md bg-white/95 border border-gray-250/50 dark:bg-gray-950/95 dark:border-gray-800/40 transition-all duration-300"
          style={{ borderRadius: '2px' }}
        >

          {/* Header */}
          <div className="bg-[#0a7e6e] px-4 py-3 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-10 h-10 bg-white/20 flex items-center justify-center font-bold text-sm tracking-tight text-white"
                  style={{ borderRadius: '2px' }}
                >
                  HAFI
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-emerald-600 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-tight leading-tight">Hafibot AI</h3>
                <span className="text-[10px] opacity-90 block">
                  Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={clearHistory}
                title="Clear Chat History"
                className="p-1.5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                style={{ borderRadius: '2px' }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                style={{ borderRadius: '2px' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 shadow-sm text-sm ${msg.role === 'user'
                      ? 'bg-[#008069] text-white'
                      : 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800'
                    }`}
                  style={{ borderRadius: '2px' }}
                >
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {parseMessageContent(msg.content)}
                  </div>
                  <span className={`block text-[9px] mt-1.5 text-right ${msg.role === 'user' ? 'text-emerald-200' : 'text-gray-400'
                    }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-3 shadow-sm flex items-center gap-1.5"
                  style={{ borderRadius: '2px' }}
                >
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggestions List (No Emojis) */}
          {messages.length <= 2 && !isTyping && (
            <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800/80">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Suggestions</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="text-xs bg-white hover:bg-gray-100 text-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-300 px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    style={{ borderRadius: '2px' }}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Panel */}
          <div
            className="p-3 border-t border-gray-200/50 bg-white dark:bg-gray-950 dark:border-gray-800/60 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Hafibot anything..."
              className="flex-1 bg-gray-55 border border-gray-200 focus:border-emerald-500 text-sm px-4 py-2.5 outline-none transition-colors dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:focus:border-emerald-500"
              style={{ borderRadius: '2px' }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping || !input.trim()}
              className="bg-[#0a7e6e] hover:bg-emerald-700 text-white p-2.5 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 transition-all duration-200 shadow-sm active:scale-95"
              style={{ borderRadius: '2px' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Interactive Circle Button with Text Label */}
      <div className="flex items-center gap-3">
        {!isOpen && (
          <button
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            className="bg-white/95 dark:bg-gray-900/95 border border-gray-250 dark:border-gray-800 text-[#0a7e6e] dark:text-emerald-400 px-4 py-2.5 shadow-lg font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-105 hover:bg-gray-50 active:scale-98"
            style={{ borderRadius: '2px' }}
          >
            Search with Hafibot AI
          </button>
        )}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
          }}
          className={`w-16 h-16 rounded-full bg-gradient-to-tr from-[#0a7e6e] to-teal-400 text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 active:scale-95 group relative overflow-hidden ${!isOpen ? 'animate-hafibot-shake' : ''}`}
          title="Hafibot AI Search Assistant"
        >
          {/* Popping Pulse Ring */}
          <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" style={{ animationDuration: '3s' }}></span>

          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-300 rotate-90 relative z-10" />
          ) : (
            <MessageSquare className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 relative z-10" />
          )}
        </button>
      </div>

    </div>
  );
}
