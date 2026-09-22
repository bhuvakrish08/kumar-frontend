'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import ChangeCredentialsModal from './ChangeCredentialsModal';

export default function Header() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleLogout(e) {
    e.preventDefault();
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout warning:', err.message);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kumarda_token');
      }
      router.push('/');
      router.refresh();
    }
  }

  return (
    <>
      <header className="topbar">
        <Link href="/dashboard" className="brand-wrap">
          <div className="brand-icon">K</div>
          <div>
            <div className="brand">Kumarda’s Dossier</div>
            <div className="subtle">Every person who matters. All in one place.</div>
          </div>
        </Link>
        <nav className="nav">
          <Link className="btn primary" href="/contacts/new">
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
            <span>New Contact</span>
          </Link>
          <button
            className="btn"
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Change Password"
          >
            <span>🔑 Change Password</span>
          </button>
          <button className="btn" type="button" onClick={handleLogout} title="Sign out of Dossier">
            Log Out
          </button>
        </nav>
      </header>

      <ChangeCredentialsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
