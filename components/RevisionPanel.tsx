'use client';

import { useState } from 'react';

interface RevisionPanelProps {
  articleId: string;
  initialNotes: string;
  onStatusChange: (status: string) => void;
}

export default function RevisionPanel({ articleId, initialNotes, onStatusChange }: RevisionPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  async function saveNotes() {
    setSaving(true);
    await fetch(`/api/articles/${articleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'Revision Notes': notes }),
    });
    setSaving(false);
  }

  async function sendToRevision() {
    await saveNotes();
    await fetch(`/api/articles/${articleId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'needs-revision', 'Revision Notes': notes }),
    });
    onStatusChange('needs-revision');
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Revision Notes
      </label>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        onBlur={saveNotes}
        rows={5}
        placeholder="Describe what needs to be changed…"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
      <button
        onClick={sendToRevision}
        disabled={!notes.trim() || saving}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Send to Revision
      </button>
    </div>
  );
}
