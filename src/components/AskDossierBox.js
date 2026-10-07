'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function AskDossierBox() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const canonicalQueries = [
    "What is David's cell?",
    "Who do I need to follow up with?",
    "Who owes me pricing?",
    "Who introduced me to John?",
    "Who did I meet at IBM?",
    "Tell me about Larry and whisky."
  ];

  const handleAsk = async (queryText) => {
    const targetQ = (queryText || query).trim();
    if (!targetQ) return;

    try {
      setErrorMsg('');
      setLoading(true);
      setResult(null);

      const data = await apiFetch('/ask-dossier', {
        method: 'POST',
        body: JSON.stringify({ query: targetQ })
      });

      setResult(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to query Dossier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Ask Dossier</h3>
          <p className="text-xs text-gray-500">Query relationships, contacts, follow-ups, and meeting context in natural language</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="space-y-3"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything... e.g. Who owes me pricing?"
            className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 pr-24 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Ask'}
          </button>
        </div>

        {/* Quick Canonical Query Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {canonicalQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(q);
                handleAsk(q);
              }}
              className="text-[11px] font-medium bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-700 border border-gray-200 hover:border-purple-200 px-2.5 py-1 rounded-full transition"
            >
              "{q}"
            </button>
          ))}
        </div>
      </form>

      {errorMsg && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Answer Result Card */}
      {result && (
        <div className="mt-5 p-5 bg-gradient-to-br from-purple-50 to-indigo-50/40 rounded-xl border border-purple-200 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded border border-purple-200">
                Answer Summary
              </span>
              <p className="text-sm font-bold text-gray-900 mt-1.5">{result.answer}</p>
            </div>
          </div>

          {result.reason && (
            <p className="text-xs text-purple-900/80 bg-white/70 p-2.5 rounded-lg border border-purple-100">
              💡 <span className="font-semibold">Reasoning / Source Context:</span> {result.reason}
            </p>
          )}

          {result.primary_contact && result.primary_contact.id && (
            <div className="bg-white p-3 rounded-lg border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900">
                  Matched Contact: {result.primary_contact.first_name} {result.primary_contact.last_name}
                </span>
                {result.primary_contact.company_name && (
                  <span className="text-xs text-gray-500 block">{result.primary_contact.company_name}</span>
                )}
              </div>
              <Link
                href={`/contacts/${result.primary_contact.id}`}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold transition"
              >
                View Dossier →
              </Link>
            </div>
          )}

          {result.commitments && result.commitments.length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-purple-100 space-y-1">
              <span className="text-xs font-bold text-gray-700 block">Linked Commitments:</span>
              {result.commitments.map(c => (
                <div key={c.id} className="text-xs text-gray-600 flex items-center justify-between">
                  <span>• {c.title} ({c.type})</span>
                  {c.due_time && <span className="text-gray-400">Due: {new Date(c.due_time).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )}

          {result.alternatives && result.alternatives.length > 0 && (
            <div className="text-xs text-gray-600 pt-1">
              <span className="font-semibold text-gray-700">Alternative Matches: </span>
              {result.alternatives.map(a => `${a.first_name} ${a.last_name}`).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
