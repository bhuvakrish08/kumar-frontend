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
      setError(err.message || 'Failed to add interaction');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid">
      {error && <div className="error">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Type</label>
          <select name="interaction_type">
            <option>Note</option>
            <option>Email</option>
            <option>Phone</option>
            <option>Meeting</option>
            <option>WhatsApp</option>
            <option>Dinner</option>
            <option>Introduction</option>
          </select>
        </div>
        <div className="field">
          <label>Date & time</label>
          <input name="occurred_at" type="datetime-local" />
        </div>
        <div className="field wide">
          <label>Subject</label>
          <input name="subject" placeholder="e.g. Discussed logistics update" />
        </div>
        <div className="field wide">
          <label>Details</label>
          <textarea name="details" placeholder="Notes from conversation..." />
        </div>
      </div>
      <button className="btn primary" disabled={saving}>{saving ? 'Adding...' : 'Add to history'}</button>
    </form>
  );
}
