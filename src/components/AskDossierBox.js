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
    "Who was the technology investor I met coming back from California?",
    "What is David's cell?",
    "Who owes me pricing?",
    "Who do I need to follow up with?",
    "Who introduced me to John?",
    "Tell me about Larry and whisky."
  ];

  const handleAsk = async (queryText) => {
    const targetQ = (queryText !== undefined ? queryText : query).trim();
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

  const handleClarificationSelect = (choice) => {
    // Re-query with specific choice context while keeping user's intent clear
    const refinedQuery = `${choice.name} ${query}`.trim();
    handleAsk(refinedQuery);
  };

  const primaryPhone = result?.primary_contact?.mobile_phone || result?.primary_contact?.primary_phone;
  const cleanPhone = primaryPhone ? primaryPhone.replace(/\D/g, '') : '';
  const primaryEmail = result?.primary_contact?.primary_email;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-gray-900">Ask Dossier</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Natural Language Retrieval
            </span>
          </div>
          <p className="text-xs text-gray-500">Query relationships, commitments, reachability, and meetings in ordinary English</p>
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
            placeholder="Ask anything... e.g. Who was the technology investor I met coming back from California?"
            className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-4 py-2.5 pr-24 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center space-x-1.5 shadow"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching...</span>
              </>
            ) : (
              <span>Ask →</span>
            )}
          </button>
        </div>

        {/* Quick Query Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {canonicalQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(q);
                handleAsk(q);
              }}
              className="text-[11px] font-medium bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-700 border border-gray-200 hover:border-purple-200 px-2.5 py-1 rounded-full transition truncate max-w-xs"
              title={q}
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
        <div className="mt-5 p-5 bg-gradient-to-br from-purple-50 via-white to-indigo-50/40 rounded-xl border border-purple-200 space-y-4 shadow-sm animate-in fade-in">
          
          {/* 1. Concise Answer First */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded border border-purple-200">
              Answer
            </span>
            <p className="text-sm font-bold text-gray-900 mt-2 leading-relaxed">{result.answer}</p>
          </div>

          {/* 2. Reasoning / Supporting Evidence */}
          {result.reason && (
            <p className="text-xs text-purple-950/80 bg-purple-50/70 p-3 rounded-lg border border-purple-100 leading-relaxed">
              💡 <span className="font-semibold text-purple-900">Supporting Evidence:</span> {result.reason}
            </p>
          )}

          {/* 3. Matched Person & Useful Actions */}
          {result.primary_contact && result.primary_contact.id && (
            <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Matched: {result.primary_contact.first_name} {result.primary_contact.last_name}
                </span>
                <span className="text-xs text-gray-500">
                  {result.primary_contact.job_title ? `${result.primary_contact.job_title} · ` : ''}
                  {result.primary_contact.company_name || 'No organization listed'}
                </span>
              </div>

              {/* Action Buttons: Call, Text, WhatsApp, Email, View */}
              <div className="flex flex-wrap items-center gap-1.5">
                {cleanPhone && (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                    title={`Call ${primaryPhone}`}
                  >
                    📞 Call
                  </a>
                )}
                {cleanPhone && (
                  <a
                    href={`sms:${cleanPhone}`}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                    title={`Text ${primaryPhone}`}
                  >
                    💬 SMS
                  </a>
                )}
                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-100 transition"
                    title={`WhatsApp ${primaryPhone}`}
                  >
                    WhatsApp
                  </a>
                )}
                {primaryEmail && (
                  <a
                    href={`mailto:${primaryEmail}`}
                    className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition"
                    title={`Email ${primaryEmail}`}
                  >
                    ✉️ Email
                  </a>
                )}
                <Link
                  href={`/contacts/${result.primary_contact.id}`}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  View Profile →
                </Link>
              </div>
            </div>
          )}

          {/* 4. Clarification Choices when multiple people match */}
          {result.clarification_choices && result.clarification_choices.length > 0 && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                Clarification Choices:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.clarification_choices.map((c, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleClarificationSelect(c)}
                    className="p-2.5 bg-white border border-amber-200 hover:border-amber-400 rounded-lg cursor-pointer transition text-xs shadow-2xs hover:bg-amber-50"
                  >
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="text-gray-500 text-[11px]">{c.company}</div>
                    <div className="text-amber-800 font-semibold text-[10px] mt-1">Select this person →</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Commitments linked to query */}
          {result.commitments && result.commitments.length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-purple-100 space-y-1.5">
              <span className="text-xs font-bold text-gray-700 block">Linked Commitments:</span>
              {result.commitments.map(c => (
                <div key={c.id} className="text-xs text-gray-700 flex items-center justify-between p-1.5 bg-gray-50 rounded">
                  <span className="font-medium">• {c.title} ({c.type})</span>
                  {c.due_time && <span className="text-gray-500 text-[11px]">Due: {new Date(c.due_time).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
