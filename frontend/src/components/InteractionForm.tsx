import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Save, Loader2, UserX, FileText, CheckSquare, Calendar, MessageCircle } from 'lucide-react';
import type { AppDispatch, RootState } from '../store/store';
import { saveInteraction, fetchHistory } from '../store/slices/interactionSlice';
import { addToast } from '../store/slices/uiSlice';

export const InteractionForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedHcp } = useSelector((state: RootState) => state.hcp);
  const { editingInteraction } = useSelector((state: RootState) => state.interaction);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    interaction_type: 'In-person',
    summary: '',
    topics_discussed: '',
    requested_action: '',
    follow_up_date: ''
  });

  useEffect(() => {
    if (editingInteraction) {
      setFormData({
        interaction_type: editingInteraction.interaction_type || 'In-person',
        summary: editingInteraction.summary || '',
        topics_discussed: editingInteraction.topics_discussed || '',
        requested_action: editingInteraction.requested_action || '',
        follow_up_date: editingInteraction.follow_up_date ? new Date(editingInteraction.follow_up_date).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        interaction_type: 'In-person',
        summary: '',
        topics_discussed: '',
        requested_action: '',
        follow_up_date: ''
      });
    }
  }, [editingInteraction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHcp && !editingInteraction) return;

    setIsSubmitting(true);
    const payload = {
      ...(editingInteraction ? { id: editingInteraction.id } : { hcp_id: selectedHcp!.id }),
      ...formData,
      follow_up_date: formData.follow_up_date ? new Date(formData.follow_up_date).toISOString() : null,
    };

    try {
      await dispatch(saveInteraction(payload)).unwrap();
      dispatch(addToast({ message: editingInteraction ? 'Interaction updated successfully!' : 'Interaction saved successfully!', type: 'success' }));
      
      if (!editingInteraction) {
        setFormData({
          interaction_type: 'In-person',
          summary: '',
          topics_discussed: '',
          requested_action: '',
          follow_up_date: ''
        });
      }
      if (selectedHcp) {
        dispatch(fetchHistory(selectedHcp.id));
      }
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Failed to save interaction.', type: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedHcp && !editingInteraction) {
    return (
      <div className="empty-state">
        <UserX size={32} />
        <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '1rem', color: 'var(--text-main)' }}>No HCP Selected</h3>
        <p style={{ maxWidth: '300px', lineHeight: 1.5 }}>Please search and select a Healthcare Professional from the left panel to log an interaction.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', paddingBottom: '5rem' }}>
        
        {/* Core Details Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} /> Core Details
          </h3>
          
          <div className="form-group">
            <label className="form-label">Interaction Type</label>
            <select 
              className="form-input"
              value={formData.interaction_type}
              onChange={(e) => setFormData({...formData, interaction_type: e.target.value})}
              disabled={isSubmitting}
            >
              <option value="In-person">In-person</option>
              <option value="Virtual">Virtual</option>
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Summary / Notes <span style={{ color: 'var(--error)' }}>*</span></label>
            <textarea 
              className="form-input"
              placeholder="Detailed notes from the interaction..."
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Discussion Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={16} /> Discussion Topics
          </h3>
          <div className="form-group">
            <label className="form-label">Key Topics (Optional)</label>
            <input 
              type="text"
              className="form-input"
              placeholder="E.g. New therapies, clinical trial data, side effects"
              value={formData.topics_discussed}
              onChange={(e) => setFormData({...formData, topics_discussed: e.target.value})}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Action Items Section */}
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={16} /> Action Items
          </h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Requested Action (Optional)</label>
              <input 
                type="text"
                className="form-input"
                placeholder="E.g. Send samples, email literature"
                value={formData.requested_action}
                onChange={(e) => setFormData({...formData, requested_action: e.target.value})}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} style={{ color: 'var(--primary)' }} /> Follow-up Date (Optional)
              </label>
              <input 
                type="date"
                className="form-input"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                disabled={isSubmitting}
                style={{ colorScheme: 'dark' }} // Native date picker dark mode
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: 0, left: 0, right: 0, 
        padding: '1rem 0', 
        background: 'linear-gradient(transparent, var(--surface-color) 30%)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end'
      }}>
        <button type="submit" className="btn btn-primary" style={{ minWidth: '180px', padding: '0.875rem 1.5rem', borderRadius: '2rem' }} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="spinner" /> Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              {editingInteraction ? 'Update Record' : 'Save Record'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
