'use client';

import { useState } from 'react';

export default function CommunicationStrip({ contact }) {
  const [selectedPhone, setSelectedPhone] = useState(null);

  if (!contact) return null;

  const phones = [];
  if (contact.mobile_phone) phones.push({ label: 'Mobile', number: contact.mobile_phone });
  if (contact.primary_phone && contact.primary_phone !== contact.mobile_phone) {
    phones.push({ label: 'Primary', number: contact.primary_phone });
  }

  const activePhone = selectedPhone || (phones.length > 0 ? phones[0].number : null);
  const cleanPhone = activePhone ? activePhone.replace(/\D/g, '') : '';
  const email = contact.primary_email || contact.work_email;

  if (!activePhone && !email) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions:</span>
        {phones.length > 1 && (
          <select
            value={activePhone}
            onChange={(e) => setSelectedPhone(e.target.value)}
            className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {phones.map((p, idx) => (
              <option key={idx} value={p.number}>
                {p.label}: {p.number}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Call Link */}
        {activePhone && (
          <a
            href={`tel:${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition"
            title={`Call ${activePhone}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Call</span>
          </a>
        )}

        {/* Text SMS Link */}
        {activePhone && (
          <a
            href={`sms:${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition"
            title={`SMS to ${activePhone}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Text</span>
          </a>
        )}

        {/* WhatsApp Link */}
        {activePhone && (
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-semibold transition"
            title={`WhatsApp ${activePhone}`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        )}

        {/* Email Link */}
        {email && (
          <a
            href={`mailto:${email}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold transition"
            title={`Email ${email}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email</span>
          </a>
        )}
      </div>
    </div>
  );
}
