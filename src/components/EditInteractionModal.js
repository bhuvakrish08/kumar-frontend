'use client';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

function formatForDatetimeLocal(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

function formatForDateInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EditInteractionModal({ interaction, isOpen, onClose, onUpdated }) {
  const [interactionType, setInteractionType] = useState(interaction?.interaction_type || 'Note');
  const [occurredAt, setOccurredAt] = useState(formatForDatetimeLocal(interaction?.occurred_at));
  const [subject, setSubject] = useState(interaction?.subject || '');
  const [details, setDetails] = useState(interaction?.details || '');
  const [followUpDate, setFollowUpDate] = useState(formatForDateInput(interaction?.follow_up_date));
  const [followUpStatus, setFollowUpStatus] = useState(interaction?.follow_up_status || 'none');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !interaction) return null;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiFetch(`/interactions/${interaction.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          interaction_type: interactionType,
          occurred_at: occurredAt || new Date().toISOString(),
          subject,
          details,
          follow_up_date: followUpDate || null,
          follow_up_status: followUpStatus
        })
      });

      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update interaction');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: 'min(560px, 100%)',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
          padding: '28px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ink)' }}>✏️ Edit Interaction</h3>
            <div className="subtle" style={{ fontSize: '0.85rem' }}>Update timeline record and follow-up status</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8' }}
          >
            ✕
          </button>
        </div>

        {error && <div className="error" style={{ marginBottom: '14px' }}>{error}</div>}

        <form onSubmit={handleSave} className="grid" style={{ gap: '16px' }}>
          <div className="form-grid">
            <div className="field">
              <label>Interaction Type</label>
              <select value={interactionType} onChange={e => setInteractionType(e.target.value)}>
                <option value="Call">📞 Call / Phone</option>
                <option value="Meeting">🤝 Meeting</option>
                <option value="Email">✉️ Email</option>
                <option value="Message">💬 Message / WhatsApp</option>
                <option value="Note">📝 Note</option>
                <option value="Dinner">🍽️ Lunch / Dinner / Coffee</option>
                <option value="Introduction">👥 Introduction</option>
                <option value="Follow-up">🎯 Follow-up / Task</option>
              </select>
            </div>

            <div className="field">
              <label>Date & Time</label>
              <input
                type="datetime-local"
                value={occurredAt}
                onChange={e => setOccurredAt(e.target.value)}
              />
            </div>

            <div className="field wide">
              <label>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Discussed contract terms"
              />
            </div>

            <div className="field wide">
              <label>Details / Discussion Notes</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                placeholder="Conversation details, notes, decisions..."
              />
            </div>

            <div className="field">
              <label>Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Follow-up Status</label>
              <select value={followUpStatus} onChange={e => setFollowUpStatus(e.target.value)}>
                <option value="none">No Follow-up</option>
                <option value="pending">⏳ Pending Follow-up</option>
                <option value="completed">✅ Follow-up Completed</option>
                <option value="cancelled">✕ Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <button className="btn" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
