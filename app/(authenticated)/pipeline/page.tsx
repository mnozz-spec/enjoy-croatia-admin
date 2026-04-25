'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/types';

// ─── Pipeline step mapping ────────────────────────────────────────────────────

const STEPS = ['NLP Brief', 'Draft', 'Review', 'Images', 'Publish'];

function statusToStep(status: string): number {
  if (['nlp-pending', 'nlp-ready'].includes(status)) return 0;
  if (['brief-ready'].includes(status)) return 1;
  if (['draft-ready', 'needs-revision', 'needs-enrichment', 'awaiting-fact-check'].includes(status)) return 2;
  if (['approved', 'awaiting-images', 'images-submitted', 'image-approved'].includes(status)) return 3;
  if (['wp-draft', 'published'].includes(status)) return 4;
  return 0;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    'nlp-pending':         'Creating NeuronWriter analysis…',
    'nlp-ready':           'NLP brief ready',
    'brief-ready':         'Generating first draft…',
    'draft-ready':         'Ready for review',
    'needs-revision':      'Revision in progress…',
    'needs-enrichment':    'Enrichment in progress…',
    'awaiting-fact-check': 'Awaiting fact check',
    'approved':            'Approved — write image brief',
    'awaiting-images':     'Waiting for images',
    'images-submitted':    'Images submitted — review needed',
    'image-approved':      'Creating WordPress draft…',
    'wp-draft':            'WordPress draft ready',
    'published':           'Published',
    'error':               'Error',
  };
  return labels[status] ?? status;
}

function isAutomated(status: string): boolean {
  return ['nlp-pending', 'nlp-ready', 'brief-ready', 'needs-revision',
    'needs-enrichment', 'image-approved'].includes(status);
}

