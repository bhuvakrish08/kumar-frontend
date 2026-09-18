'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';

export default function AddRelationship({ contactId, onRelationshipAdded }) {
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
      await apiFetch(`/contacts/${contactId}/relationships`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      formEl.reset();
      if (onRelationshipAdded) onRelationshipAdded();
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to add relationship');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid">
      {error && <div className="error">{error}</div>}
      <div className="field">
        <label>Relationship</label>
        <input name="relationship_type" placeholder="spouse, assistant, daughter, introduced by" required />
      </div>
      <div className="field">
        <label>Person's name</label>
        <input name="related_name" placeholder="Full name of related person" required />
      </div>
      <div className="field">
        <label>Notes</label>
        <input name="notes" placeholder="Context or optional details" />
      </div>
      <button className="btn" disabled={saving}>{saving ? 'Adding...' : 'Add relationship'}</button>
    </form>
  );
}
