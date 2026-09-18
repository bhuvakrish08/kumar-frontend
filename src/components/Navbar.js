'use client';

import Link from 'next/link';

export default function Navbar({ user, onLogout }) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.875rem 1.5rem',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700, fontSize: '1.25rem' }}>
          Kumarda Contacts
        </Link>
      </div>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
            👤 {user.full_name || user.username}
          </span>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '0.4rem 0.85rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
