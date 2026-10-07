'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function CommitmentsWidget({ contactId = null, refreshSignal = 0 }) {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN'); // 'OPEN' or 'ALL'

  const fetchCommitments = async () => {
    try {
      setLoading(true);
      let endpoint = `/commitments`;
      const params = [];
      if (contactId) params.push(`contact_id=${contactId}`);
      if (filter !== 'ALL') params.push(`status=${filter}`);
      if (params.length > 0) endpoint += `?${params.join('&')}`;

      const data = await apiFetch(endpoint);
      setCommitments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load commitments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, [contactId, filter, refreshSignal]);

  const toggleComplete = async (id) => {
    try {
      await apiFetch(`/commitments/${id}/complete`, { method: 'PATCH' });
      fetchCommitments();
    } catch (err) {
      alert('Failed to update commitment status: ' + err.message);
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'follow_up': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expected_item': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'appointment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reminder': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base font-bold text-gray-900">
            {contactId ? 'Contact Commitments & Reminders' : 'Active Commitments & Reminders'}
          </h3>
        </div>

        <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setFilter('OPEN')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${filter === 'OPEN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Open ({commitments.filter(c => c.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${filter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-sm text-gray-400">Loading commitments...</div>
      ) : commitments.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No {filter === 'OPEN' ? 'open' : ''} commitments recorded. Tell Dossier to create follow-ups automatically!
        </div>
      ) : (
        <div className="space-y-2">
          {commitments.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition flex items-start justify-between ${
                item.status === 'COMPLETED' ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={item.status === 'COMPLETED'}
                  onChange={() => toggleComplete(item.id)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getBadgeStyle(item.type)}`}>
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-semibold ${item.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {item.title}
                    </span>
                  </div>

                  {item.details && (
                    <p className="text-xs text-gray-600 mt-1">{item.details}</p>
                  )}

                  <div className="flex items-center space-x-3 mt-1.5 text-xs text-gray-400">
                    {item.first_name && !contactId && (
                      <Link href={`/contacts/${item.contact_id}`} className="text-indigo-600 hover:underline font-medium">
                        👤 {item.first_name} {item.last_name} {item.company_name ? `(${item.company_name})` : ''}
                      </Link>
                    )}
                    {item.due_time && (
                      <span className="flex items-center">
                        📅 Due: {new Date(item.due_time).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
