import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, X, Send, Trash2, Sparkles, ChevronRight, CornerDownLeft } from 'lucide-react';
import { useDarkMode } from '../context/DarkMode';
import { useHafibot } from '../context/HafibotContext';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface HafibotProps {
  onBeforeOpen?: () => void;
}

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://hafi-backend.onrender.com" : "http://localhost:5000")
).replace(/\/$/, "");
const TRANSIENT_STATUS_CODES = new Set([502, 503, 504]);
const MAX_CHAT_REQUEST_ATTEMPTS = 3;

const SUGGESTIONS = [
  { text: "Find house rentals", prompt: "I am looking for a house or apartment to rent. Can you recommend some real estate options?" },
  { text: "Made in Rwanda crafts", prompt: "Show me some Made in Rwanda products and where to find them." },
  { text: "Professional photography", prompt: "I need a professional photo studio or photographer. What services do you have?" },
  { text: "Best restaurants", prompt: "Recommend some restaurants or catering services in Kigali." }
];

export default function Hafibot({ onBeforeOpen }: HafibotProps) {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const { isOpen, openHafibot, closeHafibot, toggleHafibot } = useHafibot();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeHafibot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeHafibot]);

  // Initialize with greeting
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

  const handleOpenClick = () => {
    onBeforeOpen?.();
    openHafibot();
    setShowTooltip(false);
  };

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

      let res: Response | undefined;

      for (let attempt = 1; attempt <= MAX_CHAT_REQUEST_ATTEMPTS; attempt += 1) {
        res = await fetch(`${API_BASE}/api/hafibot/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ messages: history })
        });

        if (!TRANSIENT_STATUS_CODES.has(res.status) || attempt === MAX_CHAT_REQUEST_ATTEMPTS) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }

      if (!res || !res.ok) {
        let serverError = '';
        try {
          const errorData = await res?.json();
          serverError = typeof errorData?.error === 'string' ? errorData.error : '';
        } catch {
          // The server may return an empty or non-JSON error response.
        }
        throw new Error(serverError || `HTTP ${res?.status ?? 'unknown'}`);
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
      console.error('Hafibot request failed:', e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: e instanceof Error && e.message.includes('AI service')
          ? "The assistant service is temporarily unavailable. Please try again in a moment."
          : "Sorry, I am having trouble connecting to the assistant. Please try again in a moment.",
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

  const handleLinkClick = () => {
    // On small screens, close the bot drawer when navigating
    if (window.innerWidth < 768) {
      closeHafibot();
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
            className="my-2.5 overflow-hidden rounded-lg border border-gray-200/80 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 flex flex-col group max-w-full"
          >
            <img
              src={resolvedImgUrl}
              alt={textVal || 'Hafibot recommendation'}
              className="w-full h-44 object-cover bg-gray-50 dark:bg-gray-950 transition-transform duration-300 group-hover:scale-105"
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
                onClick={handleLinkClick}
                className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all duration-200 ${
                  darkMode
                    ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900 hover:text-emerald-200'
                    : 'bg-emerald-50 border border-emerald-200 text-[#008069] hover:bg-emerald-100 hover:text-emerald-800'
                }`}
              >
                <span>{textVal}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            );
          } else {
            parts.push(
              <Link
                key={matchIndex}
                to={urlVal}
                onClick={handleLinkClick}
                className="text-[#0a7e6e] dark:text-emerald-400 font-semibold underline decoration-emerald-500/50 hover:decoration-emerald-500 transition-colors inline-flex items-center gap-0.5"
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
              className="text-[#0a7e6e] dark:text-emerald-400 font-semibold underline decoration-emerald-500/50 hover:decoration-emerald-500 transition-colors inline-flex items-center gap-0.5"
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

  const userName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <>
      <style>{`
        @keyframes hafibot-shake {
          0%, 85%, 100% { transform: scale(1) rotate(0deg); }
          88%, 92%, 96% { transform: scale(1.08) rotate(-4deg); }
          90%, 94%, 98% { transform: scale(1.08) rotate(4deg); }
        }
        .animate-hafibot-shake {
          animation: hafibot-shake 4.5s infinite ease-in-out;
        }
        .hafibot-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .hafibot-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .hafibot-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.4);
          border-radius: 9999px;
        }
        .hafibot-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.6);
        }
      `}</style>

      {/* Floating Interactive Circle Launcher (Only visible when side panel is closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 font-sans flex flex-col items-end">
          {/* Welcome Tooltip */}
          {showTooltip && (
            <div
              className="mb-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-4 py-2.5 shadow-2xl border border-gray-150 dark:border-gray-800 text-xs font-medium max-w-xs animate-bounce flex items-center gap-2 rounded-xl"
            >
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Need help searching services, products, or rentals? Ask Hafibot!</span>
              <button
                onClick={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenClick}
              className="bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 text-[#0a7e6e] dark:text-emerald-400 px-4 py-2.5 shadow-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 rounded-full flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Search with Hafibot AI</span>
            </button>

            <button
              onClick={handleOpenClick}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0a7e6e] to-teal-400 text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105 active:scale-95 group relative overflow-hidden animate-hafibot-shake"
              title="Open Hafibot AI Assistant"
            >
              {/* Pulse Ring */}
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" style={{ animationDuration: '3s' }}></span>
              <MessageSquare className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 relative z-10" />
            </button>
          </div>
        </div>
      )}

      {/* Side Panel (Gemini style: takes 1/2 of width on desktop, slides in from right, with independent scroll) */}
      {isOpen && (
        <aside
          aria-label="Hafibot AI Search Assistant"
          className="w-full md:w-1/2 h-screen flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl shrink-0 z-40 transition-all duration-300 ease-in-out fixed inset-0 md:relative md:inset-auto overflow-hidden font-sans"
        >
          {/* Header Bar */}
          <div className="bg-[#0a7e6e] dark:bg-gray-900/95 px-5 py-3.5 flex items-center justify-between text-white border-b border-emerald-600/30 dark:border-gray-800 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/20 dark:bg-emerald-500/20 flex items-center justify-center font-bold text-xs tracking-tight text-white border border-white/20">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0a7e6e] dark:border-gray-900 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight text-white">Hafibot AI</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 font-medium">
                    Assistant
                  </span>
                </div>
                <span className="text-[11px] text-emerald-100/80 block">
                  Online • Searches Services, Market & Properties
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={clearHistory}
                title="Clear Chat History"
                className="p-2 hover:bg-white/10 dark:hover:bg-gray-800 rounded-lg text-white/90 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={closeHafibot}
                title="Collapse Assistant (Esc)"
                className="p-2 hover:bg-white/10 dark:hover:bg-gray-800 rounded-lg text-white/90 hover:text-white transition-colors flex items-center gap-1 group"
              >
                <span className="text-xs text-white/70 hidden sm:inline mr-1 group-hover:text-white">Esc</span>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container (Independent Vertical Scroll) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/60 dark:bg-gray-950 hafibot-scrollbar">
            {/* Gemini-inspired Hero Welcome (when few messages) */}
            {messages.length <= 1 && (
              <div className="py-6 px-2 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-pulse">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {userName ? `Hi ${userName}, what's the plan?` : "Hi! What can I help you find today?"}
                </h2>
                <p className="mt-2 text-xs md:text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                  Search across verified Rwandan services, local Made in Rwanda products, global marketplace listings, and real estate rentals.
                </p>

                {/* Suggestions Pills */}
                <div className="mt-6 w-full max-w-md">
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2 text-left">
                    Suggestions
                  </span>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(item.prompt)}
                        className="w-full text-left text-xs md:text-sm bg-white dark:bg-gray-900 hover:bg-emerald-50/70 dark:hover:bg-gray-850 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 transition-all duration-200 hover:border-emerald-500/50 hover:shadow-sm flex items-center justify-between group"
                      >
                        <span className="font-medium">{item.text}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] md:max-w-[80%] px-4 py-3 shadow-sm text-sm rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-tr from-[#0a7e6e] to-[#008069] text-white rounded-br-none'
                      : 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 border border-gray-200/80 dark:border-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {parseMessageContent(msg.content)}
                  </div>
                  <span
                    className={`block text-[10px] mt-2 text-right ${
                      msg.role === 'user' ? 'text-emerald-200' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 shadow-sm rounded-2xl rounded-bl-none flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions Chips (when conversation is active) */}
          {messages.length > 1 && !isTyping && (
            <div className="px-4 py-2 bg-gray-50/80 dark:bg-gray-950/80 border-t border-gray-200/60 dark:border-gray-800/80 shrink-0">
              <div className="flex gap-2 overflow-x-auto hafibot-scrollbar pb-1">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="shrink-0 text-xs bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 transition-colors shadow-2xs font-medium"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Panel (Docked at bottom of right column) */}
          <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask Hafibot anything (e.g. rental house, photography, sneakers)..."
                className="flex-1 bg-transparent text-sm py-2 px-1 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isTyping}
              />
              <button
                onClick={() => handleSend()}
                disabled={isTyping || !input.trim()}
                className="bg-[#0a7e6e] hover:bg-emerald-700 text-white p-2.5 rounded-xl disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 transition-all duration-200 shadow-sm active:scale-95 shrink-0"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-center">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                Hafibot AI Search Assistant • Powered by HafiConnect Rwanda
              </span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
