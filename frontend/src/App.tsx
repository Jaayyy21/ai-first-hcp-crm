import { useSelector, useDispatch } from 'react-redux';
import { Bot, FileText, CheckCircle, XCircle, Info, Activity } from 'lucide-react';
import type { RootState, AppDispatch } from './store/store';
import { setMode, removeToast } from './store/slices/uiSlice';
import { setEditingInteraction } from './store/slices/interactionSlice';
import { HcpSearch } from './components/HcpSearch';
import { InteractionForm } from './components/InteractionForm';
import { ChatInterface } from './components/ChatInterface';
import { InteractionHistory } from './components/InteractionHistory';

const ToastContainer = () => {
  const toasts = useSelector((state: RootState) => state.ui.toasts);
  const dispatch = useDispatch();

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        setTimeout(() => dispatch(removeToast(toast.id)), 4000);
        
        return (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} color="var(--success)" />}
            {toast.type === 'error' && <XCircle size={18} color="var(--error)" />}
            {toast.type === 'info' && <Info size={18} color="var(--info)" />}
            <span style={{ color: 'var(--text-main)' }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { mode } = useSelector((state: RootState) => state.ui);
  const { editingInteraction } = useSelector((state: RootState) => state.interaction);
  const { selectedHcp } = useSelector((state: RootState) => state.hcp);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="app-container">
      <ToastContainer />
      <header className="header">
        <div className="header-left">
          <div style={{ backgroundColor: 'var(--primary)', padding: '0.375rem', borderRadius: '0.5rem' }}>
            <Activity size={24} color="white" />
          </div>
          <h1>AI-First HCP CRM</h1>
        </div>
        <div className="header-right">
          <span>{currentDate}</span>
          <div className="ai-status-badge">
            <div className="pulse-dot"></div>
            AI Connected
          </div>
        </div>
      </header>

      <div className="grid-layout">
        {/* Left Column - HCP Selection & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <HcpSearch />
          <InteractionHistory />
        </div>

        {/* Right Column - Input Area */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%', minHeight: '650px' }}>
          <div className="tabs">
            <div 
              className={`tab ${mode === 'chat' ? 'active' : ''}`}
              onClick={() => {
                dispatch(setMode('chat'));
                dispatch(setEditingInteraction(null));
              }}
            >
              <Bot size={16} /> AI Chat Mode
            </div>
            <div 
              className={`tab ${mode === 'form' ? 'active' : ''}`}
              onClick={() => dispatch(setMode('form'))}
            >
              <FileText size={16} /> {editingInteraction ? 'Edit Interaction' : 'Structured Form'}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {mode === 'chat' ? <ChatInterface /> : <InteractionForm />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
