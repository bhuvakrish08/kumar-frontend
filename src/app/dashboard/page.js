'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { apiFetch, getImageUrl } from '@/lib/api';

export default function DashboardPage() {
  const [contacts, setContacts] = useState([]);
  const [sources, setSources] = useState([]);
  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData(q = '', sourceFilter = '') {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/contacts';
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (sourceFilter) params.append('source', sourceFilter);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const [contactsData, sourcesData] = await Promise.all([
        apiFetch(endpoint),
        apiFetch('/sources').catch(() => [])
      ]);

      setContacts(contactsData || []);
      setSources(sourcesData || []);
    } catch (err) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(search, activeSource);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadData(search, activeSource);
  }

  function handleSourceClick(sourceName) {
    const next = activeSource === sourceName ? '' : sourceName;
    setActiveSource(next);
    loadData(search, next);
  }

  return (
    <main className="shell">
      <Header />
      <div className="card">
        <form className="search" onSubmit={handleSearchSubmit}>
          <input
            name="q"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, company, SOURCE tag, city, spouse, interest..."
            autoFocus
          />
          <button className="btn primary" type="submit">
            Search
          </button>
          {search && (
            <button
              className="btn"
              type="button"
              onClick={() => {
                setSearch('');
                loadData('', activeSource);
              }}
            >
              Clear
            </button>
          )}
        </form>

        {sources.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div className="section-title">Filter by SOURCE Tag</div>
            <div className="tags" style={{ overflowX: 'auto', paddingBottom: 4 }}>
              {sources.map(s => (
                <span
                  key={s.id}
                  className={`tag ${activeSource === s.name ? 'active' : ''}`}
                  onClick={() => handleSourceClick(s.name)}
                >
                  {s.name} ({s.contact_count})
                </span>
              ))}
              {activeSource && (
                <span
                  className="btn"
                  style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '999px', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                  onClick={() => handleSourceClick('')}
                >
                  Clear Filter ✕
                </span>
              )}
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="subtle" style={{ padding: '30px 0', textTransform: 'center', fontStyle: 'italic' }}>
            Loading relationship memory...
          </div>
        ) : (
          <div className="list">
            {contacts.map(c => {
              const name = [c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ');
              return (
                <Link href={`/contacts/${c.id}`} className="contact-row" key={c.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {c.photo_url ? (
                      <a
                        href={getImageUrl(c.photo_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Click to view full image in new tab"
                        style={{ cursor: 'pointer', flexShrink: 0 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageUrl(c.photo_url)}
                          alt={name}
                          style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                        />
                      </a>
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1rem',
                          flexShrink: 0
                        }}
                      >
                        {c.first_name ? c.first_name[0].toUpperCase() : '?'}
                      </div>
                    )}
                    <div>
                      <strong style={{ color: 'var(--ink)', fontSize: '1rem' }}>{name}</strong>
                      <div className="subtle" style={{ fontSize: '0.85rem' }}>{c.job_title || 'No title listed'}</div>
                    </div>
                  </div>
                  <div>{c.company_name || <span className="subtle">No company</span>}</div>
                  <div className="desktop-only" style={{ fontSize: '0.875rem' }}>
                    {c.source_names ? (
                      <span style={{ background: '#f0f7f4', color: '#1e4d3a', border: '1px solid #d8f3dc', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                        {c.source_names}
                      </span>
                    ) : (
                      <span className="subtle">No SOURCE tags</span>
                    )}
                  </div>
                  <div className="contact-arrow">›</div>
                </Link>
              );
            })}
            {!contacts.length && <div className="empty">No contacts matched that memory search.</div>}
          </div>
        )}
      </div>
    </main>
  );
}
