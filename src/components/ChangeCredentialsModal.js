'use client';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ChangeCredentialsModal({ isOpen, onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || newPassword.trim() === '') {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSaving(true);

    try {
      const res = await apiFetch('/auth/change-credentials', {
        method: 'PUT',
        body: JSON.stringify({
          newPassword: newPassword.trim()
        })
      });

      setSuccess('✅ Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
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
          width: 'min(460px, 100%)',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          padding: '28px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🔐</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Change Password</h3>
              <div className="subtle" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>Enter your new password below</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8', padding: '4px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="error" style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '0.875rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
              NEW PASSWORD <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="field">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
              CONFIRM NEW PASSWORD <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <button
              className="btn"
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                borderRadius: '8px',
                padding: '9px 18px',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              className="btn primary"
              type="submit"
              disabled={saving}
              style={{
                borderRadius: '8px',
                padding: '9px 20px',
                fontWeight: 600,
                backgroundColor: '#1a73e8',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
