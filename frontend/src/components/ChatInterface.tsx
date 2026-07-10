import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Bot, Loader2, Database, CheckCircle2, ShieldCheck, User } from 'lucide-react';
import type { RootState, AppDispatch } from '../store/store';
import { fetchHistory } from '../store/slices/interactionSlice';
import { addToast } from '../store/slices/uiSlice';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  structuredData?: any;
}

export const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I'm your AI CRM Assistant. You can log an interaction by telling me about it naturally (e.g. 'Met Dr. Sharma today to discuss the new trial. Schedule follow-up for next week.')"
    }
  ]);
  const [loading, setLoading] = useState(false);
  
  const { selectedHcp } = useSelector((state: RootState) => state.hcp);
  const dispatch = useDispatch<AppDispatch>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.text,
          hcp_id: selectedHcp?.id 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to communicate with AI Agent.');
      }
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: data.response,
        structuredData: data.structured_data && Object.keys(data.structured_data).length > 0 ? data.structured_data : undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (selectedHcp && aiMessage.structuredData) {
        dispatch(fetchHistory(selectedHcp.id));
      }

    } catch (error: any) {
      dispatch(addToast({ message: error.message || 'Error communicating with AI Agent.', type: 'error' }));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an error while processing your request. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatKey = (key: string) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-container" style={{ flex: 1, padding: '1.5rem 1.5rem 2rem 1.5rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message-wrapper" style={{ alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.sender === 'ai' && (
              <div className="chat-ai-header">
                <Bot size={14} /> AI Assistant
              </div>
            )}
            {msg.sender === 'user' && (
              <div className="chat-ai-header" style={{ alignSelf: 'flex-end' }}>
                <User size={14} /> You
              </div>
            )}
            <div className={`chat-message ${msg.sender === 'user' ? 'chat-user' : 'chat-ai'}`}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            </div>
            
            {msg.structuredData && (
              <div className="extracted-data">
                <div className="extracted-data-header">
                  <div className="extracted-data-title">
                    <Database size={16} color="var(--success)" /> 
                    Data Extracted & Saved
                  </div>
                  <div className="badge badge-green" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <ShieldCheck size={12} /> High Confidence
                  </div>
                </div>
                
                <div className="grid-2">
                  {Object.entries(msg.structuredData).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={12} color="var(--success)" />
                        {formatKey(key)}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', paddingLeft: '1.125rem' }}>
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="chat-message-wrapper" style={{ alignItems: 'flex-start' }}>
            <div className="chat-ai-header">
              <Bot size={14} /> AI Assistant
            </div>
            <div className="chat-message chat-ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
              <div className="pulse-dot"></div>
              Analyzing context...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Type your interaction details here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{ padding: '0.875rem 1rem', fontSize: '0.9375rem', borderRadius: '2rem' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()} style={{ borderRadius: '2rem', padding: '0 1.5rem' }}>
            {loading ? <Loader2 size={20} className="spinner" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};
