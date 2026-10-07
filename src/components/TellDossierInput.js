'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import TellDossierReviewModal from './TellDossierReviewModal';

export default function TellDossierInput({ onDossierUpdated }) {
  const [rawText, setRawText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!rawText || !rawText.trim()) return;

    try {
      setErrorMsg('');
      setAnalyzing(true);
      const data = await apiFetch('/tell-dossier/analyze', {
        method: 'POST',
        body: JSON.stringify({ raw_content: rawText.trim() })
      });
      setAnalysisResult(data);
      setIsReviewOpen(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to analyze Dossier input');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExampleClick = (exampleText) => {
    setRawText(exampleText);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl shadow-xl p-6 mb-8 border border-indigo-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              Tell Dossier
            </h2>
            <p className="text-xs text-indigo-200/80">Type messy natural language notes, meetings, or contact details</p>
          </div>
        </div>

        {/* Future Voice Extensibility Button */}
        <button
          type="button"
          disabled
          title="Voice input coming soon in Sprint 3"
          className="opacity-50 cursor-not-allowed inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span>Voice (Soon)</span>
        </button>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-4">
        <div className="relative">
          <textarea
            rows={3}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g., I met Rahul from ABC today. His phone is 9999999999. He will send pricing tomorrow."
            className="w-full bg-slate-900/90 text-white placeholder-slate-400 border border-indigo-500/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none shadow-inner"
          />
        </div>

        {errorMsg && (
          <div className="text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/50 p-3 rounded-lg">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-indigo-300/70">
            <span className="font-semibold text-indigo-200">Examples:</span>
            <button
              type="button"
              onClick={() => handleExampleClick("I met Rahul from ABC today. His phone is 9999999999. He will send pricing tomorrow.")}
              className="hover:text-white underline transition truncate max-w-xs"
            >
              "I met Rahul from ABC today..."
            </button>
          </div>

          <button
            type="submit"
            disabled={analyzing || !rawText.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition disabled:opacity-50 flex items-center space-x-2"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing Language...</span>
              </>
            ) : (
              <span>Analyze & Review</span>
            )}
          </button>
        </div>
      </form>

      {/* Review Modal */}
      <TellDossierReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        analysisResult={analysisResult}
        onCommitted={(res) => {
          setRawText('');
          if (onDossierUpdated) onDossierUpdated(res);
        }}
      />
    </div>
  );
}
