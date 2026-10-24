'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AddInteraction from '@/components/AddInteraction';
import AddRelationship from '@/components/AddRelationship';
import EditInteractionModal from '@/components/EditInteractionModal';
import CommunicationStrip from '@/components/CommunicationStrip';
import CommitmentsWidget from '@/components/CommitmentsWidget';
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
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingInteraction, setEditingInteraction] = useState(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  async function loadContact() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/contacts/${id}`);
      setData(res);
      apiFetch(`/tell-dossier/contact-history/${id}`)
        .then(hRes => {
          if (hRes && Array.isArray(hRes.history)) {
            setHistoryData(hRes.history);
          }
        })
        .catch(() => {});
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

      {/* 1. HERO HEADER: Person name, current title/company, photo, and quick edit */}
      <div className="card hero mb-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            {c.photo_url ? (
              <a
                href={getImageUrl(c.photo_url)}
                target="_blank"
                rel="noopener noreferrer"
                title="View full image"
                className="shrink-0"
              >
                <img
                  src={getImageUrl(c.photo_url)}
                  alt={name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-indigo-600 shadow-md"
                />
              </a>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                {c.first_name ? c.first_name[0].toUpperCase() : '?'}
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{name}</h1>
                {c.introduced_by_name && (
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                    via {c.introduced_by_name}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">{headline || 'A relationship worth remembering'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link className="btn" href={`/contacts/${c.id}/edit`}>Edit Profile</Link>
            <button className="btn danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>

        {/* 2. COMMUNICATION ACTIONS: Call, Text, WhatsApp, Email */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <CommunicationStrip contact={c} />
        </div>

        {/* 3. LIVING EXECUTIVE NARRATIVE: "Who is this person to me?" */}
        <div className="bio-card mt-3 bg-gradient-to-r from-slate-50 to-indigo-50/40 p-4 rounded-xl border border-indigo-100/80">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-base">🧠</span>
            <strong className="text-xs uppercase tracking-wider text-indigo-900 font-extrabold">
              Relationship Narrative Briefing
            </strong>
          </div>
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed m-0 font-medium">{data.narrative}</p>
        </div>
      </div>

      <div className="grid two gap-6">
        {/* Main Column */}
        <section className="grid gap-6">

          {/* 4. 🤝 HOW I KNOW THIS PERSON & RELATIONSHIP SUMMARY */}
          <div className="card">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🤝</span>
                <h3 className="section-title m-0 text-sm font-bold text-gray-900">How I Know This Person</h3>
              </div>
              <Link href={`/contacts/${c.id}/edit`} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                Edit ↗
              </Link>
            </div>

            {hasMetInfo ? (
              <div className="meta grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-semibold text-gray-500 block">Introduced By:</span>
                  <div className="mt-0.5">
                    {data.introduced_by_contact ? (
                      <Link
                        href={`/contacts/${data.introduced_by_contact.id}`}
                        className="inline-flex items-center space-x-1 font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>👤 {data.introduced_by_contact.first_name} {data.introduced_by_contact.last_name}</span>
                        {data.introduced_by_contact.company_name ? ` (${data.introduced_by_contact.company_name})` : ''} ↗
                      </Link>
                    ) : c.introduced_by_name ? (
                      <span className="font-bold text-gray-900">{c.introduced_by_name}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-gray-500 block">Meeting Context:</span>
                  <span className="font-medium text-gray-800">{c.met_context || '—'}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-500 block">First Met Location:</span>
                  <span className="font-medium text-gray-800">{c.met_place || '—'}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-500 block">Date First Met:</span>
                  <span className="font-medium text-gray-800">{fmt(c.met_date) || '—'}</span>
                </div>

                {c.how_we_met_notes && (
                  <div className="sm:col-span-2 pt-1 border-t border-gray-100">
                    <span className="font-semibold text-gray-500 block mb-1">Context Notes:</span>
                    <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200/60 leading-relaxed whitespace-pre-wrap">
                      {c.how_we_met_notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic">
                No meeting context recorded yet.{' '}
                <Link href={`/contacts/${c.id}/edit`} className="text-indigo-600 underline">Add details</Link>
              </div>
            )}
          </div>

          {/* 5. 🎯 OPEN COMMITMENTS AND FOLLOW-UPS */}
          <div className="card">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎯</span>
                <h3 className="section-title m-0 text-sm font-bold text-gray-900">Open Commitments & Follow-ups</h3>
              </div>
            </div>
            <CommitmentsWidget contactId={id} />
          </div>

          {/* 6. 🕒 RECENT INTERACTIONS & TIMELINE */}
          <div className="card">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🕒</span>
                <h3 className="section-title m-0 text-sm font-bold text-gray-900">Recent Interactions & Timeline</h3>
              </div>
              <span className="text-xs text-gray-400">{data.interactions.length} recorded</span>
            </div>

            <div className="timeline space-y-4">
              {data.interactions.map(i => {
                const icon = getInteractionIcon(i.interaction_type);
                const hasFollowUp = i.follow_up_date || i.follow_up_status;
                return (
                  <div key={i.id} className="timeline-item p-3.5 bg-gray-50/70 border border-gray-200/80 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <span>{icon}</span>
                        <strong className="text-gray-900">{i.interaction_type}</strong>
                        <span className="text-gray-400">• {i.occurred_at ? fmt(i.occurred_at) : (i.raw_time_expression ? `~ ${i.raw_time_expression}` : 'Date not specified')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setEditingInteraction(i)}
                          className="text-xs px-2 py-0.5 text-gray-600 hover:text-indigo-600 rounded hover:bg-gray-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInteraction(i.id)}
                          className="text-xs px-2 py-0.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {i.details && (
                      <p className="text-xs text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">{i.details}</p>
                    )}

                    {hasFollowUp && (
                      <div className="mt-2 text-[11px] font-semibold">
                        {i.follow_up_status === 'pending' ? (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            ⏳ Follow-up: {fmt(i.follow_up_date) || 'Pending'}
                          </span>
                        ) : i.follow_up_status === 'completed' ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            ✅ Follow-up completed
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                            🔔 Scheduled: {fmt(i.follow_up_date)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {!data.interactions.length && (
                <p className="text-xs text-gray-400 italic">No timeline entries recorded yet.</p>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">+ Log New Interaction</h4>
              <AddInteraction contactId={c.id} onInteractionAdded={loadContact} />
            </div>
          </div>

        </section>

        {/* Sidebar Column */}
        <aside className="grid gap-6">

          {/* 7. 🔗 CONNECTIONS & PEOPLE AROUND CONTACT */}
          <div className="card">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔗</span>
                <h3 className="section-title m-0 text-sm font-bold text-gray-900">Connections</h3>
              </div>
              <span className="text-xs text-gray-400">{data.relationships.length}</span>
            </div>

            <div className="space-y-2">
              {data.relationships.map(x => (
                <div key={x.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    {x.related_contact_id ? (
                      <Link
                        href={`/contacts/${x.related_contact_id}`}
                        className="font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        👤 {x.related_name || x.linked_name} ↗
                      </Link>
                    ) : (
                      <strong className="text-gray-900">{x.related_name || x.linked_name}</strong>
                    )}
                    <span className="text-gray-500 block text-[11px]">{x.relationship_type} {x.notes ? `• ${x.notes}` : ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRelationship(x.id)}
                    className="text-gray-400 hover:text-rose-600 text-xs p-1"
                    title="Remove connection"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {!data.relationships.length && (
                <p className="text-xs text-gray-400 italic">No relationships linked yet.</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <AddRelationship contactId={c.id} onRelationshipAdded={loadContact} />
            </div>
          </div>

          {/* 8. 🏷️ SOURCE & CONTEXT TAGS */}
          <div className="card">
            <h3 className="section-title text-sm font-bold text-gray-900 mb-2">SOURCE & Context Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {data.sources.map(s => (
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-semibold" key={s.id}>
                  {s.name}
                </span>
              ))}
              {!data.sources.length && <span className="text-xs text-gray-400 italic">No tags attached.</span>}
            </div>
          </div>

          {/* 9. 👤 CONTACT PROFILE DETAILS */}
          <div className="card">
            <h3 className="section-title text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
              Profile Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Primary Email:</span>
                <span className="text-gray-900 font-semibold">{c.primary_email || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Mobile Phone:</span>
                <span className="text-gray-900 font-semibold">{c.mobile_phone || c.primary_phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Work Location:</span>
                <span className="text-gray-900 font-semibold">{[c.work_city, c.work_state, c.work_country].filter(Boolean).join(', ') || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Spouse / Partner:</span>
                <span className="text-gray-900 font-semibold">{c.spouse_name || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Interests & Topics:</span>
                <span className="text-gray-900 font-semibold">{c.interests || '—'}</span>
              </div>
            </div>
          </div>

          {/* 10. 📜 EXPANDABLE FACT HISTORY & PROVENANCE ("Why does Dossier think this?") */}
          <div className="card">
            <div
              className="flex justify-between items-center cursor-pointer select-none"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">📜</span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 m-0">Historical Employment & Provenance</h3>
                  <p className="text-[11px] text-gray-500 m-0">“Why does Dossier think this?” ({historyData.length} facts)</p>
                </div>
              </div>
              <button
                type="button"
                className="text-xs text-indigo-600 font-bold px-2 py-1 rounded bg-indigo-50 border border-indigo-200"
              >
                {isHistoryExpanded ? 'Collapse ▲' : 'Expand ▼'}
              </button>
            </div>

            {isHistoryExpanded && (
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                {historyData.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No historical provenance events recorded for this contact.</p>
                ) : (
                  historyData.map(h => {
                    let parsedPayload = {};
                    try {
                      parsedPayload = typeof h.value_payload === 'string' ? JSON.parse(h.value_payload) : (h.value_payload || {});
                    } catch (e) {
                      parsedPayload = { value: h.value_payload };
                    }
                    const factValue = parsedPayload.company_name || parsedPayload.phone || parsedPayload.email || JSON.stringify(parsedPayload);
                    const isCurrent = Boolean(h.is_current);

                    return (
                      <div
                        key={h.id}
                        className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                          isCurrent ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-[10px] uppercase tracking-wider text-gray-700">
                            {h.fact_type}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCurrent ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {isCurrent ? 'Current Value' : (h.confidence_status || 'Historical')}
                          </span>
                        </div>

                        <div className="font-bold text-gray-900 text-xs">
                          {factValue}
                        </div>

                        {h.source_raw_content && (
                          <div className="text-[11px] text-gray-500 font-mono bg-white p-2 rounded border border-gray-200">
                            <span className="font-semibold block text-[10px] uppercase text-gray-400">Original Memory:</span>
                            "{h.source_raw_content}"
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
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
