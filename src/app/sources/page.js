'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { apiFetch } from '@/lib/api';

export default function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  async function loadSources() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/sources');
      setSources(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load source tags');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSources();
  }, []);

  const showNotification = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  async function handleAddSource(e) {
    e.preventDefault();
    const name = newSourceName.trim();
    if (!name) return;

    setIsAdding(true);
    setError('');
    try {
      const created = await apiFetch('/sources', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      setNewSourceName('');
      showNotification(`Source tag "${created.name}" created successfully!`);
      loadSources();
    } catch (err) {
      setError(err.message || 'Failed to create source tag');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleUpdateSource(e) {
    e.preventDefault();
    if (!editingId || !editingName.trim()) return;

    setError('');
    try {
      const updated = await apiFetch(`/sources/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingName.trim() })
      });
      setEditingId(null);
      setEditingName('');
      showNotification(`Source tag updated to "${updated.name}"`);
      loadSources();
    } catch (err) {
      setError(err.message || 'Failed to update source tag');
    }
  }

  async function handleDeleteSource(id, name) {
    if (!confirm(`Are you sure you want to delete source tag "${name}"?\nThis will remove the tag from all associated contacts.`)) {
      return;
    }

    setDeletingId(id);
    setError('');
    try {
      await apiFetch(`/sources/${id}`, {
        method: 'DELETE'
      });
      showNotification(`Source tag "${name}" deleted`);
      loadSources();
    } catch (err) {
      setError(err.message || 'Failed to delete source tag');
    } finally {
      setDeletingId(null);
    }
  }

  const filteredSources = sources.filter(s =>
    s.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <main className="shell">
      <Header />
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              🏷️ Manage Source Tags
            </h1>
            <p className="subtle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              Add, edit, view, and organize source tags for filtering your contacts.
            </p>
          </div>
          <Link href="/dashboard" className="btn">
            ← Back to Dashboard
          </Link>
        </div>

        {actionSuccess && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
            ✓ {actionSuccess}
          </div>
        )}

        {error && (
          <div className="error" style={{ marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Add Source Form */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.75rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>
            ➕ Add New Source Tag
          </h3>
          <form onSubmit={handleAddSource} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newSourceName}
              onChange={e => setNewSourceName(e.target.value)}
              placeholder="e.g. Conference, Logistics, Vendor, Alumni, Referral"
              style={{ flex: '1 1 280px', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
              required
            />
            <button className="btn primary" type="submit" disabled={isAdding || !newSourceName.trim()}>
              {isAdding ? 'Adding...' : '+ Add Source'}
            </button>
          </form>
          <div className="subtle" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
            Source tags help organize contacts. Once created, they appear in contact creation forms and dashboard filter pills.
          </div>
        </div>

        {/* Filter / Search Bar */}
        {sources.length > 5 && (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Search source tags..."
              style={{ width: '100%', maxWidth: '350px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>
        )}

        {/* Sources List */}
        {loading ? (
          <div className="subtle" style={{ padding: '30px 0', textTransform: 'center', fontStyle: 'italic' }}>
            Loading source tags...
          </div>
        ) : sources.length === 0 ? (
          <div className="empty" style={{ padding: '2.5rem 1rem', textAlign: 'center', background: '#fafafa', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏷️</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)' }}>No Source Tags Created Yet</h4>
            <p className="subtle" style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1rem auto' }}>
              Add source tags above to start categorizing your executive contacts by how or where you met them.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                All Source Tags ({filteredSources.length})
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {filteredSources.map(s => {
                const isEditing = editingId === s.id;
                return (
                  <div
                    key={s.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1rem',
                      background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                  >
                    {isEditing ? (
                      <form onSubmit={handleUpdateSource} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Edit Source Name:</label>
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #3b82f6', fontSize: '0.9rem' }}
                          autoFocus
                          required
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button className="btn primary" type="submit" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                            Save
                          </button>
                          <button
                            className="btn"
                            type="button"
                            onClick={() => { setEditingId(null); setEditingName(''); }}
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontWeight: 700,
                                fontSize: '0.9rem'
                              }}
                            >
                              {s.name}
                            </span>
                          </div>
                          <span
                            style={{
                              background: '#f1f5f9',
                              color: '#475569',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {s.contact_count} {Number(s.contact_count) === 1 ? 'contact' : 'contacts'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                          <Link
                            href={`/dashboard?source=${encodeURIComponent(s.name)}`}
                            style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                          >
                            🔍 View Contacts
                          </Link>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setEditingId(s.id);
                                setEditingName(s.name);
                              }}
                              title="Edit Source Tag"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn"
                              style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fca5a5' }}
                              onClick={() => handleDeleteSource(s.id, s.name)}
                              disabled={deletingId === s.id}
                              title="Delete Source Tag"
                            >
                              🗑️ {deletingId === s.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
