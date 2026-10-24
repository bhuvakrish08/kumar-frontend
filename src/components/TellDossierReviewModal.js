'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function TellDossierReviewModal({ isOpen, onClose, analysisResult, onCommitted }) {
  const [personOption, setPersonOption] = useState('new'); // 'existing' or 'new'
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [polishedMemory, setPolishedMemory] = useState('');
  const [acceptedItems, setAcceptedItems] = useState({});
  const [fieldToggles, setFieldToggles] = useState({}); // field keys toggled on/off (accept/reject)
  const [approvedTransitions, setApprovedTransitions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [committedResult, setCommittedResult] = useState(null);
  const [activeTab, setActiveTab] = useState('review'); // 'review' or 'original'

  useEffect(() => {
    if (analysisResult) {
      const idRes = analysisResult.identity_resolution || {};
      const decision = idRes.decision || 'NEW_PERSON';

      if (decision === 'MATCH' || decision === 'PROBABLE_MATCH') {
        setPersonOption('existing');
        setSelectedContactId(idRes.matched_contact ? idRes.matched_contact.id : null);
      } else if (decision === 'AMBIGUOUS' || decision === 'CONFLICT') {
        setPersonOption(''); // User must choose explicitly
        setSelectedContactId(null);
      } else {
        setPersonOption('new');
        setSelectedContactId(null);
      }

      // Initialize Polished Memory
      const initialPolished = analysisResult.polished_memory ||
        analysisResult.extraction?.polishedMemory ||
        analysisResult.raw_content || '';
      setPolishedMemory(initialPolished);

      // Initialize Approved Transitions
      const transitions = analysisResult.temporal_analysis?.historyTransitions || [];
      const initApproved = {};
      transitions.forEach((t, i) => {
        initApproved[i] = Boolean(t.is_current);
      });
      setApprovedTransitions(initApproved);

      // Initialize review items with multi-tier extraction fallbacks
      const items = analysisResult.review_items || {};
      const contactInfo = items.contact_info || {};
      const org = items.organization || {};
      const howWeMet = items.how_we_met || {};
      const inter = items.interaction || null;
      const extPerson = analysisResult.extraction?.person || {};

      const nameVal = (typeof contactInfo.name === 'object' ? contactInfo.name?.value : contactInfo.name) || extPerson.name || '';
      const phoneVal = (typeof contactInfo.phone === 'object' ? contactInfo.phone?.value : contactInfo.phone) || extPerson.phone || '';
      const emailVal = (typeof contactInfo.email === 'object' ? contactInfo.email?.value : contactInfo.email) || extPerson.email || '';
      const titleVal = (typeof contactInfo.title === 'object' ? contactInfo.title?.value : contactInfo.title) ||
                       (typeof org.job_title === 'object' ? org.job_title?.value : org.job_title) ||
                       extPerson.professional_role || extPerson.title || '';
      const compVal = (typeof org.company_name === 'object' ? org.company_name?.value : org.company_name) || extPerson.organization || '';
      const introVal = (typeof howWeMet.introduced_by_name === 'object' ? howWeMet.introduced_by_name?.value : howWeMet.introduced_by_name) || extPerson.introducer || '';
      const metDateVal = (typeof howWeMet.met_date === 'object' ? howWeMet.met_date?.value : howWeMet.met_date) || extPerson.met_date || '';
      const metContextVal = (typeof howWeMet.met_context === 'object' ? howWeMet.met_context?.value : howWeMet.met_context) || extPerson.meeting_context || '';

      const rawCommitments = (Array.isArray(items.commitments) && items.commitments.length > 0)
        ? items.commitments
        : (Array.isArray(analysisResult.extraction?.commitments) ? analysisResult.extraction.commitments : []);

      setAcceptedItems({
        contact_info: {
          name: nameVal,
          phone: phoneVal,
          email: emailVal,
          title: titleVal
        },
        organization: {
          company_name: compVal,
          job_title: titleVal
        },
        how_we_met: {
          met_date: metDateVal,
          met_context: metContextVal,
          introduced_by_name: introVal,
          how_we_met_notes: metContextVal
        },
        interaction: inter ? {
          type: inter.type?.value || inter.type || 'Meeting',
          details: inter.details?.value || inter.details || initialPolished,
          date: inter.date?.value || (typeof inter.date === 'string' ? inter.date : '') || ''
        } : null,
        notes: items.notes?.value || items.notes || extPerson.notes || initialPolished,
        sources: Array.isArray(items.sources) && items.sources.length > 0
          ? items.sources.map(s => s.value || s)
          : (Array.isArray(analysisResult.extraction?.sources) ? analysisResult.extraction.sources : []),
        commitments: rawCommitments.map(c => ({
          type: c.type || 'follow_up',
          title: c.title || '',
          details: c.details || '',
          due_time: c.due_time || null,
          accepted: true
        }))
      });

      // Initialize field accept toggles
      setFieldToggles({
        name: Boolean(nameVal),
        phone: Boolean(phoneVal),
        email: Boolean(emailVal),
        title: Boolean(titleVal),
        company: Boolean(compVal),
        introduced_by: Boolean(introVal),
        met_context: Boolean(metContextVal),
        interaction: Boolean(inter || analysisResult.extraction?.interaction),
        notes: true
      });

      setCommittedResult(null);
      setErrorMsg('');
    }
  }, [analysisResult]);

  if (!isOpen || !analysisResult) return null;

  const idRes = analysisResult.identity_resolution || {};
  const decision = idRes.decision || 'NEW_PERSON';
  const matchedContact = idRes.matched_contact;
  const candidateContacts = idRes.candidate_contacts || [];
  const evidence = idRes.evidence || [];
  const temporal = analysisResult.temporal_analysis || {};

  const handleToggleField = (fieldKey) => {
    setFieldToggles(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleToggleCommitment = (index) => {
    setAcceptedItems(prev => {
      const list = [...(prev.commitments || [])];
      if (list[index]) {
        list[index].accepted = !list[index].accepted;
      }
      return { ...prev, commitments: list };
    });
  };

  const handleCommit = async () => {
    try {
      setErrorMsg('');

      // Require explicit choice on ambiguous/conflict
      if ((decision === 'AMBIGUOUS' || decision === 'CONFLICT') && (!personOption || (personOption === 'existing' && !selectedContactId))) {
        setErrorMsg('Ambiguous or conflicting identity requires selecting an existing person or choosing New Person.');
        return;
      }

      setSubmitting(true);

      const approvedTransList = (temporal.historyTransitions || []).filter((_, i) => approvedTransitions[i]);

      // Filter commitments by accepted toggle
      const activeCommitments = (acceptedItems.commitments || [])
        .filter(c => c.accepted)
        .map(c => ({
          type: c.type,
          title: c.title,
          details: c.details,
          due_time: c.due_time
        }));

      const payload = {
        input_event_id: analysisResult.input_event_id,
        candidate_fact_id: analysisResult.candidate_fact_id,
        identity_decision: decision,
        target_person_option: personOption === 'new' ? 'new' : 'existing',
        target_contact_id: personOption === 'new' ? null : (selectedContactId || (matchedContact ? matchedContact.id : null)),
        polished_memory: polishedMemory.trim(),
        accepted_items: {
          contact_info: {
            name: fieldToggles.name ? acceptedItems.contact_info?.name : null,
            phone: fieldToggles.phone ? acceptedItems.contact_info?.phone : null,
            email: fieldToggles.email ? acceptedItems.contact_info?.email : null,
            title: fieldToggles.title ? acceptedItems.contact_info?.title : null
          },
          organization: {
            company_name: fieldToggles.company ? acceptedItems.organization?.company_name : null,
            job_title: fieldToggles.title ? acceptedItems.organization?.job_title : null
          },
          how_we_met: {
            met_date: acceptedItems.how_we_met?.met_date || null,
            met_context: fieldToggles.met_context ? acceptedItems.how_we_met?.met_context : null,
            introduced_by_name: fieldToggles.introduced_by ? acceptedItems.how_we_met?.introduced_by_name : null,
            how_we_met_notes: acceptedItems.how_we_met?.how_we_met_notes || null
          },
          interaction: (fieldToggles.interaction && acceptedItems.interaction) ? {
            type: acceptedItems.interaction.type || 'Meeting',
            details: acceptedItems.interaction.details || polishedMemory,
            date: acceptedItems.interaction.date || null
          } : null,
          notes: fieldToggles.notes ? (acceptedItems.notes || polishedMemory) : polishedMemory,
          sources: acceptedItems.sources || [],
          commitments: activeCommitments,
          temporal_transitions: approvedTransList
        }
      };

      const res = await apiFetch('/tell-dossier/commit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setCommittedResult(res);
      if (onCommitted) {
        onCommitted(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save authoritative records. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto text-slate-900">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Review Memory & Candidate Facts</span>
                <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono uppercase">
                  DRIE Pipeline v0.2
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80">Review, edit, and confirm extracted information before saving to your authoritative database</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              title="Close without committing"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {committedResult && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900 shadow-sm animate-in fade-in">
            <div className="flex items-center space-x-3">
              <span className="text-xl">✅</span>
              <div>
                <h4 className="text-sm font-bold">Memory & Contact Saved Successfully!</h4>
                <p className="text-xs text-emerald-700">Authoritative records, provenance, and relationships have been committed.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {committedResult.contact_id && (
                <Link
                  href={`/contacts/${committedResult.contact_id}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  View Person Page →
                </Link>
              )}
              <button
                onClick={onClose}
                className="px-3 py-2 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        {!committedResult && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Identity Resolution Banner (Highest UI Priority) */}
            <div className="rounded-xl p-4 border shadow-sm transition">
              {decision === 'MATCH' && (
                <div className="bg-emerald-50 border-emerald-200 text-emerald-900 p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Existing Person Detected</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800">Match Confirmed</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-950">
                    Matches existing contact: <span className="underline">{matchedContact?.first_name} {matchedContact?.last_name}</span> {matchedContact?.company_name ? `(${matchedContact.company_name})` : ''}
                  </p>
                  {evidence.length > 0 && (
                    <div className="text-xs text-emerald-800 bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200">
                      <span className="font-semibold">Why this match:</span> {evidence.join('; ')}
                    </div>
                  )}
                  <div className="pt-2 flex items-center space-x-4 text-xs font-medium">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="personOption"
                        checked={personOption === 'existing'}
                        onChange={() => setPersonOption('existing')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Update existing contact profile</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer text-gray-600">
                      <input
                        type="radio"
                        name="personOption"
                        checked={personOption === 'new'}
                        onChange={() => setPersonOption('new')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Create as separate New Person</span>
                    </label>
                  </div>
                </div>
              )}

              {decision === 'PROBABLE_MATCH' && (
                <div className="bg-blue-50 border-blue-200 text-blue-900 p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Probable Match</span>
                    </div>
                    <span className="text-xs font-bold text-blue-800">Review Match</span>
                  </div>
                  <p className="text-sm font-bold text-blue-950">
                    Likely matches existing contact: <span className="underline">{matchedContact?.first_name} {matchedContact?.last_name}</span> {matchedContact?.company_name ? `(${matchedContact.company_name})` : ''}
                  </p>
                  {evidence.length > 0 && (
                    <div className="text-xs text-blue-800 bg-blue-100/60 p-2.5 rounded-lg border border-blue-200">
                      <span className="font-semibold">Why this match:</span> {evidence.join('; ')}
                    </div>
                  )}
                  <div className="pt-2 flex items-center space-x-4 text-xs font-medium">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="personOption"
                        checked={personOption === 'existing'}
                        onChange={() => setPersonOption('existing')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Update existing contact</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer text-gray-600">
                      <input
                        type="radio"
                        name="personOption"
                        checked={personOption === 'new'}
                        onChange={() => setPersonOption('new')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Create New Person instead</span>
                    </label>
                  </div>
                </div>
              )}

              {decision === 'AMBIGUOUS' && (
                <div className="bg-amber-50 border-amber-300 text-amber-900 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">Ambiguous Identity — Action Required</span>
                    </div>
                    <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">Select Candidate</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    Multiple contacts share this name in your Dossier. Please select the correct person or choose New Person:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {candidateContacts.map((c) => {
                      const cId = c.id || c.contactId;
                      const cName = c.contactName || `${c.first_name || ''} ${c.last_name || ''}`.trim();
                      const cComp = c.company_name || c.company || 'No company listed';
                      return (
                        <div
                          key={cId}
                          onClick={() => {
                            setPersonOption('existing');
                            setSelectedContactId(cId);
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 ${
                            personOption === 'existing' && selectedContactId === cId
                              ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400'
                              : 'bg-white border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="candidateSelect"
                            checked={personOption === 'existing' && selectedContactId === cId}
                            onChange={() => {}}
                            className="mt-1 text-amber-600 focus:ring-amber-500"
                          />
                          <div className="text-xs">
                            <p className="font-bold text-gray-900">{cName}</p>
                            <p className="text-gray-500">{cComp} {c.job_title ? `• ${c.job_title}` : ''}</p>
                            <p className="text-gray-400 text-[11px]">{c.mobile_phone || c.primary_phone || c.primary_email || ''}</p>
                          </div>
                        </div>
                      );
                    })}

                    <div
                      onClick={() => {
                        setPersonOption('new');
                        setSelectedContactId(null);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition flex items-center space-x-3 ${
                        personOption === 'new'
                          ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400'
                          : 'bg-white border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="candidateSelect"
                        checked={personOption === 'new'}
                        onChange={() => {}}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-gray-900">+ Create as New Person</p>
                        <p className="text-gray-500">Not any of the existing contacts above</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {decision === 'CONFLICT' && (
                <div className="bg-rose-50 border-rose-300 text-rose-900 p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800">Identity Conflict Detected</span>
                    </div>
                    <span className="text-xs font-bold text-rose-700">Requires Confirmation</span>
                  </div>
                  <p className="text-xs text-rose-800">
                    Contradictory evidence detected against existing records. {evidence.join('; ')}
                  </p>
                  <div className="pt-2 flex items-center space-x-4 text-xs font-medium">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="conflictOption"
                        checked={personOption === 'existing'}
                        onChange={() => setPersonOption('existing')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Override & Update {matchedContact?.first_name || 'Existing'}</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer text-gray-700">
                      <input
                        type="radio"
                        name="conflictOption"
                        checked={personOption === 'new'}
                        onChange={() => setPersonOption('new')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Treat as New Person</span>
                    </label>
                  </div>
                </div>
              )}

              {decision === 'NEW_PERSON' && (
                <div className="bg-slate-50 border-slate-200 text-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 block">New Person</span>
                      <span className="text-xs text-slate-600">No matching contacts found in your Dossier. Saving will establish a new relationship profile.</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">New Contact</span>
                </div>
              )}
            </div>

            {/* Preserved Original Memory vs Polished Memory */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>✨ Polished Natural-Language Memory</span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-normal">Editable</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'original' ? 'review' : 'original')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  {activeTab === 'original' ? 'Hide Original Input' : 'View Original Input'}
                </button>
              </div>

              {activeTab === 'original' && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 font-mono">
                  <span className="font-bold block text-[10px] uppercase text-amber-700 mb-1">Preserved Raw Input Event:</span>
                  "{analysisResult.raw_content}"
                </div>
              )}

              <textarea
                rows={2}
                value={polishedMemory}
                onChange={(e) => setPolishedMemory(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner resize-y"
                placeholder="Polished natural-language memory"
              />
              <p className="text-[11px] text-slate-500">
                Wording is polished for readability and saved to the person narrative. Factual values, uncertainty, and relative dates are preserved.
              </p>
            </div>

            {/* Temporal Employer Transition Alert (Scenario 4) */}
            {temporal.isTemporalEmployerChange && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>🔄 Temporal Career Transition Detected</span>
                  </span>
                  <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded font-bold">Historical Preserved</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded line-through">
                    {temporal.previousEmployer || 'Previous'}
                  </span>
                  <span>→</span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-300">
                    {temporal.newEmployer || acceptedItems.organization?.company_name || 'New Employer'}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800">
                  Historical employment will be archived in contact history without inventing effective dates. The new employer will become current upon save.
                </p>
              </div>
            )}

            {/* Extracted Structured Candidate Facts */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b pb-2">
                Structured Candidate Facts
              </h4>

              {/* Grid of Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Section 1: Identity & Name */}
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">1. Identity & Name</span>
                    <button
                      type="button"
                      onClick={() => handleToggleField('name')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                        fieldToggles.name ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500 line-through'
                      }`}
                    >
                      {fieldToggles.name ? 'Accepted' : 'Ignored'}
                    </button>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={acceptedItems.contact_info?.name || ''}
                      onChange={(e) => setAcceptedItems(prev => ({
                        ...prev,
                        contact_info: { ...prev.contact_info, name: e.target.value }
                      }))}
                      className="w-full text-xs font-semibold text-slate-900 bg-white border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* Section 2: Organization & Role */}
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">2. Organization & Role</span>
                    <button
                      type="button"
                      onClick={() => handleToggleField('company')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                        fieldToggles.company ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500 line-through'
                      }`}
                    >
                      {fieldToggles.company ? 'Accepted' : 'Ignored'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-gray-500 block mb-1">Company</label>
                      <input
                        type="text"
                        value={acceptedItems.organization?.company_name || ''}
                        onChange={(e) => setAcceptedItems(prev => ({
                          ...prev,
                          organization: { ...prev.organization, company_name: e.target.value }
                        }))}
                        className="w-full text-xs font-semibold text-slate-900 bg-white border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-500 block mb-1">Title / Role</label>
                      <input
                        type="text"
                        value={acceptedItems.contact_info?.title || acceptedItems.organization?.job_title || ''}
                        onChange={(e) => setAcceptedItems(prev => ({
                          ...prev,
                          contact_info: { ...prev.contact_info, title: e.target.value },
                          organization: { ...prev.organization, job_title: e.target.value }
                        }))}
                        className="w-full text-xs font-semibold text-slate-900 bg-white border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Contact Info */}
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">3. Contact Details</span>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => handleToggleField('phone')}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          fieldToggles.phone ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        Phone {fieldToggles.phone ? '✓' : '✗'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleField('email')}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          fieldToggles.email ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        Email {fieldToggles.email ? '✓' : '✗'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-gray-500 block mb-1">Phone</label>
                      <input
                        type="text"
                        value={acceptedItems.contact_info?.phone || ''}
                        onChange={(e) => setAcceptedItems(prev => ({
                          ...prev,
                          contact_info: { ...prev.contact_info, phone: e.target.value }
                        }))}
                        className="w-full text-xs font-semibold text-slate-900 bg-white border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-500 block mb-1">Email</label>
                      <input
                        type="email"
                        value={acceptedItems.contact_info?.email || ''}
                        onChange={(e) => setAcceptedItems(prev => ({
                          ...prev,
                          contact_info: { ...prev.contact_info, email: e.target.value }
                        }))}
                        className="w-full text-xs font-semibold text-slate-900 bg-white border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: How We Met & Introducer */}
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">4. How We Met & Context</span>
                    <button
                      type="button"
                      onClick={() => handleToggleField('introduced_by')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        fieldToggles.introduced_by ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      Introducer {fieldToggles.introduced_by ? '✓' : '✗'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-gray-500 block mb-1">Introduced By</label>
                      <input
                        type="text"
                        value={acceptedItems.how_we_met?.introduced_by_name || ''}
                        onChange={(e) => setAcceptedItems(prev => ({
                          ...prev,
                          how_we_met: { ...prev.how_we_met, introduced_by_name: e.target.value }
                        }))}
                        className="w-full text-xs font-semibold text-slate-900 bg-white border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-500 block mb-1">Met Date (Explicit)</label>
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={acceptedItems.how_we_met?.met_date || ''}
                        onChange={(e) => setAcceptedItems(prev => ({
                          ...prev,
                          how_we_met: { ...prev.how_we_met, met_date: e.target.value }
                        }))}
                        className="w-full text-xs font-semibold text-slate-900 bg-white border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Commitments & Follow-ups */}
              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-800">5. Commitments & Follow-ups</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                      {acceptedItems.commitments?.length || 0} extracted
                    </span>
                  </div>
                </div>

                {(!acceptedItems.commitments || acceptedItems.commitments.length === 0) ? (
                  <p className="text-xs text-gray-400 italic">No actionable commitments or reminders detected in this memory.</p>
                ) : (
                  <div className="space-y-2">
                    {acceptedItems.commitments.map((com, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between transition ${
                          com.accepted ? 'bg-purple-50/50 border-purple-200' : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={Boolean(com.accepted)}
                            onChange={() => handleToggleCommitment(idx)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block">{com.title}</span>
                            <span className="text-gray-500 text-[11px]">Type: {com.type} {com.due_time ? `• Due: ${com.due_time}` : ''}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleCommitment(idx)}
                          className="text-[11px] font-semibold text-purple-700 hover:text-purple-900"
                        >
                          {com.accepted ? 'Accept ✓' : 'Reject ✗'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center space-x-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

          </div>
        )}

        {/* Footer Controls */}
        {!committedResult && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition flex items-center space-x-1"
            >
              <span>← Return to Input without Saving</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCommit}
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-lg disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving Authoritative Records...</span>
                  </>
                ) : (
                  <span>Approve & Remember Contact →</span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
