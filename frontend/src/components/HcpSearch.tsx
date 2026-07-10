import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Users, Loader2, CheckCircle2 } from 'lucide-react';
import type { AppDispatch, RootState } from '../store/store';
import { searchHCPs, selectHcp, clearSelection } from '../store/slices/hcpSlice';
import { fetchHistory } from '../store/slices/interactionSlice';

export const HcpSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { searchResults, selectedHcp, loading } = useSelector((state: RootState) => state.hcp);

  useEffect(() => {
    if (query === '') {
      dispatch(searchHCPs(''));
    } else {
      const delayDebounceFn = setTimeout(() => {
        dispatch(searchHCPs(query));
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [query, dispatch]);

  const handleSelect = (hcp: any) => {
    dispatch(selectHcp(hcp));
    dispatch(fetchHistory(hcp.id));
  };

  const getInitials = (name: string) => {
    return name
      .replace('Dr. ', '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h2 className="card-title">
        <Users size={16} />
        HCP Directory
      </h2>
      
      {selectedHcp ? (
        <div className="hcp-item selected" onClick={() => dispatch(clearSelection())} title="Click to clear selection">
          <div className="hcp-avatar">
            {getInitials(selectedHcp.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{selectedHcp.name}</div>
              <CheckCircle2 size={16} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-indigo">{selectedHcp.specialty}</span>
              <span>{selectedHcp.organization}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="form-group" style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search HCPs by name or specialty..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          
          <div className="hcp-list">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="spinner" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map(hcp => (
                <div 
                  key={hcp.id} 
                  className="hcp-item"
                  onClick={() => handleSelect(hcp)}
                >
                  <div className="hcp-avatar">
                    {getInitials(hcp.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{hcp.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-neutral">{hcp.specialty}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{hcp.organization}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                <Users size={24} />
                <h3 style={{ margin: '0.5rem 0 0.25rem' }}>No HCPs Found</h3>
                <p>Try adjusting your search query.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
