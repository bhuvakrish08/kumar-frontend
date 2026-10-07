'use client';

export default function GlobalLoader({ text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '0.75rem',
      color: '#475569'
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        border: '3px solid #cbd5e1',
        borderTop: '3px solid #2563eb',
        borderRadius: '50%',
        animation: 'global-loader-spin 0.8s linear infinite'
      }} />
      <style jsx global>{`
        @keyframes global-loader-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{text}</span>
    </div>
  );
}
