'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AddInteraction from '@/components/AddInteraction';
import AddRelationship from '@/components/AddRelationship';
import { apiFetch, getImageUrl } from '@/lib/api';

function fmt(v) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadContact() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/contacts/${id}`);
      setData(res);
    } catch (err) {
      setError(err.message || 'Contact not found');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadContact();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await apiFetch(`/contacts/${id}`, { method: 'DELETE' });
      router.push('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to delete contact');
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <Header />
        <div className="card subtle" style={{ padding: '40px', textAlign: 'center' }}>
          Loading relationship memory profile...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="shell">
        <Header />
        <div className="card">
          <div className="error">{error || 'Contact not found'}</div>
          <Link href="/dashboard" className="btn">Back to contacts</Link>
        </div>
      </main>
    );
  }

  const c = data.contact;
  const name = [c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ');
  const headline = [
    c.job_title,
    c.company_name,
    [c.work_city, c.work_state].filter(Boolean).join(', ')
  ].filter(Boolean).join(' · ');

  return (
    <main className="shell">
      <Header />
      <div className="grid two">
        <section className="grid">
          <div className="card hero">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {c.photo_url ? (
                  <a
                    href={getImageUrl(c.photo_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Click to open image in new tab"
                    style={{ cursor: 'pointer', display: 'inline-block', flexShrink: 0 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(c.photo_url)}
                      alt={name}
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1a73e8', shadow: 'var(--shadow-md)' }}
                    />
                  </a>
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.75rem',
                      fontFamily: 'var(--font-serif)',
                      flexShrink: 0
                    }}
                  >
                    {c.first_name ? c.first_name[0].toUpperCase() : '?'}
                  </div>
                )}
                <div>
                  <h1 className="name">{name}</h1>
                  <div className="headline">{headline || 'A person worth remembering'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="btn" href={`/contacts/${c.id}/edit`}>Edit</Link>
                <button className="btn danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>

            {/* Narrative biography generated strictly by the backend server */}
            <div className="bio-card">
              <p className="bio">{data.narrative}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">SOURCE Tags</h3>
            <div className="tags">
              {data.sources.map(s => (
                <span className="tag active" key={s.id}>{s.name}</span>
              ))}
              {!data.sources.length && <span className="empty">No SOURCE tags attached yet.</span>}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Relationship history</h3>
            <div className="timeline">
              {data.interactions.map(i => (
                <div className="timeline-item" key={i.id}>
                  <div className="timeline-date">{fmt(i.occurred_at)} · {i.interaction_type}</div>
                  <div className="timeline-title">{i.subject || i.interaction_type}</div>
                  {i.details && <div style={{ marginTop: 4, color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>{i.details}</div>}
                </div>
              ))}
              {!data.interactions.length && <div className="empty">No interaction history recorded yet.</div>}
            </div>
            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '22px 0' }} />
            <AddInteraction contactId={c.id} onInteractionAdded={loadContact} />
          </div>
        </section>

        <aside className="grid">
          <div className="card">
            <h3 className="section-title">Contact Profile Details</h3>
            <div className="meta">
              <div>Email</div><div>{c.primary_email || '—'}</div>
              <div>Phone</div><div>{c.mobile_phone || c.primary_phone || '—'}</div>
              <div>Birthday</div><div>{fmt(c.birthday) || '—'}</div>
              <div>Introduced by</div><div>{c.introduced_by_name || '—'}</div>
              <div>Met</div><div>{[c.met_context, c.met_place].filter(Boolean).join(' · ') || '—'}</div>
              <div>Interests</div><div>{c.interests || '—'}</div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">People around {c.first_name}</h3>
            <div className="list">
              {data.relationships.map(x => (
                <div key={x.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <strong style={{ color: 'var(--ink)' }}>{x.related_name || x.linked_name}</strong>
                  <div className="subtle" style={{ fontSize: '0.85rem' }}>{x.relationship_type}{x.notes ? ` · ${x.notes}` : ''}</div>
                </div>
              ))}
              {!data.relationships.length && <div className="empty">No relationship links yet.</div>}
            </div>
            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '22px 0' }} />
            <AddRelationship contactId={c.id} onRelationshipAdded={loadContact} />
          </div>
        </aside>
      </div>
    </main>
  );
}