function needsEditorAction(status: string): boolean {
  return ['draft-ready', 'awaiting-fact-check', 'approved',
    'images-submitted', 'error'].includes(status);
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ status }: { status: string }) {
  const current = statusToStep(status);
  return (
    <div className="flex items-center gap-0 mt-2">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-full h-1 rounded-full ${done ? 'bg-gray-900' : active ? 'bg-amber-400' : 'bg-gray-100'}`} />
              <span className={`text-[9px] mt-1 truncate max-w-full ${active ? 'text-amber-600 font-semibold' : done ? 'text-gray-400' : 'text-gray-200'}`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="w-1 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, onAction }: {
  article: Article;
  onAction: () => void;
}) {
  const { fields, id } = article;
  const status = fields['Status'] ?? '';
  const [loading, setLoading] = useState<string | null>(null);

  async function patch(newStatus: string, extra?: Record<string, unknown>) {
    setLoading(newStatus);
    await fetch(`/api/articles/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, ...extra }),
    });
    setLoading(null);
    onAction();
  }

  const statusBg = needsEditorAction(status)
    ? 'border-amber-200 bg-amber-50'
    : status === 'error'
      ? 'border-red-200 bg-red-50'
      : 'border-gray-200 bg-white';

  return (
    <div className={`border rounded-xl p-4 transition-colors ${statusBg}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {fields['Title'] ?? fields['Keyword'] ?? id}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {fields['Voice'] && (
              <span className="text-xs text-gray-400">{fields['Voice']}</span>
            )}
            {fields['Revision Number'] != null && fields['Revision Number'] > 0 && (
              <span className="text-xs text-gray-300">rev {fields['Revision Number']}</span>
            )}
          </div>
        </div>
        <Link
          href={`/articles/${id}`}
          className="text-xs text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
        >
          Open →
        </Link>
      </div>

      {/* Step bar */}
      <StepBar status={status} />

      {/* Status message */}
      <div className="mt-3">
        {isAutomated(status) && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <p className="text-xs text-gray-500">{statusLabel(status)}</p>
          </div>
        )}

        {/* Editor action: draft-ready */}
        {status === 'draft-ready' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-700">{statusLabel(status)}</p>
            <div className="flex gap-2">
              <button
                onClick={() => patch('approved')}
                disabled={!!loading}
                className="flex-1 bg-green-600 text-white py-1.5 px-3 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                {loading === 'approved' ? 'Approving…' : 'Approve'}
              </button>
              <Link
                href={`/articles/${id}`}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-medium text-center hover:bg-gray-50 transition-colors"
              >
                Review draft
              </Link>
            </div>
          </div>
        )}

        {/* Editor action: awaiting-fact-check */}
        {status === 'awaiting-fact-check' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-700">{statusLabel(status)}</p>
            <button
              onClick={() => patch('approved')}
              disabled={!!loading}
              className="w-full bg-green-600 text-white py-1.5 px-3 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              {loading === 'approved' ? 'Approving…' : 'Facts verified — approve'}
            </button>
          </div>
        )}

        {/* Editor action: images-submitted */}
        {status === 'images-submitted' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-700">{statusLabel(status)}</p>
            <Link
              href={`/images/${id}`}
              className="block w-full bg-gray-900 text-white py-1.5 px-3 rounded-lg text-xs font-medium text-center hover:bg-gray-800 transition-colors"
            >
              Review images →
            </Link>
          </div>
        )}

        {/* Editor action: approved — write image brief */}
        {status === 'approved' && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-amber-700">{statusLabel(status)}</p>
            <Link
              href={`/articles/${id}`}
              className="block w-full bg-gray-900 text-white py-1.5 px-3 rounded-lg text-xs font-medium text-center hover:bg-gray-800 transition-colors"
            >
              Write image brief →
            </Link>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-red-700">Pipeline error</p>
            {fields['Error Log'] && (
              <p className="text-xs text-red-600 font-mono bg-red-50 rounded p-2 line-clamp-2">
                {fields['Error Log']}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => patch('brief-ready')}
                disabled={!!loading}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-1.5 px-2 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Reset to brief-ready
              </button>
              <button
                onClick={() => patch('approved')}
                disabled={!!loading}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-1.5 px-2 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Reset to approved
              </button>
            </div>
          </div>
        )}

        {/* Waiting states */}
        {['awaiting-images', 'wp-draft'].includes(status) && (
          <p className="text-xs text-gray-500">{statusLabel(status)}</p>
        )}
      </div>
    </div>
  );
}

// ─── FW3 launch form ──────────────────────────────────────────────────────────

function FW3Form({ onLaunched }: { onLaunched: () => void }) {
  const [keyword, setKeyword] = useState('');
  const [voice, setVoice] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function launch() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, voice: voice || undefined, priority: priority || undefined }),
      });
      if (!res.ok) throw new Error('Failed to create article');
      setKeyword('');
      setVoice('');
      setPriority('');
      onLaunched();
    } catch {
      setError('Failed to launch. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">FW3</p>
        <h2 className="text-sm font-semibold text-gray-900">Manual keyword</h2>
        <p className="text-xs text-gray-400 mt-0.5">Creates an Airtable record, triggers NeuronWriter analysis, then generates draft</p>
      </div>

      <div className="space-y-2.5">
        <input
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && launch()}
          placeholder="Keyword (e.g. best beaches in Hvar)"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={voice}
            onChange={e => setVoice(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
          >
            <option value="">Voice (optional)</option>
            <option value="couples">Couples</option>
            <option value="family">Family</option>
            <option value="solo">Solo</option>
            <option value="friends">Friends</option>
            <option value="active-hiking">Active / Hiking</option>
          </select>

          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
          >
            <option value="">Priority (optional)</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={launch}
        disabled={loading || !keyword.trim()}
        className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Launching…' : 'Launch FW3'}
      </button>
    </div>
  );
}

// ─── FW4 card ─────────────────────────────────────────────────────────────────

function FW4Card() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">FW4</p>
        <h2 className="text-sm font-semibold text-gray-900">NeuronWriter import</h2>
        <p className="text-xs text-gray-400 mt-0.5">Batch-imports all queries tagged &apos;import&apos; in NeuronWriter, creates Airtable records, then triggers WF1 for each</p>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-3">
        <p className="text-xs text-gray-500">
          FW4 is triggered manually in n8n — tag your NeuronWriter queries as <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-mono">import</code>, then run the workflow there. Articles will appear in the feed below automatically once they enter the pipeline.
        </p>
      </div>

      <a
        href="https://n8n.io"
        target="_blank"
        rel="noreferrer"
        className="block w-full text-center bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        Open n8n →
      </a>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/articles?filter=pipeline');
      const data = await res.json();
      setArticles(data.records ?? []);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    const interval = setInterval(fetchArticles, 20_000);
    return () => clearInterval(interval);
  }, [fetchArticles]);

  const needsAction = articles.filter(a => needsEditorAction(a.fields['Status'] ?? ''));
  const inProgress = articles.filter(a => !needsEditorAction(a.fields['Status'] ?? '') && a.fields['Status'] !== 'error');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-200 bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-400 mt-0.5">Launch workflows · monitor progress · take action</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <p className="text-xs text-gray-400">
              Updated {lastRefreshed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
          <button
            onClick={fetchArticles}
            className="text-xs font-medium text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8 max-w-5xl">

          {/* Launch panel */}
          <div className="grid grid-cols-2 gap-4">
            <FW3Form onLaunched={fetchArticles} />
            <FW4Card />
          </div>

          {/* Needs action */}
          {needsAction.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Needs your action ({needsAction.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {needsAction.map(a => (
                  <ArticleCard key={a.id} article={a} onAction={fetchArticles} />
                ))}
              </div>
            </div>
          )}

          {/* In progress */}
          {inProgress.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                In progress ({inProgress.length})
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {inProgress.map(a => (
                  <ArticleCard key={a.id} article={a} onAction={fetchArticles} />
                ))}
              </div>
            </div>
          )}

          {!loading && articles.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-12 text-center">
              <p className="text-sm text-gray-400">No articles in the pipeline right now.</p>
              <p className="text-xs text-gray-300 mt-1">Launch FW3 above or trigger FW4 in n8n to get started.</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">Loading pipeline…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
