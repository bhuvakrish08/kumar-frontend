'use client';

import { useState } from 'react';
import { apiFetch, apiStreamFetch } from '@/lib/api';
import TellDossierReviewModal from './TellDossierReviewModal';

export default function TellDossierInput({ onDossierUpdated }) {
  const [rawText, setRawText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const examples = [
    {
      label: 'Informal Yash Meeting',
      text: 'i met yash yesterday and he is a full stack developer and he will work for digiva remind me to call him tomorrow'
    },
    {
      label: 'Susan Chen (Scenario 1)',
      text: 'Met Susan Chen yesterday at dinner. She is VP International at XYZ Beauty. Michael introduced us. Her mobile is +1 201-555-1212. She is interested in Turkey. Remind me to call her next Tuesday.'
    },
    {
      label: 'Employer Change (Scenario 4)',
      text: 'John left IBM and joined Amazon.'
    }
  ];

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!rawText || !rawText.trim() || analyzing) return;

    try {
      setErrorMsg('');
      setAnalyzing(true);
      setProgress(5);
      setStageMessage('Initiating pipeline...');

      // Actual real-time progress stream from backend
      const data = await apiStreamFetch(
        '/tell-dossier/analyze',
        {
          method: 'POST',
          body: JSON.stringify({ raw_content: rawText.trim(), stream: true })
        },
        (event) => {
          if (typeof event.percent === 'number') {
            setProgress(event.percent);
          }
          if (event.message) {
            setStageMessage(event.message);
          }
        }
      );

      setProgress(100);
      setStageMessage('Analysis Complete!');

      // Brief delay so user sees actual 100% completion state
      await new Promise((res) => setTimeout(res, 350));

      setAnalysisResult(data);
      setIsReviewOpen(true);
      setProgress(0);
      setStageMessage('');
    } catch (err) {
      setProgress(0);
      setStageMessage('');
      setErrorMsg(err.message || 'Failed to analyze Dossier input. Please check connection and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-2xl shadow-xl p-6 mb-8 border border-indigo-500/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                Tell Dossier
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Google Gemini
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">Type informal sentences, meeting notes, or follow-ups. Gemini polishes your memory and extracts structured candidate facts.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-4">
        <div className="relative">
          <textarea
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. i met yash yesterday and he is a full stack developer and he will work for digiva remind me to call him tomorrow"
            className="w-full bg-slate-900/90 text-white placeholder-slate-400 border border-indigo-500/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none shadow-inner"
          />
          <div className="absolute right-3 bottom-3 text-[11px] text-slate-500 hidden sm:block">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400 font-mono text-[10px]">⌘/Ctrl + ↵</kbd>
          </div>
        </div>

        {errorMsg && (
          <div className="text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/60 p-3 rounded-lg flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button
              type="button"
              onClick={handleAnalyze}
              className="ml-3 px-2 py-1 bg-rose-800/50 hover:bg-rose-800 rounded text-[11px] font-bold text-white transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-indigo-300/80">
            <span className="font-semibold text-indigo-200 mr-1">Examples:</span>
            {examples.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRawText(ex.text)}
                className="bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-700/40 px-2.5 py-1 rounded-lg text-xs transition truncate max-w-[200px]"
                title={ex.text}
              >
                {ex.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={analyzing || !rawText.trim()}
            className="relative overflow-hidden px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center min-w-[220px] select-none"
          >
            {/* Background dynamic progress bar fill (0% to 100%) */}
            {analyzing && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-white/25 backdrop-blur-xs transition-all duration-150 ease-out border-r-2 border-white/60 shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                style={{ width: `${progress}%` }}
              />
            )}

            {/* Content with spinner and live percentage */}
            <div className="relative z-10 flex items-center space-x-2">
              {analyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                    <path className="opacity-95" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-semibold tracking-wide drop-shadow truncate max-w-[140px]" title={stageMessage}>
                    {progress < 100 ? (stageMessage || 'Processing...') : 'Ready!'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-black/35 text-[11px] font-mono font-extrabold text-white border border-white/25 shadow-inner">
                    {progress}%
                  </span>
                </>
              ) : (
                <span>Polish &amp; Review Facts &rarr;</span>
              )}
            </div>
          </button>
        </div>
      </form>

      {/* Review Modal */}
      {isReviewOpen && analysisResult && (
        <TellDossierReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          analysisResult={analysisResult}
          onCommitted={(res) => {
            setRawText('');
            setIsReviewOpen(false);
            if (onDossierUpdated) onDossierUpdated(res);
          }}
        />
      )}
    </div>
  );
}
