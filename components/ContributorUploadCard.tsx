'use client';

import { useState, useRef } from 'react';
import type { Article } from '@/lib/types';

interface ContributorUploadCardProps {
  article: Article;
}

type CardState = 'idle' | 'expanded' | 'uploading' | 'done' | 'error';

export default function ContributorUploadCard({ article }: ContributorUploadCardProps) {
  const [state, setState] = useState<CardState>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [sourceNotes, setSourceNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { fields } = article;
  const MAX_FILES = 5;

  function handleFiles(incoming: File[]) {
    const accepted = incoming.filter(f => f.type.startsWith('image/')).slice(0, MAX_FILES);
    setFiles(accepted);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  async function handleSubmit() {
    if (!files.length) return;
    setState('uploading');
    setErrorMsg('');

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (sourceNotes.trim()) formData.append('sourceNotes', sourceNotes);

    const res = await fetch(`/api/articles/${article.id}/images`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      setState('done');
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? 'Upload failed — please try again');
      setState('error');
    }
  }

  // ── Done state ──────────────────────────────────────────────────────────────
  if (state === 'done') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-5">
        <p className="text-sm font-semibold text-green-800">
          ✓ Images submitted for "{fields['Title'] ?? fields['Keyword']}"
        </p>
        <p className="text-xs text-green-600 mt-1">The editor will review your submission.</p>
      </div>
    );
  }

  // ── Idle / collapsed state ──────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {fields['Title'] ?? fields['Keyword'] ?? '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{fields['Voice']}</p>
            </div>
            <button
              onClick={() => setState('expanded')}
              className="shrink-0 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Upload images
            </button>
          </div>

          {fields['Image Brief'] && (
            <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-gray-500 mb-1">Image Brief</p>
              <p className="text-sm text-gray-700 line-clamp-3">{fields['Image Brief']}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Expanded / uploading / error state ─────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {fields['Title'] ?? fields['Keyword'] ?? '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{fields['Voice']}</p>
          </div>
          <button
            onClick={() => setState('idle')}
            className="shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Image brief */}
        {fields['Image Brief'] && (
          <div className="bg-gray-50 rounded-lg px-3 py-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Image Brief</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{fields['Image Brief']}</p>
          </div>
        )}

        {/* Drop zone */}
        <div>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <p className="text-sm font-medium text-gray-700">
              {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''} selected` : 'Drop images here or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Up to {MAX_FILES} images · JPG, PNG, WebP</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => handleFiles(Array.from(e.target.files ?? []))}
            />
          </div>

          {/* Preview grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {files.map((f, i) => (
                <div key={i} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Source / License Notes
          </label>
          <textarea
            value={sourceNotes}
            onChange={e => setSourceNotes(e.target.value)}
            rows={3}
            placeholder="Where did you find these images? Are they free to use?"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Error */}
        {state === 'error' && errorMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!files.length || state === 'uploading'}
          className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {state === 'uploading'
            ? 'Uploading…'
            : `Submit ${files.length || ''} image${files.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
