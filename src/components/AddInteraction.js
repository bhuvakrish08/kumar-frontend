'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';

export default function AddInteraction({ contactId, onInteractionAdded }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formEl = e.currentTarget;
    const data = Object.fromEntries(new FormData(formEl).entries());

    try {
      await apiFetch(`/contacts/${contactId}/interactions`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      formEl.reset();
      if (onInteractionAdded) onInteractionAdded();
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to record interaction');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid" style={{ gap: '16px' }}>
      {error && <div className="error">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Interaction Type</label>
          <select name="interaction_type" defaultValue="Meeting">
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
          <input name="occurred_at" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
        </div>

        <div className="field wide">
          <label>Subject / Topic</label>
          <input name="subject" placeholder="e.g. Q3 Logistics contract review" />
        </div>

        <div className="field wide">
          <label>Interaction Details / Meeting Notes</label>
          <textarea name="details" placeholder="What was discussed, next steps, action items..." rows={3} />
        </div>

        {/* Follow-up section */}
        <div className="field">
          <label>Follow-up Date (Optional)</label>
          <input name="follow_up_date" type="date" />
        </div>

        <div className="field">
          <label>Follow-up Status</label>
          <select name="follow_up_status" defaultValue="none">
            <option value="none">No Follow-up Needed</option>
            <option value="pending">⏳ Pending Follow-up</option>
            <option value="completed">✅ Follow-up Completed</option>
            <option value="cancelled">✕ Cancelled</option>
          </select>
        </div>
      </div>

      <div>
        <button className="btn primary" disabled={saving} style={{ padding: '8px 18px', fontWeight: 600 }}>
          {saving ? 'Adding...' : '+ Add To Timeline'}
        </button>
      </div>
    </form>
  );
}
