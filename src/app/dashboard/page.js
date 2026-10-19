'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import AddSourceModal from '@/components/AddSourceModal';
import TellDossierInput from '@/components/TellDossierInput';
import AskDossierBox from '@/components/AskDossierBox';
import CommitmentsWidget from '@/components/CommitmentsWidget';
import { apiFetch, getImageUrl } from '@/lib/api';

export default function DashboardPage() {
  const [contacts, setContacts] = useState([]);
  const [sources, setSources] = useState([]);
  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [refreshCommitmentsSignal, setRefreshCommitmentsSignal] = useState(0);

  async function loadData(q = '', sourceFilter = '') {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/contacts';
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (sourceFilter) params.append('source', sourceFilter);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const [contactsData, sourcesData] = await Promise.all([
        apiFetch(endpoint),
        apiFetch('/sources').catch(() => [])
      ]);

      setContacts(contactsData || []);
      setSources(sourcesData || []);
    } catch (err) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(search, activeSource);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadData(search, activeSource);
  }

  function handleSourceClick(sourceName) {
    const next = activeSource === sourceName ? '' : sourceName;
    setActiveSource(next);
    loadData(search, next);
  }

  return (
    <main className="shell">
      <Header />

      {/* Hero: Primary Action - Tell Dossier */}
      <section aria-label="Tell Dossier Memory Capture">
        <TellDossierInput
          onDossierUpdated={() => {
            loadData(search, activeSource);
            setRefreshCommitmentsSignal(prev => prev + 1);
          }}
        />
      </section>

      {/* Secondary Actions Grid: Ask Dossier & Open Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section aria-label="Ask Dossier Intelligence Retrieval">
          <AskDossierBox />
        </section>

        <section aria-label="Active Commitments and Reminders">
          <CommitmentsWidget refreshSignal={refreshCommitmentsSignal} />
        </section>
      </div>

      {/* Relationships Directory & Filter */}
      <section className="card" aria-label="Relationship Directory">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Relationships & Living Directory</h3>
            <p className="text-xs text-gray-500">
              {contacts.length} total contact{contacts.length === 1 ? '' : 's'} recorded with provenance and context
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/contacts/new"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition"
              title="Add a contact manually without AI extraction"
            >
              <span>+ Manual Add</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <form className="search mb-4" onSubmit={handleSearchSubmit}>
          <input
            name="q"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, company, SOURCE tag, city, introducer, or context..."
          />
          <button className="btn primary" type="submit">
            Search
          </button>
          {search && (
            <button
              className="btn"
              type="button"
              onClick={() => {
                setSearch('');
                loadData('', activeSource);
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* SOURCE Tags Bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Context & Source Tags:</span>
            <div className="flex items-center space-x-2">
              <button
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                type="button"
                onClick={() => setIsSourceModalOpen(true)}
              >
                + Add Source
              </button>
              <Link href="/sources" className="text-xs text-gray-500 hover:text-gray-700">
                Manage
              </Link>
            </div>
          </div>

          {sources.length > 0 ? (
            <div className="tags flex flex-wrap gap-1.5">
              {sources.map(s => (
                <span
                  key={s.id}
                  className={`tag cursor-pointer ${activeSource === s.name ? 'active' : ''}`}
                  onClick={() => handleSourceClick(s.name)}
                >
                  {s.name} ({s.contact_count})
                </span>
              ))}
              {activeSource && (
                <button
                  type="button"
                  className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 transition font-medium"
                  onClick={() => handleSourceClick('')}
                >
                  Clear filter ✕
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No source tags defined yet.</p>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500 italic">
            Loading relationships...
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <p className="text-sm font-semibold">No contacts found matching your criteria.</p>
            <p className="text-xs">Use "Tell Dossier" above to capture a memory or create a new contact manually.</p>
          </div>
        ) : (
          <div className="list divide-y divide-gray-100">
            {contacts.map(c => {
              const name = [c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ');
              const phone = c.mobile_phone || c.primary_phone;
              return (
                <Link
                  href={`/contacts/${c.id}`}
                  className="contact-row flex items-center justify-between p-3.5 hover:bg-slate-50/80 rounded-xl transition"
                  key={c.id}
                >
                  <div className="flex items-center space-x-3.5">
                    {c.photo_url ? (
                      <img
                        src={getImageUrl(c.photo_url)}
                        alt={name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-slate-200 text-indigo-800 font-bold flex items-center justify-center text-sm border border-indigo-200 shadow-sm">
                        {c.first_name ? c.first_name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition">{name}</span>
                        {c.introduced_by_name && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                            via {c.introduced_by_name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        {c.job_title && <span className="text-gray-700 font-medium">{c.job_title}</span>}
                        {c.job_title && c.company_name && <span>at</span>}
                        {c.company_name && <span className="font-semibold text-gray-800">{c.company_name}</span>}
                        {phone && <span className="text-gray-400">• {phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-3">
                    {c.source_names && (
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold hidden sm:inline-block">
                        {c.source_names}
                      </span>
                    )}
                    <span className="text-gray-400 text-xs">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Source Modal */}
      {isSourceModalOpen && (
        <AddSourceModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
          onSourceAdded={() => loadData(search, activeSource)}
        />
      )}
    </main>
  );
}
