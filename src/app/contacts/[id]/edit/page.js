'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import ContactForm from '@/components/ContactForm';
import { apiFetch } from '@/lib/api';

export default function EditContactPage() {
  const params = useParams();
  const id = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiFetch(`/contacts/${id}`)
      .then(res => setData(res))
      .catch(err => setError(err.message || 'Failed to load contact'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="shell">
        <Header />
        <div className="card subtle" style={{ padding: '40px', textAlign: 'center' }}>
          Loading contact profile data...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="shell">
        <Header />
        <div className="card error">{error || 'Contact not found'}</div>
      </main>
    );
  }

  const contactName = [data.contact.first_name, data.contact.last_name].filter(Boolean).join(' ');

  return (
    <main className="shell">
      <Header />
      <div style={{ marginBottom: '24px' }}>
        <h1 className="name" style={{ fontSize: '32px', marginBottom: '4px' }}>
          Edit Contact: {contactName}
        </h1>
        <div className="subtle">Update information, meeting context, or notes for this contact</div>
      </div>
      <ContactForm contact={data.contact} sources={data.sources} />
    </main>
  );
}
