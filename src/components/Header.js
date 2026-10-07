'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function Header() {
  const router = useRouter();

  async function handleLogout(e) {
    e.preventDefault();
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout warning:', err.message);
    } finally {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <header className="topbar">
      <Link href="/dashboard" className="brand-wrap">
        <div className="brand-icon">K</div>
        <div>
          <div className="brand">Kumarda Contacts</div>
          <div className="subtle">Executive Relationship Memory</div>
        </div>
      </Link>
      <nav className="nav">
        <Link className="btn primary" href="/contacts/new">
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
          <span>New Contact</span>
        </Link>
        <Link className="btn" href="/sources" title="Manage Source Tags">
          <span>🏷️ Sources</span>
        </Link>
        <button className="btn" type="button" onClick={handleLogout} title="Sign out of Dossier">
          Log Out
        </button>
      </nav>
    </header>
  );
}
