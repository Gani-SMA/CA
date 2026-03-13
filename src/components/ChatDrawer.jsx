import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Utensils, Shield, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import { LANGUAGES, API_BASE } from '../data/constants';
import './ChatDrawer.css';

const QUICK_ACTIONS = [
  { id: 'dining', label: 'Reduce Dining', icon: Utensils, message: 'How can I reduce my dining expenses based on my spending?' },
  { id: 'emergency', label: 'Emergency Fund', icon: Shield, message: 'What is the status of my emergency fund and how should I build it?' },
  { id: 'invest', label: 'Investment Tips', icon: TrendingUp, message: 'Give me investment tips based on my income and savings rate.' },
  { id: 'budget', label: 'Budget Review', icon: BarChart3, message: 'Review my monthly budget and spending and suggest improvements.' },
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
      setMessages([{ id: 1, role: 'ai', text: "Hi! I'm your AI Financial Coach powered by Gemini. I can see your real income, expenses, and savings data. Ask me anything about your finances!", time: new Date() }]);
    }
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setCurrentLang(language); }, [language]);

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return;
    const userMsg = { id: Date.now(), role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language: currentLang }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: data.reply || 'Sorry, I could not process that.', time: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'Connection error. Please make sure the server is running.', time: new Date() }]);
    } finally {
      setIsTyping(false);
    }
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
                Powered by Gemini · {LANGUAGES.find(l => l.code === currentLang)?.native || 'English'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button className="chat-drawer__refresh" onClick={() => setMessages([])} title="Clear conversation">
              <RefreshCw size={14} />
            </button>
            <button className="chat-drawer__close" onClick={onClose} aria-label="Close chat">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Language Selector */}
        <div className="chat-drawer__lang-bar" role="tablist" aria-label="Select language">
          {LANGUAGES.slice(0, 5).map(lang => (
            <button key={lang.code} className={`chat-drawer__lang-btn ${lang.code === currentLang ? 'active' : ''}`}
              onClick={() => setCurrentLang(lang.code)} role="tab" aria-selected={lang.code === currentLang}>
              {lang.native}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="chat-drawer__messages" role="log" aria-live="polite">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
              {msg.role === 'ai' && <span className="chat-msg__avatar"><Bot size={14} strokeWidth={2} /></span>}
              <div className="chat-msg__bubble">
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
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
          <input id="chat-input" ref={inputRef} type="text" className="chat-drawer__input"
            placeholder="Ask about your finances..." value={input}
            onChange={(e) => setInput(e.target.value)} disabled={isTyping} />
          <button type="submit" className="chat-drawer__send" disabled={!input.trim() || isTyping} aria-label="Send message">
            <Send size={16} strokeWidth={2} />
          </button>
        </form>
      </div>
    </>
  );
}
