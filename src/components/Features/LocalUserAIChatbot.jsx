import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, X, Send, Sparkles, MessageSquare, Maximize2, Minimize2, 
  Trash2, Copy, Check, Mic, MicOff, ArrowUpRight, Trophy, 
  ShieldCheck, CreditCard, Users, HelpCircle, ChevronRight, Zap
} from 'lucide-react';
import { sendAIChatMessageAPI, getAISuggestionsAPI } from '../../services/api';

export default function LocalUserAIChatbot({ 
  user, 
  isOpen: controlledIsOpen, 
  onClose: controlledOnClose,
  onNavigateAction
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // Sync with controlled state from parent (e.g. sidebar navigation)
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Initial welcome message
  const initialMessages = [
    {
      sender: 'ai',
      text: `Hello **${user?.name || user?.full_name || 'Athlete'}**! 👋 I'm **ArenaX AI**, your personal sports assistant and platform doubts expert.\n\nI can help you clear doubts on:\n• 🏆 **Open Tournaments & Schedules**\n• 🆔 **Athlete ID Proof & Verification**\n• 👥 **Team Rosters & Captain Duties**\n• 💳 **Razorpay Entry Fees & Invoices**\n• ⚽ **Official Match & Sports Rules**\n\nAsk me any question below or pick a quick doubt to get started!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'What tournaments are currently open?',
        'How do I verify my athlete ID proof?',
        'How do captains invite players by Player ID?',
        'How do entry fee payments work?'
      ],
      actions: [
        { label: 'Browse Tournaments', action: 'dashboard' },
        { label: 'Register as Player', action: 'register_as_player' },
        { label: 'My Teams', action: 'my_teams' }
      ]
    }
  ];

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`arenax_chat_${user?.id || 'guest'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialMessages;
      }
    }
    return initialMessages;
  });

  // Save conversation in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`arenax_chat_${user?.id || 'guest'}`, JSON.stringify(messages));
    } catch (e) {
      // Storage full or unavailable
    }
  }, [messages, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Fetch quick suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      const res = await getAISuggestionsAPI();
      if (res && res.success && Array.isArray(res.suggestions)) {
        setSuggestions(res.suggestions);
      }
    };
    loadSuggestions();
  }, []);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  const handleToggleVoiceInput = () => {
    if (!speechRecognitionRef.current) {
      alert('Voice speech recognition is not supported in this browser. Please type your doubt.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage || '').trim();
    if (!text || isTyping) return;

    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Call backend AI engine
    try {
      const res = await sendAIChatMessageAPI({
        message: text,
        history: messages.slice(-6).map(m => ({ role: m.sender, content: m.text }))
      });

      const aiReply = {
        sender: 'ai',
        text: res.reply || "I'm having a brief connection issue. Please feel free to ask again!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: res.suggestions || [],
        actions: res.actions || []
      };

      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I encountered a minor network error. Please try asking again!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all conversation history with ArenaX AI?')) {
      setMessages(initialMessages);
      localStorage.removeItem(`arenax_chat_${user?.id || 'guest'}`);
    }
  };

  const handleCopyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleActionClick = (actionId) => {
    if (onNavigateAction) {
      onNavigateAction(actionId);
    }
    // In compact view, minimize to let user see the targeted view
    if (!isExpanded) {
      setIsOpen(false);
      if (controlledOnClose) controlledOnClose();
    }
  };

  // Helper to render markdown-like text with bold and bullet lists
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-xs font-black text-slate-900 mt-2 mb-1 uppercase tracking-wider">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-sm font-black text-slate-900 mt-2 mb-1">{line.replace('## ', '')}</h3>;
      }

      // Bold formatting parser
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-extrabold text-[#8B0000]">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Bullets
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={i} className="flex items-start space-x-1.5 my-0.5 pl-1 text-[11px] leading-relaxed">
            <span className="text-[#8B0000] font-black">•</span>
            <span>{formattedLine}</span>
          </div>
        );
      }

      // Numbered items
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={i} className="my-1 pl-1 text-[11px] leading-relaxed font-medium">
            {formattedLine}
          </div>
        );
      }

      // Standard paragraph line
      return line.trim() === '' ? (
        <div key={i} className="h-1.5" />
      ) : (
        <p key={i} className="my-0.5 text-[11px] leading-relaxed">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (When chat is closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 group">
          {/* Pulsing Hint Badge */}
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden md:flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#8B0000]/20 shadow-xl cursor-pointer hover:border-[#8B0000] transition-all transform hover:-translate-x-1"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-left">
              <div className="text-[11px] font-black text-slate-900 flex items-center space-x-1">
                <span>Got Doubts?</span>
                <span className="text-[#8B0000]">Ask ArenaX AI</span>
              </div>
              <p className="text-[9px] text-slate-500 font-medium">Rules, Player IDs & Tournaments</p>
            </div>
          </div>

          {/* Main Floating Orb Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#8B0000] via-[#A00000] to-[#600000] text-white flex items-center justify-center shadow-2xl shadow-[#8B0000]/40 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/40 cursor-pointer"
            title="Open ArenaX AI Doubt Assistant"
          >
            <div className="absolute inset-0 rounded-2xl bg-[#8B0000] animate-ping opacity-20 pointer-events-none" />
            <Bot className="w-7 h-7 text-white drop-shadow-md" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border border-white" />
            </span>
          </button>
        </div>
      )}

      {/* CHAT DRAWER / WINDOW */}
      {isOpen && (
        <div 
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 rounded-3xl max-w-4xl mx-auto'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] rounded-3xl'
          }`}
        >
          {/* HEADER */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-[#8B0000] to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center space-x-3 relative z-10">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-black tracking-tight">ArenaX AI Assistant</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-[9px] font-black text-amber-300 uppercase">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-white/70 font-medium">Instant Doubts & Sports Rules Expert</p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center space-x-1 relative z-10">
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
                title={isExpanded ? 'Compact View' : 'Maximize Window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  if (controlledOnClose) controlledOnClose();
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white transition-all cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* QUICK PROMPT CHIPS CAROUSEL */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 pl-1 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-[#8B0000]" />
              <span>Topics:</span>
            </span>

            {[
              { label: '🏆 Open Tournaments', query: 'What tournaments are currently open for registration?' },
              { label: '🆔 Player ID Status', query: 'How does athlete ID proof and verification work?' },
              { label: '👥 Team Rosters', query: 'How do I register a team and invite players?' },
              { label: '💳 Razorpay Fees', query: 'What are the tournament entry fee payment options?' },
              { label: '⚽ Football Rules', query: 'What are official tournament rules for football?' },
              { label: '📊 Career Stats', query: 'How do I view my athlete performance and career stats?' }
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.query)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-[#8B0000] hover:text-white text-slate-700 text-[10px] font-bold border border-slate-200 hover:border-[#8B0000] transition-all whitespace-nowrap shadow-2xs shrink-0 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* MESSAGES SCROLL CONTAINER */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50/50 to-white text-xs">
            {messages.map((msg, index) => {
              const isAi = msg.sender === 'ai';

              return (
                <div 
                  key={index}
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} space-y-1.5 animate-in fade-in duration-200`}
                >
                  <div className="flex items-center space-x-1.5 px-1 text-[10px] text-slate-400">
                    <span className="font-bold">{isAi ? 'ArenaX AI' : (user?.name || 'You')}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div 
                    className={`relative p-3.5 rounded-2xl max-w-[90%] sm:max-w-[85%] shadow-sm ${
                      isAi 
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm' 
                        : 'bg-gradient-to-r from-[#8B0000] to-[#700000] text-white rounded-tr-sm shadow-[#8B0000]/10'
                    }`}
                  >
                    {isAi ? renderFormattedText(msg.text) : <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                    {/* Action Buttons Embedded in AI Message */}
                    {isAi && msg.actions && msg.actions.length > 0 && (
                      <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleActionClick(act.action)}
                            className="px-2.5 py-1 rounded-lg bg-[#8B0000]/10 hover:bg-[#8B0000] text-[#8B0000] hover:text-white font-black text-[10px] transition-all flex items-center space-x-1 border border-[#8B0000]/20 cursor-pointer shadow-2xs"
                          >
                            <span>{act.label}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyMessage(msg.text, index)}
                      className={`absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                        isAi ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/60 hover:text-white'
                      }`}
                      title="Copy Answer"
                    >
                      {copiedIndex === index ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Dynamic Suggestions Following AI Message */}
                  {isAi && msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && (
                    <div className="pt-1 flex flex-wrap gap-1 max-w-[95%]">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-50 hover:border-amber-300 text-slate-600 hover:text-slate-900 text-[10px] font-medium border border-slate-200 transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <ChevronRight className="w-2.5 h-2.5 text-[#8B0000]" />
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Loader Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 w-fit animate-in fade-in">
                <div className="w-2 h-2 rounded-full bg-[#8B0000] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#8B0000] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#8B0000] animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] font-semibold text-slate-600 pl-1">ArenaX AI is analyzing your doubt...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            {isListening && (
              <div className="mb-2 p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span>Listening to your voice... Speak your doubt clearly!</span>
                </div>
                <button onClick={handleToggleVoiceInput} className="text-slate-400 hover:text-slate-700">Cancel</button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask any doubt regarding tournaments, ID proofs, rules, fees..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#8B0000] focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                  disabled={isTyping}
                />

                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'text-slate-400 hover:text-[#8B0000] hover:bg-slate-100'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Voice Input (Ask with speech)'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#680000] hover:from-[#750000] hover:to-[#550000] disabled:opacity-50 text-white text-xs font-black shadow-md shadow-[#8B0000]/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="mt-1.5 text-center">
              <span className="text-[9px] text-slate-400">
                ArenaX AI answers local athlete doubts, verification queries & rules.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
