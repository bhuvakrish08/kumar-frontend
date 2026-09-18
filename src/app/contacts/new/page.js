'use client';
import Header from '@/components/Header';
import ContactForm from '@/components/ContactForm';

export default function NewContactPage() {
  return (
    <main className="shell">
      <Header />
      <div style={{ marginBottom: '24px' }}>
        <h1 className="name" style={{ fontSize: '32px', marginBottom: '4px' }}>Add New Contact</h1>
        <div className="subtle">Create a structured relationship memory record</div>
      </div>
      <ContactForm />
    </main>
  );
}
