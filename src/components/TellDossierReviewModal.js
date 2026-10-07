'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function TellDossierReviewModal({ isOpen, onClose, analysisResult, onCommitted }) {
  const [personOption, setPersonOption] = useState('matched'); // 'matched', 'existing', or 'new'
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [acceptedItems, setAcceptedItems] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (analysisResult) {
      const idRes = analysisResult.identity_resolution;
      if (idRes.decision === 'MATCH' || idRes.decision === 'PROBABLE_MATCH') {
        setPersonOption('existing');
        setSelectedContactId(idRes.matched_contact ? idRes.matched_contact.id : null);
      } else if (idRes.decision === 'AMBIGUOUS' || idRes.decision === 'CONFLICT') {
        setPersonOption(''); // User must explicitly choose
        setSelectedContactId(null);
      } else {
        setPersonOption('new');
        setSelectedContactId(null);
      }

      // Initialize editable state for review items
      const items = analysisResult.review_items;
      setAcceptedItems({
        contact_info: {
          name: items.contact_info.name.value,
          phone: items.contact_info.phone.value,
          email: items.contact_info.email.value,
          title: items.contact_info.title.value
        },
        organization: {
          company_name: items.organization.company_name.value,
          job_title: items.organization.job_title.value
        },
        how_we_met: {
          met_date: items.how_we_met.met_date.value,
          met_context: items.how_we_met.met_context.value,
          introduced_by_name: items.how_we_met.introduced_by_name.value,
          how_we_met_notes: items.how_we_met.how_we_met_notes.value
        },
        interaction: items.interaction ? {
          type: items.interaction.type.value,
          details: items.interaction.details.value,
          date: items.interaction.date.value
        } : null,
        notes: items.notes.value,
        sources: items.sources.map(s => s.value),
        commitments: items.commitments.map(c => ({
          type: c.type,
          title: c.title,
          details: c.details,
          due_time: c.due_time
        }))
      });
    }
  }, [analysisResult]);

  if (!isOpen || !analysisResult) return null;

  const idRes = analysisResult.identity_resolution;

  const handleCommit = async () => {
    try {
      setErrorMsg('');

      if ((idRes.decision === 'AMBIGUOUS' || idRes.decision === 'CONFLICT') && !personOption) {
        setErrorMsg('Ambiguous or conflicting identity requires selecting an existing person or New Person.');
        return;
      }

      if (personOption === 'existing' && !selectedContactId && idRes.matched_contact) {
        setSelectedContactId(idRes.matched_contact.id);
      }

      setSubmitting(true);

      const payload = {
        input_event_id: analysisResult.input_event_id,
        identity_decision: idRes.decision,
        target_person_option: personOption === 'new' ? 'new' : 'existing',
        target_contact_id: personOption === 'new' ? null : (selectedContactId || (idRes.matched_contact ? idRes.matched_contact.id : null)),
        accepted_items: acceptedItems
      };

      const res = await apiFetch('/tell-dossier/commit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (onCommitted) {
        onCommitted(res);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save Dossier data');
    } finally {
      setSubmitting(false);
    }
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'MATCH':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">MATCH (Confirmed)</span>;
      case 'PROBABLE_MATCH':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">PROBABLE MATCH</span>;
      case 'AMBIGUOUS':
        return <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-200">AMBIGUOUS (Select Contact)</span>;
      case 'CONFLICT':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">CONFLICT (Review Required)</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">NEW PERSON</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <span>What I Understood</span>
              {getDecisionBadge(idRes.decision)}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">Review and confirm extracted candidate facts before saving</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800 text-sm">

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Identity Resolution Header Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Person Resolution</h3>
            
            {idRes.evidence && idRes.evidence.length > 0 && (
              <ul className="text-xs text-slate-600 mb-3 space-y-1 list-disc pl-4">
                {idRes.evidence.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            )}

            {/* Target Person Selection */}
            <div className="space-y-2">
              {idRes.matched_contact && (
                <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-indigo-300">
                  <input
                    type="radio"
                    name="person_option"
                    checked={personOption === 'existing' && selectedContactId === idRes.matched_contact.id}
                    onChange={() => {
                      setPersonOption('existing');
                      setSelectedContactId(idRes.matched_contact.id);
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-900">
                      Link to Existing Contact: {idRes.matched_contact.first_name} {idRes.matched_contact.last_name}
                    </span>
                    <span className="text-xs text-gray-500 block">
                      {idRes.matched_contact.company_name ? `Company: ${idRes.matched_contact.company_name}` : ''} {idRes.matched_contact.primary_email ? `| Email: ${idRes.matched_contact.primary_email}` : ''}
                    </span>
                  </div>
                </label>
              )}

              {idRes.candidate_contacts && idRes.candidate_contacts.length > 1 && (
                <div className="mt-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Or choose from other matching candidates:</label>
                  <select
                    value={selectedContactId || ''}
                    onChange={(e) => {
                      setPersonOption('existing');
                      setSelectedContactId(Number(e.target.value));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                  >
                    <option value="">-- Select Contact --</option>
                    {idRes.candidate_contacts.map(c => (
                      <option key={c.contactId} value={c.contactId}>
                        {c.contactName} ({c.company || 'No Company'}) - Score: {c.score}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-indigo-300">
                <input
                  type="radio"
                  name="person_option"
                  checked={personOption === 'new'}
                  onChange={() => {
                    setPersonOption('new');
                    setSelectedContactId(null);
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-gray-900">Create New Person Record</span>
                  <span className="text-xs text-gray-500 block">Add as a brand new contact in Dossier</span>
                </div>
              </label>
            </div>
          </div>

          {/* Group 1: Contact Information */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center justify-between text-xs uppercase tracking-wider text-gray-500">
              <span>1. Contact Information</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">Full Name</label>
                <input
                  type="text"
                  value={acceptedItems.contact_info?.name || ''}
                  onChange={(e) => setAcceptedItems({ ...acceptedItems, contact_info: { ...acceptedItems.contact_info, name: e.target.value } })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">Phone Number</label>
                <input
                  type="text"
                  value={acceptedItems.contact_info?.phone || ''}
                  onChange={(e) => setAcceptedItems({ ...acceptedItems, contact_info: { ...acceptedItems.contact_info, phone: e.target.value } })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 9999999999"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">Email Address</label>
                <input
                  type="email"
                  value={acceptedItems.contact_info?.email || ''}
                  onChange={(e) => setAcceptedItems({ ...acceptedItems, contact_info: { ...acceptedItems.contact_info, email: e.target.value } })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. rahul@abc.com"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">Job Title</label>
                <input
                  type="text"
                  value={acceptedItems.contact_info?.title || ''}
                  onChange={(e) => setAcceptedItems({ ...acceptedItems, contact_info: { ...acceptedItems.contact_info, title: e.target.value } })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Group 2: Organization / Role */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider text-gray-500">
              2. Organization & Role
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">Company / Organization</label>
                <input
                  type="text"
                  value={acceptedItems.organization?.company_name || ''}
                  onChange={(e) => setAcceptedItems({ ...acceptedItems, organization: { ...acceptedItems.organization, company_name: e.target.value } })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. ABC Corp"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">Introduced By</label>
                <input
                  type="text"
                  value={acceptedItems.how_we_met?.introduced_by_name || ''}
                  onChange={(e) => setAcceptedItems({ ...acceptedItems, how_we_met: { ...acceptedItems.how_we_met, introduced_by_name: e.target.value } })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>
            </div>
          </div>

          {/* Group 3: Commitments */}
          {acceptedItems.commitments && acceptedItems.commitments.length > 0 && (
            <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4">
              <h4 className="font-bold text-indigo-950 mb-3 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>3. Commitments & Tasks ({acceptedItems.commitments.length})</span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-semibold">Auto Extracted</span>
              </h4>
              <div className="space-y-3">
                {acceptedItems.commitments.map((com, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500">Type</label>
                        <select
                          value={com.type}
                          onChange={(e) => {
                            const updated = [...acceptedItems.commitments];
                            updated[idx].type = e.target.value;
                            setAcceptedItems({ ...acceptedItems, commitments: updated });
                          }}
                          className="w-full text-xs border border-gray-200 rounded p-1.5"
                        >
                          <option value="follow_up">Follow Up</option>
                          <option value="expected_item">Expected Item</option>
                          <option value="appointment">Appointment</option>
                          <option value="reminder">Reminder</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-semibold text-gray-500">Task Title</label>
                        <input
                          type="text"
                          value={com.title}
                          onChange={(e) => {
                            const updated = [...acceptedItems.commitments];
                            updated[idx].title = e.target.value;
                            setAcceptedItems({ ...acceptedItems, commitments: updated });
                          }}
                          className="w-full text-xs border border-gray-200 rounded p-1.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group 4: Notes & Context */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="font-bold text-gray-900 mb-2 text-xs uppercase tracking-wider text-gray-500">
              4. Notes & Interaction Details
            </h4>
            <textarea
              rows={3}
              value={acceptedItems.notes || ''}
              onChange={(e) => setAcceptedItems({ ...acceptedItems, notes: e.target.value })}
              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCommit}
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            {submitting ? 'Saving to Dossier...' : 'Save All Accepted Items'}
          </button>
        </div>

      </div>
    </div>
  );
}
