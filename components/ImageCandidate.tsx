'use client';

import type { AirtableAttachment } from '@/lib/types';

interface ImageCandidateProps {
  attachment: AirtableAttachment;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
}

export default function ImageCandidate({ attachment, index, selected, onSelect }: ImageCandidateProps) {
  return (
    <button
      onClick={() => onSelect(index)}
      className={`w-full rounded-lg border-2 overflow-hidden transition-all text-left ${
        selected ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      {/* Hero crop preview 16:9 */}
      <div className="aspect-video bg-gray-100 overflow-hidden">
        <img
          src={attachment.thumbnails?.large?.url ?? attachment.url}
          alt={attachment.filename}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Thumbnail crop preview 1:1 */}
      <div className="p-2 flex gap-2 items-center">
        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 shrink-0">
          <img
            src={attachment.thumbnails?.small?.url ?? attachment.url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-xs text-gray-500 truncate">{attachment.filename}</p>
      </div>
    </button>
  );
}
