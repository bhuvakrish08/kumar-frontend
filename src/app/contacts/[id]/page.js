'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AddInteraction from '@/components/AddInteraction';
import AddRelationship from '@/components/AddRelationship';
import EditInteractionModal from '@/components/EditInteractionModal';
import { apiFetch, getImageUrl } from '@/lib/api';

function fmt(v) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
}

function getInteractionIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('call') || t.includes('phone')) return '📞';
  if (t.includes('meeting')) return '🤝';
  if (t.includes('email')) return '✉️';
  if (t.includes('message') || t.includes('whatsapp') || t.includes('sms')) return '💬';
  if (t.includes('dinner') || t.includes('lunch') || t.includes('coffee')) return '🍽️';
  if (t.includes('intro')) return '👥';
  if (t.includes('follow')) return '🎯';
  return '📝';
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingInteraction, setEditingInteraction] = useState(null);

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

  async function handleDeleteInteraction(interactionId) {
    if (!window.confirm('Are you sure you want to remove this interaction from timeline?')) return;
    try {
      await apiFetch(`/interactions/${interactionId}`, { method: 'DELETE' });
      loadContact();
    } catch (err) {
      alert(err.message || 'Failed to delete interaction');
    }
  }

  async function handleDeleteRelationship(relId) {
    if (!window.confirm('Are you sure you want to remove this relationship link?')) return;
    try {
      await apiFetch(`/relationships/${relId}`, { method: 'DELETE' });
      loadContact();
    } catch (err) {
      alert(err.message || 'Failed to delete relationship');
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

  const hasMetInfo = c.introduced_by_name || c.introduced_by_contact_id || c.met_context || c.met_place || c.met_date || c.how_we_met_notes;

  return (
    <main className="shell">
      <Header />
      <div className="grid two">
        <section className="grid" style={{ gap: '20px' }}>
          {/* Hero & Narrative Briefing */}
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
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1a73e8', boxShadow: 'var(--shadow-md)' }}
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
                  <h1 className="name" style={{ margin: 0 }}>{name}</h1>
                  <div className="headline" style={{ marginTop: '4px' }}>{headline || 'A person worth remembering'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="btn" href={`/contacts/${c.id}/edit`}>Edit Contact</Link>
                <button className="btn danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>

            {/* Narrative biography generated deterministically by backend */}
            <div className="bio-card" style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🧠</span>
                <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-secondary)' }}>
                  Executive Narrative Briefing
                </strong>
              </div>
              <p className="bio" style={{ margin: 0, lineHeight: 1.6 }}>{data.narrative}</p>
            </div>
          </div>

          {/* 🤝 How I Know This Person */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem' }}>🤝</span>
                <h3 className="section-title" style={{ margin: 0 }}>How I Know This Person</h3>
              </div>
              <Link href={`/contacts/${c.id}/edit`} className="subtle" style={{ fontSize: '0.85rem', textDecoration: 'none' }}>
                Edit ↗
              </Link>
            </div>

            {hasMetInfo ? (
              <div className="meta" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', fontSize: '0.95rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--ink-secondary)' }}>Introduced by</div>
                <div>
                  {data.introduced_by_contact ? (
                    <Link
                      href={`/contacts/${data.introduced_by_contact.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#e8f0fe',
                        color: '#1a73e8',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        border: '1px solid #d2e3fc'
                      }}
                      title="View linked introducer contact profile"
                    >
                      👤 {data.introduced_by_contact.first_name} {data.introduced_by_contact.last_name}
                      {data.introduced_by_contact.company_name ? ` (${data.introduced_by_contact.company_name})` : ''} ↗
                    </Link>
                  ) : c.introduced_by_name ? (
                    <strong>{c.introduced_by_name}</strong>
                  ) : (
                    <span className="subtle">—</span>
                  )}
                </div>

                <div style={{ fontWeight: 600, color: 'var(--ink-secondary)' }}>Where / Context</div>
                <div>{c.met_context || <span className="subtle">—</span>}</div>

                <div style={{ fontWeight: 600, color: 'var(--ink-secondary)' }}>Place</div>
                <div>{c.met_place || <span className="subtle">—</span>}</div>

                <div style={{ fontWeight: 600, color: 'var(--ink-secondary)' }}>Date first met</div>
                <div>{fmt(c.met_date) || <span className="subtle">—</span>}</div>

                {c.how_we_met_notes && (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--ink-secondary)' }}>Meeting notes</div>
                    <div style={{ color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{c.how_we_met_notes}</div>
                  </>
                )}
              </div>
            ) : (
              <div className="empty" style={{ textAlign: 'left', padding: '12px 0' }}>
                No introduction or meeting details recorded yet.{' '}
                <Link href={`/contacts/${c.id}/edit`} style={{ color: 'var(--brand)', textDecoration: 'underline' }}>
                  Add how you met
                </Link>
              </div>
            )}
          </div>

          {/* SOURCE Tags */}
          <div className="card">
            <h3 className="section-title">SOURCE Tags</h3>
            <div className="tags">
              {data.sources.map(s => (
                <span className="tag active" key={s.id}>{s.name}</span>
              ))}
              {!data.sources.length && <span className="empty">No SOURCE tags attached yet.</span>}
            </div>
          </div>

          {/* 📅 Interactions Timeline */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>📅</span>
                <h3 className="section-title" style={{ margin: 0 }}>Interaction Timeline</h3>
              </div>
              <span className="subtle" style={{ fontSize: '0.85rem' }}>
                {data.interactions.length} event{data.interactions.length === 1 ? '' : 's'} (newest first)
              </span>
            </div>

            <div className="timeline">
              {data.interactions.map(i => {
                const icon = getInteractionIcon(i.interaction_type);
                const hasFollowUp = i.follow_up_date || (i.follow_up_status && i.follow_up_status !== 'none');

                return (
                  <div className="timeline-item" key={i.id} style={{ position: 'relative', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div className="timeline-date" style={{ fontWeight: 600 }}>
                        <span style={{ marginRight: '6px' }}>{icon}</span>
                        {fmt(i.occurred_at)} · {i.interaction_type}
                      </div>

                      {/* Action buttons: Edit & Delete */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setEditingInteraction(i)}
                          title="Edit interaction"
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            padding: '2px 8px',
                            color: '#334155'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInteraction(i.id)}
                          title="Delete interaction"
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            padding: '2px 8px',
                            color: '#dc2626'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="timeline-title" style={{ fontSize: '1.05rem', marginTop: '4px', color: 'var(--ink)' }}>
                      {i.subject || i.interaction_type}
                    </div>

                    {i.details && (
                      <div style={{ marginTop: '6px', color: 'var(--ink-secondary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                        {i.details}
                      </div>
                    )}

                    {/* Follow-up Indicator */}
                    {hasFollowUp && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {i.follow_up_status === 'pending' ? (
                          <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            ⏳ Follow-up: {fmt(i.follow_up_date) || 'Pending'}
                          </span>
                        ) : i.follow_up_status === 'completed' ? (
                          <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            ✅ Follow-up completed{i.follow_up_date ? ` (${fmt(i.follow_up_date)})` : ''}
                          </span>
                        ) : i.follow_up_status === 'cancelled' ? (
                          <span style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                            ✕ Follow-up cancelled
                          </span>
                        ) : i.follow_up_date ? (
                          <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            🔔 Follow-up scheduled: {fmt(i.follow_up_date)}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
              {!data.interactions.length && <div className="empty">No interaction history recorded yet.</div>}
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '22px 0' }} />
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--ink)' }}>+ Log New Interaction</h4>
            <AddInteraction contactId={c.id} onInteractionAdded={loadContact} />
          </div>
        </section>

        {/* Aside Sidebar */}
        <aside className="grid" style={{ gap: '20px' }}>
          {/* Profile Details */}
          <div className="card">
            <h3 className="section-title">Contact Profile Details</h3>
            <div className="meta">
              <div>Email</div><div>{c.primary_email || '—'}</div>
              <div>Phone</div><div>{c.mobile_phone || c.primary_phone || '—'}</div>
              <div>Birthday</div><div>{fmt(c.birthday) || '—'}</div>
              <div>Spouse</div><div>{c.spouse_name || '—'}</div>
              <div>Interests</div><div>{c.interests || '—'}</div>
              <div>Address</div>
              <div>
                {[c.work_address1, c.work_address2, c.work_city, c.work_state, c.work_postal_code, c.work_country]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </div>
            </div>
          </div>

          {/* 🔗 Relationships & Network */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔗</span>
                <h3 className="section-title" style={{ margin: 0 }}>People around {c.first_name}</h3>
              </div>
              <span className="subtle" style={{ fontSize: '0.8rem' }}>{data.relationships.length}</span>
            </div>

            <div className="list">
              {data.relationships.map(x => (
                <div key={x.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {x.related_contact_id ? (
                      <Link
                        href={`/contacts/${x.related_contact_id}`}
                        style={{ color: '#1a73e8', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="View linked contact profile"
                      >
                        👤 {x.related_name || x.linked_name} ↗
                      </Link>
                    ) : (
                      <strong style={{ color: 'var(--ink)' }}>{x.related_name || x.linked_name}</strong>
                    )}
                    <div className="subtle" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, marginRight: '6px', fontSize: '0.78rem' }}>
                        {x.relationship_type}
                      </span>
                      {x.notes ? ` · ${x.notes}` : ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRelationship(x.id)}
                    title="Remove relationship"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', fontSize: '0.9rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {!data.relationships.length && <div className="empty">No relationship links yet.</div>}
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '22px 0' }} />
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--ink)' }}>+ Connect Another Person</h4>
            <AddRelationship contactId={c.id} onRelationshipAdded={loadContact} />
          </div>
        </aside>
      </div>

      {/* Edit Interaction Modal */}
      <EditInteractionModal
        interaction={editingInteraction}
        isOpen={Boolean(editingInteraction)}
        onClose={() => setEditingInteraction(null)}
        onUpdated={loadContact}
      />
    </main>
  );
}
