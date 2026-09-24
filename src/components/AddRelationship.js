'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';

export default function AddRelationship({ contactId, onRelationshipAdded }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [userContacts, setUserContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [relatedName, setRelatedName] = useState('');
  const [relationshipType, setRelationshipType] = useState('Colleague');
  const [customType, setCustomType] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Fetch user's contacts to only allow linking contacts of the same user
    apiFetch('/contacts')
      .then(list => {
        const filtered = (list || []).filter(c => String(c.id) !== String(contactId));
        setUserContacts(filtered);
      })
      .catch(() => {});
  }, [contactId]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const finalType = relationshipType === 'Other' ? customType.trim() : relationshipType;
    if (!finalType) {
      setError('Please specify a relationship type');
      setSaving(false);
      return;
    }

    if (!relatedName.trim() && !selectedContactId) {
      setError('Please select an existing contact or enter a person name');
      setSaving(false);
      return;
    }

    try {
      await apiFetch(`/contacts/${contactId}/relationships`, {
        method: 'POST',
        body: JSON.stringify({
          relationship_type: finalType,
          related_name: relatedName.trim(),
          related_contact_id: selectedContactId ? Number(selectedContactId) : null,
          notes: notes.trim() || null
        })
      });

      // Reset form
      setSelectedContactId('');
      setRelatedName('');
      setRelationshipType('Colleague');
      setCustomType('');
      setNotes('');

      if (onRelationshipAdded) onRelationshipAdded();
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to add relationship');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid" style={{ gap: '14px' }}>
      {error && <div className="error">{error}</div>}

      <div className="field">
        <label>Relationship Type</label>
        <select
          value={relationshipType}
          onChange={e => setRelationshipType(e.target.value)}
        >
          <option value="Friend">🤝 Friend</option>
          <option value="Colleague">💼 Colleague</option>
          <option value="Family">🏡 Family</option>
          <option value="Introduced by">👥 Introduced by</option>
          <option value="Business Partner">📈 Business Partner</option>
          <option value="Client">🎯 Client / Customer</option>
          <option value="Assistant">📋 Assistant</option>
          <option value="Mentor">🎓 Mentor / Advisor</option>
          <option value="Other">Custom / Other</option>
        </select>
      </div>

      {relationshipType === 'Other' && (
        <div className="field">
          <label>Custom Relationship Type</label>
          <input
            type="text"
            value={customType}
            onChange={e => setCustomType(e.target.value)}
            placeholder="e.g. Co-founder, Tennis partner, Board member"
            required
          />
        </div>
      )}

      <div className="field">
        <label>Connect to Existing Contact (Optional)</label>
        <select
          value={selectedContactId}
          onChange={e => {
            const val = e.target.value;
            setSelectedContactId(val);
            if (val) {
              const found = userContacts.find(c => String(c.id) === val);
              if (found) {
                const name = [found.first_name, found.last_name].filter(Boolean).join(' ');
                setRelatedName(name);
              }
            }
          }}
        >
          <option value="">-- External Person / Custom Name --</option>
          {userContacts.map(c => {
            const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
            return (
              <option key={c.id} value={c.id}>
                👤 {name} {c.company_name ? `(${c.company_name})` : ''}
              </option>
            );
          })}
        </select>
        <div className="subtle" style={{ fontSize: '0.75rem', marginTop: '3px' }}>
          Connects this contact to another person in your contacts directory.
        </div>
      </div>

      <div className="field">
        <label>Person's Name <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input
          type="text"
          value={relatedName}
          onChange={e => setRelatedName(e.target.value)}
          placeholder="Full name of related person"
          required
        />
      </div>

      <div className="field">
        <label>Context Notes</label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Worked together on AWS migration"
        />
      </div>

      <button className="btn primary" disabled={saving} style={{ padding: '8px 16px' }}>
        {saving ? 'Adding...' : '+ Add Relationship Link'}
      </button>
    </form>
  );
}
