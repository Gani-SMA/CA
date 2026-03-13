import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Globe, Utensils, Shield, TrendingUp, BarChart3 } from 'lucide-react';
import { CHAT_RESPONSES, LANGUAGES } from '../data/mockData';
import './ChatDrawer.css';

const QUICK_ACTIONS = [
  { id: 'dining', label: 'Reduce Dining', icon: Utensils, message: 'How can I reduce dining expenses?' },
  { id: 'emergency', label: 'Emergency Fund', icon: Shield, message: 'Check my emergency fund status' },
  { id: 'invest', label: 'Investment Tips', icon: TrendingUp, message: 'Give me investment suggestions' },
  { id: 'budget', label: 'Budget Review', icon: BarChart3, message: 'Review my monthly budget' },
];

export default function ChatDrawer({ isOpen, onClose, language }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLang, setCurrentLang] = useState(language || 'en');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const responses = CHAT_RESPONSES[currentLang] || CHAT_RESPONSES.en;
      setMessages([{ id: 1, role: 'ai', text: responses.greeting, time: new Date() }]);
    }
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { setCurrentLang(language); }, [language]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 1200));

    const responses = CHAT_RESPONSES[currentLang] || CHAT_RESPONSES.en;
    const lower = text.toLowerCase();
    let reply = responses.default;
    if (lower.includes('dining') || lower.includes('food') || lower.includes('restaurant')) reply = responses.reduceDining;
    else if (lower.includes('emergency') || lower.includes('fund') || lower.includes('safety')) reply = responses.emergencyFund;
    else if (lower.includes('invest') || lower.includes('stock') || lower.includes('mutual')) reply = responses.investmentTips;

    setIsTyping(false);
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: reply, time: new Date() }]);
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };
  const formatTime = (date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {isOpen && <div className="chat-overlay" onClick={onClose} />}
      <div className={`chat-drawer ${isOpen ? 'chat-drawer--open' : ''}`} role="dialog" aria-label="AI Financial Coach" aria-modal="true">
        {/* Header */}
        <div className="chat-drawer__header">
          <div className="chat-drawer__header-left">
            <div className="chat-drawer__avatar">
              <Bot size={20} strokeWidth={1.8} />
              <span className="chat-drawer__status" />
            </div>
            <div>
              <h3>AI Financial Coach</h3>
              <span className="chat-drawer__lang-label">
                {LANGUAGES.find(l => l.code === currentLang)?.native || 'English'}
              </span>
            </div>
          </div>
          <button className="chat-drawer__close" onClick={onClose} aria-label="Close chat">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Language Selector */}
        <div className="chat-drawer__lang-bar" role="tablist" aria-label="Select language">
          {LANGUAGES.slice(0, 5).map(lang => (
            <button
              key={lang.code}
              className={`chat-drawer__lang-btn ${lang.code === currentLang ? 'active' : ''}`}
              onClick={() => setCurrentLang(lang.code)}
              role="tab"
              aria-selected={lang.code === currentLang}
            >
              {lang.native}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="chat-drawer__messages" role="log" aria-live="polite">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
              {msg.role === 'ai' && (
                <span className="chat-msg__avatar">
                  <Bot size={14} strokeWidth={2} />
                </span>
              )}
              <div className="chat-msg__bubble">
                <p>{msg.text}</p>
                <span className="chat-msg__time">{formatTime(msg.time)}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-msg chat-msg--ai">
              <span className="chat-msg__avatar"><Bot size={14} strokeWidth={2} /></span>
              <div className="chat-msg__bubble chat-msg__thinking">
                <div className="thinking-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="chat-drawer__quick-actions">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button key={action.id} className="chat-drawer__quick-btn" onClick={() => sendMessage(action.message)}>
                <Icon size={13} strokeWidth={2} /> {action.label}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <form className="chat-drawer__input-area" onSubmit={handleSubmit}>
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            className="chat-drawer__input"
            placeholder="Ask about your finances..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="chat-drawer__send" disabled={!input.trim()} aria-label="Send message">
            <Send size={16} strokeWidth={2} />
          </button>
        </form>
      </div>
    </>
  );
}
