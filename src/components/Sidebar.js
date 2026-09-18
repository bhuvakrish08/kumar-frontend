'use client';

import Link from 'next/link';

export default function Sidebar({ activeItem = 'contacts' }) {
  const items = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { key: 'contacts', label: 'Contacts', href: '/contacts' },
    { key: 'new-contact', label: 'Add Contact', href: '/contacts/new' },
  ];

  return (
    <aside style={{
      width: '220px',
      backgroundColor: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      minHeight: 'calc(100vh - 60px)',
      padding: '1.25rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem'
    }}>
      {items.map((item) => {
        const isActive = activeItem === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            style={{
              display: 'block',
              padding: '0.6rem 0.85rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 400,
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              color: isActive ? '#1d4ed8' : '#334155',
              transition: 'all 0.15s ease'
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
