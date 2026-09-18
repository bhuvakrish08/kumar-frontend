'use client';

export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      marginTop: '1.5rem',
      padding: '0.5rem'
    }}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange && onPageChange(page - 1)}
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid #cbd5e1',
          backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff',
          color: page <= 1 ? '#94a3b8' : '#334155',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem'
        }}
      >
        Previous
      </button>

      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange && onPageChange(page + 1)}
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid #cbd5e1',
          backgroundColor: page >= totalPages ? '#f1f5f9' : '#ffffff',
          color: page >= totalPages ? '#94a3b8' : '#334155',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem'
        }}
      >
        Next
      </button>
    </div>
  );
}
