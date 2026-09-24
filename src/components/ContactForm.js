'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, apiUploadFile, getImageUrl } from '@/lib/api';

function dateValue(v) {
  if (!v) return '';
  return String(v).slice(0, 10);
}

export default function ContactForm({ contact, sources = [] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [photoUrl, setPhotoUrl] = useState(contact?.photo_url || '');

  // "How I Know This Person" state
  const [userContacts, setUserContacts] = useState([]);
  const [selectedIntroducerId, setSelectedIntroducerId] = useState(
    contact?.introduced_by_contact_id ? String(contact.introduced_by_contact_id) : ''
  );
  const [introducedByName, setIntroducedByName] = useState(contact?.introduced_by_name || '');

  useEffect(() => {
    // Fetch user's contacts to allow linking introducer
    apiFetch('/contacts')
      .then(list => {
        const filtered = (list || []).filter(c => !contact?.id || c.id !== contact.id);
        setUserContacts(filtered);
      })
      .catch(() => {});
  }, [contact?.id]);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const res = await apiUploadFile(file);
      const urlToSave = res.url || res.relativeUrl;
      setPhotoUrl(urlToSave);
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const endpoint = contact ? `/contacts/${contact.id}` : '/contacts';
      const method = contact ? 'PUT' : 'POST';
      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(data)
      });

      router.push(`/contacts/${res.id || contact.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Unable to save contact');
    } finally {
      setSaving(false);
    }
  }

  const fullPhotoUrl = getImageUrl(photoUrl);

  return (
    <form className="grid" onSubmit={submit} style={{ gap: '24px' }}>
      {error && <div className="error">{error}</div>}

      {/* 1. Personal Identity */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>Personal Information</h3>
            <div className="subtle" style={{ fontSize: '0.8rem' }}>Name, birthday, and personal background</div>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>First Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              name="first_name"
              required
              defaultValue={contact?.first_name || ''}
              placeholder="e.g. John"
            />
          </div>
          <div className="field">
            <label>Middle Name</label>
            <input
              type="text"
              name="middle_name"
              defaultValue={contact?.middle_name || ''}
              placeholder="e.g. Quincy"
            />
          </div>
          <div className="field">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              defaultValue={contact?.last_name || ''}
              placeholder="e.g. Adams"
            />
          </div>
          <div className="field">
            <label>Nickname</label>
            <input
              type="text"
              name="nickname"
              defaultValue={contact?.nickname || ''}
              placeholder="e.g. Johnny"
            />
          </div>
          <div className="field">
            <label>Birthday</label>
            <input
              type="date"
              name="birthday"
              defaultValue={dateValue(contact?.birthday)}
            />
          </div>
          <div className="field">
            <label>Spouse / Partner</label>
            <input
              type="text"
              name="spouse_name"
              defaultValue={contact?.spouse_name || ''}
              placeholder="e.g. Arlene Adams"
            />
          </div>
          <div className="field wide">
            <label>Interests / Likes</label>
            <input
              type="text"
              name="interests"
              defaultValue={contact?.interests || ''}
              placeholder="e.g. Fine single malt whisky, sailing, endurance running"
            />
          </div>
        </div>
      </div>

      {/* 2. Professional & Organization */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: '1.25rem' }}>💼</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>Work & Organization</h3>
            <div className="subtle" style={{ fontSize: '0.8rem' }}>Company and professional role</div>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Company</label>
            <input
              type="text"
              name="company_name"
              defaultValue={contact?.company_name || ''}
              placeholder="e.g. IBM"
            />
          </div>
          <div className="field">
            <label>Job Title</label>
            <input
              type="text"
              name="job_title"
              defaultValue={contact?.job_title || ''}
              placeholder="e.g. Chief Logistics Manager"
            />
          </div>
        </div>
      </div>

      {/* 3. Contact Methods */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: '1.25rem' }}>📞</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>Contact Details</h3>
            <div className="subtle" style={{ fontSize: '0.8rem' }}>Email address and phone numbers</div>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Primary Email</label>
            <input
              type="email"
              name="primary_email"
              defaultValue={contact?.primary_email || ''}
              placeholder="john.adams@example.com"
            />
          </div>
          <div className="field">
            <label>Mobile Phone</label>
            <input
              type="text"
              name="mobile_phone"
              defaultValue={contact?.mobile_phone || ''}
              placeholder="+1 (914) 555-0199"
            />
          </div>
          <div className="field">
            <label>Primary Phone</label>
            <input
              type="text"
              name="primary_phone"
              defaultValue={contact?.primary_phone || ''}
              placeholder="+1 (914) 555-0100"
            />
          </div>
        </div>
      </div>

      {/* 4. How I Know This Person */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: '1.25rem' }}>🤝</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>How I Know This Person</h3>
            <div className="subtle" style={{ fontSize: '0.8rem' }}>Who introduced them, where, when, and context notes</div>
          </div>
        </div>
        <div className="form-grid">
          {/* Link introducer from contacts */}
          <div className="field">
            <label>Introduced By (Select From Your Contacts)</label>
            <select
              name="introduced_by_contact_id"
              value={selectedIntroducerId}
              onChange={(e) => {
                const idVal = e.target.value;
                setSelectedIntroducerId(idVal);
                if (idVal) {
                  const found = userContacts.find(c => String(c.id) === idVal);
                  if (found) {
                    const fullName = [found.first_name, found.last_name].filter(Boolean).join(' ');
                    setIntroducedByName(fullName);
                  }
                }
              }}
            >
              <option value="">-- External Person / None --</option>
              {userContacts.map(c => {
                const cName = [c.first_name, c.last_name].filter(Boolean).join(' ');
                const label = c.company_name ? `${cName} (${c.company_name})` : cName;
                return (
                  <option key={c.id} value={c.id}>
                    👤 {label}
                  </option>
                );
              })}
            </select>
            <div className="subtle" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              Choose an existing contact from your account to link them directly.
            </div>
          </div>

          {/* Introducer Name (or custom if external) */}
          <div className="field">
            <label>Introducer Name</label>
            <input
              type="text"
              name="introduced_by_name"
              value={introducedByName}
              onChange={(e) => setIntroducedByName(e.target.value)}
              placeholder="e.g. Larry Rappaport"
            />
            <div className="subtle" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              Name of the person who made the introduction.
            </div>
          </div>

          <div className="field">
            <label>How / Where We Met (Context)</label>
            <input
              type="text"
              name="met_context"
              defaultValue={contact?.met_context || ''}
              placeholder="e.g. Daughter's wedding, Annual Logistics Summit"
            />
          </div>

          <div className="field">
            <label>Place</label>
            <input
              type="text"
              name="met_place"
              defaultValue={contact?.met_place || ''}
              placeholder="e.g. Mystique Banquet Hall, Chicago"
            />
          </div>

          <div className="field">
            <label>Date First Met</label>
            <input
              type="date"
              name="met_date"
              defaultValue={dateValue(contact?.met_date)}
            />
          </div>

          <div className="field wide">
            <label>How We Met Notes</label>
            <textarea
              name="how_we_met_notes"
              defaultValue={contact?.how_we_met_notes || ''}
              placeholder="Specific notes on how you got introduced, first conversation impressions, or initial meeting background."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* 5. Address Details */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: '1.25rem' }}>📍</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>Location & Address</h3>
            <div className="subtle" style={{ fontSize: '0.8rem' }}>Physical or work address details</div>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Work Address Line 1</label>
            <input
              type="text"
              name="work_address1"
              defaultValue={contact?.work_address1 || ''}
              placeholder="112 Main Street"
            />
          </div>
          <div className="field">
            <label>Address Line 2</label>
            <input
              type="text"
              name="work_address2"
              defaultValue={contact?.work_address2 || ''}
              placeholder="Suite 400"
            />
          </div>
          <div className="field">
            <label>City</label>
            <input
              type="text"
              name="work_city"
              defaultValue={contact?.work_city || ''}
              placeholder="Armonk"
            />
          </div>
          <div className="field">
            <label>State / Province</label>
            <input
              type="text"
              name="work_state"
              defaultValue={contact?.work_state || ''}
              placeholder="NY"
            />
          </div>
          <div className="field">
            <label>Postal Code</label>
            <input
              type="text"
              name="work_postal_code"
              defaultValue={contact?.work_postal_code || ''}
              placeholder="10504"
            />
          </div>
          <div className="field">
            <label>Country</label>
            <input
              type="text"
              name="work_country"
              defaultValue={contact?.work_country || ''}
              placeholder="USA"
            />
          </div>
        </div>
      </div>

      {/* 6. Photo Upload, Tags & Memory Notes */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: '1.25rem' }}>📸</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>Photo, Tags & Memory Notes</h3>
            <div className="subtle" style={{ fontSize: '0.8rem' }}>Contact photo, tag sources, and biography notes</div>
          </div>
        </div>
        <div className="form-grid">
          {/* Photo Upload Dropzone */}
          <div className="field wide" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px dashed #cbd5e1' }}>
            <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '0.6rem', color: 'var(--ink)' }}>
              Upload Contact Photo
            </label>
            <input type="hidden" name="photo_url" value={photoUrl} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {photoUrl && (
                <a
                  href={fullPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Click to view full image in new tab"
                  style={{
                    position: 'relative',
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #1a73e8',
                    flexShrink: 0,
                    display: 'block',
                    cursor: 'pointer'
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fullPhotoUrl}
                    alt="Uploaded preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </a>
              )}

              <div style={{ flex: 1, minWidth: '240px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.9rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                />

                {uploading && (
                  <div style={{ fontSize: '0.85rem', color: '#1a73e8', marginTop: '0.4rem', fontWeight: 600 }}>
                    ⏳ Uploading image to backend uploads folder...
                  </div>
                )}

                {photoUrl ? (
                  <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: '#1a73e8', fontWeight: 700 }}>✅ Stored Database URL:</span>
                    <input
                      type="text"
                      readOnly
                      value={photoUrl}
                      style={{ flex: 1, minWidth: '160px', fontSize: '0.8rem', padding: '0.3rem 0.5rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', color: '#334155' }}
                    />
                    <a
                      href={fullPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: '#1a73e8', fontWeight: 700, textDecoration: 'none' }}
                    >
                      ↗ Open in new tab
                    </a>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="subtle" style={{ marginTop: '0.4rem', fontSize: '0.825rem' }}>
                    Choose an image file from your device. It will be uploaded to <code>/uploads</code> and saved in the database.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field wide">
            <label>SOURCE Tags</label>
            <input
              name="sources"
              defaultValue={sources.map(s => s.name || s).join(', ')}
              placeholder="Vendor, Turkey, Pharmacy, Friend, Larry Rappaport"
            />
            <div className="subtle">Comma-separated tags. Stored as independent searchable SOURCE records.</div>
          </div>

          <div className="field wide">
            <label>Personal Notes</label>
            <textarea
              name="personal_notes"
              defaultValue={contact?.personal_notes || ''}
              placeholder="Facts worth remembering. Keep this factual because it may appear in the narrative biography."
            />
          </div>

          <div className="field wide">
            <label>Manual Narrative Override (Optional)</label>
            <textarea
              name="narrative_override"
              defaultValue={contact?.narrative_override || ''}
              placeholder="Leave blank to generate the biography automatically from structured facts on the backend server."
            />
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="form-actions" style={{ position: 'sticky', bottom: '16px', background: 'rgba(255,255,255,0.95)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)', backdropFilter: 'blur(12px)' }}>
        <button className="btn" type="button" onClick={() => router.back()}>
          Cancel
        </button>
        <button className="btn primary" disabled={saving || uploading} style={{ minWidth: '140px' }}>
          {saving ? 'Saving Contact...' : contact ? 'Update Contact' : 'Save Contact'}
        </button>
      </div>
    </form>
  );
}
