import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Edit2, Clock, MessageSquare, AlertCircle, Calendar } from 'lucide-react';
import type { RootState } from '../store/store';
import { setEditingInteraction } from '../store/slices/interactionSlice';
import { setMode } from '../store/slices/uiSlice';

export const InteractionHistory: React.FC = () => {
  const dispatch = useDispatch();
  const { history, loading, error } = useSelector((state: RootState) => state.interaction);
  const { selectedHcp } = useSelector((state: RootState) => state.hcp);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && history.length > 0) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [history]);

  if (!selectedHcp) {
    return null; // Let the HCP Search take full space if no HCP is selected
  }

  const handleEdit = (interaction: any) => {
    dispatch(setEditingInteraction(interaction));
    dispatch(setMode('form'));
  };

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'in-person': return 'badge-indigo';
      case 'virtual': return 'badge-blue';
      case 'email': return 'badge-purple';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h2 className="card-title">
        <Clock size={16} />
        Activity Feed
      </h2>
      
      {loading ? (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3].map(i => (
             <div key={i} style={{ height: '100px', width: '100%' }} className="skeleton"></div>
          ))}
        </div>
      ) : error ? (
        <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={24} />
          <h3>No Interactions Yet</h3>
          <p>Log a new interaction using the form or AI chat mode.</p>
        </div>
      ) : (
        <div className="history-list" ref={listRef}>
          {history.map((interaction) => (
            <div key={interaction.id} className="history-card">
              <div className="history-header">
                <div>
                  <span className="history-date">
                    {new Date(interaction.interaction_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`badge ${getBadgeColor(interaction.interaction_type)}`}>
                    {interaction.interaction_type}
                  </span>
                </div>
                <button 
                  onClick={() => handleEdit(interaction)}
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem', border: 'none' }}
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>
              
              <div style={{ marginTop: '0.75rem', color: 'var(--text-main)' }}>
                <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.875rem' }}>{interaction.summary}</p>
              </div>
              
              {interaction.topics_discussed && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Topics:</span> {interaction.topics_discussed}
                </div>
              )}
              
              {interaction.follow_up_date && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', width: 'fit-content' }}>
                  <Calendar size={14} />
                  <span style={{ fontWeight: 600 }}>Follow-up:</span> 
                  {new Date(interaction.follow_up_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
