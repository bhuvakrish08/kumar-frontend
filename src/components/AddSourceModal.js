'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function AddSourceModal({ isOpen, onClose, onSourcesUpdated }) {
  const [sources, setSources] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSources();
      setName('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  async function loadSources() {
    try {
      const data = await apiFetch('/sources');
      setSources(data || []);
      if (onSourcesUpdated) onSourcesUpdated(data || []);
    } catch (err) {
      console.error('Failed to load sources in modal:', err);
    }
  }

  if (!isOpen) return null;

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const created = await apiFetch('/sources', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed })
      });
      setName('');
      setSuccess(`Source tag "${created.name}" added!`);
      await loadSources();
    } catch (err) {
      setError(err.message || 'Failed to add source');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id) {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    setError('');
    setSuccess('');
    try {
      const updated = await apiFetch(`/sources/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: trimmed })
      });
      setEditingId(null);
      setEditingName('');
      setSuccess(`Source updated to "${updated.name}"`);
      await loadSources();
    } catch (err) {
      setError(err.message || 'Failed to update source');
    }
  }

  async function handleDelete(id, sourceName) {
    if (!confirm(`Are you sure you want to delete source "${sourceName}"?`)) return;

    setError('');
    setSuccess('');
    try {
      await apiFetch(`/sources/${id}`, { method: 'DELETE' });
      setSuccess(`Source "${sourceName}" deleted`);
      await loadSources();
    } catch (err) {
      setError(err.message || 'Failed to delete source');
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
            🏷️ Manage Source Tags
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {success && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            ✓ {success}
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Add Source Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter new source tag name..."
            style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            required
          />
          <button
            className="btn primary"
            type="submit"
            disabled={loading || !name.trim()}
            style={{ whiteSpace: 'nowrap' }}
          >
            {loading ? 'Adding...' : '+ Add'}
          </button>
        </form>

        {/* Existing Sources List */}
        <div style={{ marginTop: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
            Existing Source Tags ({sources.length})
          </label>

          {sources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              No source tags added yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sources.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {editingId === s.id ? (
                    <div style={{ display: 'flex', gap: '0.4rem', flex: 1, marginRight: '0.5rem' }}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        style={{ flex: 1, padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #3b82f6', fontSize: '0.85rem' }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn primary"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleUpdate(s.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                          {s.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#e2e8f0', padding: '1px 6px', borderRadius: '10px' }}>
                          {s.contact_count}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                          onClick={() => {
                            setEditingId(s.id);
                            setEditingName(s.name);
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '2px 6px', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => handleDelete(s.id, s.name)}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
          <button className="btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
