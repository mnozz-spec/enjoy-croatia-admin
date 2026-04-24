'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AirtableAttachment, Status } from '@/lib/types';

interface ImageApprovalProps {
  articleId: string;
  candidates: AirtableAttachment[];
  currentStatus: Status | undefined;
}

export default function ImageApproval({ articleId, candidates, currentStatus }: ImageApprovalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(currentStatus === 'image-approved');
  const router = useRouter();

  async function handleApprove() {
    if (selected === null) return;
    setLoading(true);

    await fetch(`/api/articles/${articleId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      // Selected Image is 1-based per the Airtable schema
      body: JSON.stringify({ status: 'image-approved', 'Selected Image': selected + 1 }),
    });

    setDone(true);
    setLoading(false);
    router.refresh();
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-8 text-center max-w-2xl">
        <p className="text-sm font-semibold text-green-800">Image approved</p>
        <p className="text-xs text-green-600 mt-1">WF5 will publish to WordPress within 5 minutes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Select an image — {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((attachment, i) => (
            <CandidateCard
              key={attachment.id ?? i}
              attachment={attachment}
              index={i}
              selected={selected === i}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleApprove}
        disabled={selected === null || loading}
        className="bg-green-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? 'Approving…'
          : selected !== null
          ? `Approve image ${selected + 1} & trigger publishing`
          : 'Select an image first'}
      </button>
    </div>
  );
}

// ─── Candidate card ───────────────────────────────────────────────────────────

function CandidateCard({
  attachment,
  index,
  selected,
  onSelect,
}: {
  attachment: AirtableAttachment;
  index: number;
  selected: boolean;
  onSelect: (i: number) => void;
}) {
  const thumb = attachment.thumbnails?.large?.url ?? attachment.url;
  const small = attachment.thumbnails?.small?.url ?? attachment.url;

  return (
    <button
      onClick={() => onSelect(index)}
      className={`w-full rounded-xl border-2 overflow-hidden text-left transition-all ${
        selected
          ? 'border-green-500 shadow-md ring-2 ring-green-200'
          : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      {/* 16:9 hero preview */}
      <div className="aspect-video bg-gray-100 overflow-hidden">
        <img src={thumb} alt={attachment.filename} className="w-full h-full object-cover" />
      </div>

      {/* Bottom row: 1:1 thumbnail + filename + selection indicator */}
      <div className="flex items-center gap-2.5 p-2.5">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
          <img src={small} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 truncate">{attachment.filename}</p>
          <p className="text-xs text-gray-400">
            {attachment.width && attachment.height
              ? `${attachment.width}×${attachment.height}`
              : `${(attachment.size / 1024).toFixed(0)} KB`}
          </p>
        </div>
        <div
          className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
            selected ? 'bg-green-500 border-green-500' : 'border-gray-300'
          }`}
        />
      </div>
    </button>
  );
}
