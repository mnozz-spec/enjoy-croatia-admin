'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Article, RevisionHistory, Status } from '@/lib/types';
import DraftPreview from './DraftPreview';
import NlpCoverage from './NlpCoverage';
import {
  countWords,
  getWordCountStatus,
  wordCountColor,
  detectVoiceMismatch,
  getAllVoiceMismatches,
  getTermCoverage,
  checkStructure,
} from '@/lib/nlp';

type Tab = 'draft' | 'nlp' | 'history';

// ─── Revision presets ─────────────────────────────────────────────────────────

const BASE_PRESETS = [
  {
    category: 'NLP & Keywords',
    options: [
      'Include all missing NLP terms naturally throughout the text',
      'Improve keyword placement in H2 subheadings',
      'Reduce keyword repetition across the article',
    ],
  },
  {
    category: 'Content',
    options: [
      'Add more specific local details and examples',
      'Strengthen the opening hook',
      'Improve the conclusion with a clear call to action',
      'Reduce repetitive phrasing',
      'Add a practical tips section',
    ],
  },
  {
    category: 'Tone',
    options: [
      'Make language more conversational and engaging',
      'Reduce overly promotional language',
    ],
  },
  {
    category: 'Structure',
    options: [
      'Add more descriptive subheadings',
      'Break up long paragraphs into shorter ones',
      'Improve flow and transitions between sections',
    ],
  },
  {
    category: 'Length',
    options: [
      'Expand content to reach the target word count',
      'Trim content to reduce overall word count',
    ],
  },
];

const VOICE_CHIP: Record<string, string> = {
  couples:       'Ensure language consistently addresses couples travelling together',
  solo:          'Ensure language consistently addresses solo travellers',
  family:        'Ensure language consistently addresses families with children',
  friends:       'Ensure language consistently addresses groups of friends',
  'active-hiking': 'Ensure language consistently addresses active hikers and outdoor enthusiasts',
};

function composeNotes(selected: string[], custom: string): string {
  const parts = [
    ...selected.map(s => `• ${s}`),
    custom.trim(),
  ].filter(Boolean);
  return parts.join('\n\n');
}

interface RevisionChipSelectorProps {
  voice: string;
  selected: string[];
  onToggle: (option: string) => void;
  custom: string;
  onCustomChange: (v: string) => void;
}

function RevisionChipSelector({
  voice,
  selected,
  onToggle,
  custom,
  onCustomChange,
}: RevisionChipSelectorProps) {
  const voiceChip = VOICE_CHIP[voice];

  const groups = [
    ...BASE_PRESETS.map(g =>
      voice && g.category === 'Tone'
        ? { ...g, options: voiceChip ? [voiceChip, ...g.options] : g.options }
        : g
    ),
  ];

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div key={group.category}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            {group.category}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.options.map(option => {
              const active = selected.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => onToggle(option)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors text-left ${
                    active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Additional notes
        </p>
        <textarea
          value={custom}
          onChange={e => onCustomChange(e.target.value)}
          rows={3}
          placeholder="Anything else…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>
    </div>
  );
}

// ─── Missing terms badge ──────────────────────────────────────────────────────

function MissingTermsBadge({ count, terms }: { count: number; terms: string[] }) {
  const [open, setOpen] = useState(false);
  const color = count === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${color} transition-colors`}
      >
        {count === 0 ? '✓ All terms present' : `${count} missing term${count !== 1 ? 's' : ''}`}
        {count > 0 && <span className="opacity-60">{open ? '▴' : '▾'}</span>}
      </button>
      {open && count > 0 && (
        <ul className="mt-2 space-y-1">
          {terms.map(t => (
            <li key={t} className="text-xs text-red-600 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Editorial review panel ───────────────────────────────────────────────────

type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';

function CheckRow({
  status,
  label,
  detail,
  sub,
}: {
  status: CheckStatus;
  label: string;
  detail: string;
  sub?: string[];
}) {
  const [open, setOpen] = useState(false);
  const icon = { pass: '✓', warn: '⚠', fail: '✗', info: '·' }[status];
  const color = {
    pass: 'text-green-600',
    warn: 'text-amber-600',
    fail: 'text-red-600',
    info: 'text-gray-400',
  }[status];
  const bg = {
    pass: 'bg-green-50 border-green-100',
    warn: 'bg-amber-50 border-amber-100',
    fail: 'bg-red-50 border-red-100',
    info: 'bg-gray-50 border-gray-100',
  }[status];

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className={`text-xs font-bold shrink-0 mt-0.5 ${color}`}>{icon}</span>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-gray-700">{label}</span>
            <span className={`text-xs ml-1.5 ${color}`}>{detail}</span>
          </div>
        </div>
        {sub && sub.length > 0 && (
          <button
            onClick={() => setOpen(o => !o)}
            className="text-xs text-gray-400 shrink-0"
          >
            {open ? '▴' : '▾'}
          </button>
        )}
      </div>
      {open && sub && sub.length > 0 && (
        <ul className="mt-2 space-y-1 pl-5">
          {sub.map((s, i) => (
            <li key={i} className="text-xs text-gray-600">"{s}"</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewPanel({ article, missingTerms }: { article: Article; missingTerms: string[] }) {
  const { fields } = article;
  const plainText  = fields['Current Draft Plain Text'] ?? '';
  const html       = fields['Current Draft HTML'] ?? '';
  const voice      = fields['Voice'] ?? '';
  const targetWC   = fields['Target Word Count'];

  const wordCount   = countWords(plainText);
  const wcStatus    = getWordCountStatus(wordCount, targetWC);
  const mismatches  = getAllVoiceMismatches(plainText, voice);
  const structure   = checkStructure(html);

  const wcDetail = targetWC
    ? `${wordCount.toLocaleString()} / ${targetWC.toLocaleString()} words`
    : `${wordCount.toLocaleString()} words (no target set)`;

  const wcCheck: CheckStatus =
    !targetWC ? 'info' : wcStatus === 'green' ? 'pass' : wcStatus === 'amber' ? 'warn' : 'fail';

  const nlpCheck: CheckStatus =
    missingTerms.length === 0 ? 'pass' : missingTerms.length <= 3 ? 'warn' : 'fail';

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Editorial Review
      </p>

      <CheckRow
        status={wcCheck}
        label="Word count"
        detail={wcDetail}
      />

      <CheckRow
        status={mismatches.length === 0 ? 'pass' : 'fail'}
        label="Voice consistency"
        detail={
          mismatches.length === 0
            ? `OK — ${voice}`
            : `${mismatches.length} mismatch${mismatches.length > 1 ? 'es' : ''} (${voice})`
        }
        sub={mismatches}
      />

      <CheckRow
        status={nlpCheck}
        label="NLP coverage"
        detail={
          missingTerms.length === 0
            ? 'All terms present'
            : `${missingTerms.length} missing term${missingTerms.length > 1 ? 's' : ''}`
        }
        sub={missingTerms}
      />

      <CheckRow
        status={structure.h2Count >= 3 ? 'pass' : structure.h2Count >= 1 ? 'warn' : 'fail'}
        label="H2 sections"
        detail={`${structure.h2Count} found${structure.h3Count > 0 ? `, ${structure.h3Count} H3` : ''}`}
      />

      <CheckRow
        status={structure.hasTipOrNote ? 'pass' : 'warn'}
        label="Tip / note boxes"
        detail={structure.hasTipOrNote ? 'Found' : 'None detected'}
      />

      <CheckRow
        status={structure.hasNumberedList ? 'pass' : 'info'}
        label="Numbered list"
        detail={structure.hasNumberedList ? 'Present' : 'Not used'}
      />

      <CheckRow
        status={fields['Fact Verification Complete'] ? 'pass' : 'warn'}
        label="Fact check"
        detail={fields['Fact Verification Complete'] ? 'Marked complete' : 'Not yet verified'}
      />
    </div>
  );
}

// ─── Action panel ─────────────────────────────────────────────────────────────

interface ActionPanelProps {
  article: Article;
  selectedPresets: string[];
  onTogglePreset: (option: string) => void;
  customNotes: string;
  onCustomNotesChange: (v: string) => void;
  imageBrief: string;
  setImageBrief: (v: string) => void;
  loading: string | null;
  onPatchStatus: (status: string, extra?: Record<string, string | number>) => Promise<void>;
  onSaveField: (field: string, value: string) => Promise<void>;
}

function ActionPanel({
  article,
  selectedPresets,
  onTogglePreset,
  customNotes,
  onCustomNotesChange,
  imageBrief,
  setImageBrief,
  loading,
  onPatchStatus,
  onSaveField,
}: ActionPanelProps) {
  const status = article.fields['Status'];
  const voice = article.fields['Voice'] ?? '';

  if (status === 'draft-ready') {
    const composed = composeNotes(selectedPresets, customNotes);
    const hasNotes = composed.trim().length > 0;

    return (
      <div className="space-y-4">
        <RevisionChipSelector
          voice={voice}
          selected={selectedPresets}
          onToggle={onTogglePreset}
          custom={customNotes}
          onCustomChange={onCustomNotesChange}
        />

        <div className="space-y-2 pt-1">
          <button
            onClick={() => onPatchStatus('approved')}
            disabled={!!loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {loading === 'approved' ? 'Approving…' : 'Approve'}
          </button>

          <button
            onClick={() => onPatchStatus('needs-revision', { 'Revision Notes': composed })}
            disabled={!!loading || !hasNotes}
            className="w-full bg-amber-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading === 'needs-revision' ? 'Sending…' : 'Send to Revision'}
          </button>

          <button
            onClick={() => onPatchStatus('needs-enrichment')}
            disabled={!!loading}
            className="w-full bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {loading === 'needs-enrichment' ? 'Sending…' : 'Send to Enrichment'}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'needs-revision') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4 text-center">
        <p className="text-sm font-medium text-amber-800">Revision in progress…</p>
        <p className="text-xs text-amber-600 mt-1">n8n will process this within 5 minutes</p>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Image Brief
          </label>
          <textarea
            value={imageBrief}
            onChange={e => setImageBrief(e.target.value)}
            onBlur={() => onSaveField('Image Brief', imageBrief)}
            rows={6}
            placeholder="Describe the ideal image — mood, subject, what to avoid…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => onPatchStatus('awaiting-images', { 'Image Brief': imageBrief })}
          disabled={!!loading || !imageBrief.trim()}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'awaiting-images' ? 'Sending…' : 'Send to Image Queue'}
        </button>
      </div>
    );
  }

  if (status === 'awaiting-images') {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-4 text-center">
        <p className="text-sm font-medium text-indigo-800">Waiting for images</p>
        <p className="text-xs text-indigo-600 mt-1">Contributor has been notified</p>
      </div>
    );
  }

  if (status === 'images-submitted') {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-center">
          <p className="text-sm font-medium text-blue-800">Images submitted</p>
          <p className="text-xs text-blue-600 mt-1">Ready for your review</p>
        </div>
        <Link
          href={`/images/${article.id}`}
          className="block w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-sm font-medium text-center hover:bg-gray-800 transition-colors"
        >
          Review images →
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-3">
          <p className="text-xs font-semibold text-red-700 mb-1">Error Log</p>
          <p className="text-xs text-red-600 whitespace-pre-wrap font-mono">
            {article.fields['Error Log'] ?? 'No details recorded'}
          </p>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => onPatchStatus('brief-ready')}
            disabled={!!loading}
            className="w-full bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Reset to brief-ready
          </button>
          <button
            onClick={() => onPatchStatus('approved')}
            disabled={!!loading}
            className="w-full bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Reset to approved
          </button>
        </div>
      </div>
    );
  }

  // All other statuses — read-only status indicator
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-4 text-center">
      <p className="text-xs text-gray-500">Status: <span className="font-medium text-gray-700">{status}</span></p>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab({ history }: { history: RevisionHistory[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-gray-400">No revision history yet.</p>;
  }

  return (
    <div className="space-y-4">
      {history.map(entry => (
        <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-700">
              Revision {entry.fields['Revision Number']}
            </span>
            {entry.fields['Created'] && (
              <span className="text-xs text-gray-400">
                {new Date(entry.fields['Created']).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            )}
          </div>
          {entry.fields['Revision Notes'] && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {entry.fields['Revision Notes']}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ArticleDetail({
  initialArticle,
  history,
}: {
  initialArticle: Article;
  history: RevisionHistory[];
}) {
  const [article, setArticle] = useState(initialArticle);
  const [tab, setTab] = useState<Tab>('draft');
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState(article.fields['Revision Notes'] ?? '');
  const [imageBrief, setImageBrief] = useState(article.fields['Image Brief'] ?? '');
  const [reviewing, setReviewing] = useState(false);

  function togglePreset(option: string) {
    setSelectedPresets(prev =>
      prev.includes(option) ? prev.filter(p => p !== option) : [...prev, option],
    );
  }

  const { fields } = article;
  const plainText = fields['Current Draft Plain Text'] ?? '';
  const voice = fields['Voice'] ?? '';

  const wordCount = countWords(plainText);
  const wcStatus = getWordCountStatus(wordCount, fields['Target Word Count']);
  const wcColor = wordCountColor(wcStatus);
  const voiceMismatch = detectVoiceMismatch(plainText, voice);

  const coverage = getTermCoverage(
    plainText,
    fields['NLP Brief — Body Basic'] ?? '',
    fields['NLP Brief — Body Extended'] ?? '',
  );
  const missingTerms = [
    ...coverage.basic.filter(t => !t.present).map(t => t.term),
    ...coverage.extended.filter(t => !t.present).map(t => t.term),
  ];

  async function patchStatus(newStatus: string, extra?: Record<string, string | number>) {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/articles/${article.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus as Status, ...extra }),
      });
      setArticle(await res.json());
    } finally {
      setLoading(null);
    }
  }

  async function saveField(field: string, value: string) {
    await fetch(`/api/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'draft', label: 'Draft' },
    { id: 'nlp', label: 'NLP' },
    { id: 'history', label: `History${history.length ? ` (${history.length})` : ''}` },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-1 px-8 border-b border-gray-200 bg-white shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-3 px-1 text-sm border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Draft tab */}
      {tab === 'draft' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: rendered draft */}
          <div className="flex-1 overflow-y-auto p-8">
            {fields['Current Draft HTML'] ? (
              <>
                <DraftPreview html={fields['Current Draft HTML']} />
                <p className={`mt-6 text-sm font-medium ${wcColor}`}>
                  {wordCount.toLocaleString()} words
                  {fields['Target Word Count']
                    ? ` — target ${fields['Target Word Count'].toLocaleString()}${wcStatus === 'green' ? ' ✓' : ''}`
                    : ''}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">No draft available yet.</p>
            )}
          </div>

          {/* Right: action panel / review panel */}
          <div className="w-72 shrink-0 border-l border-gray-200 overflow-y-auto p-5 space-y-5 bg-gray-50">

            {/* Toggle button */}
            <button
              onClick={() => setReviewing(r => !r)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                reviewing
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {reviewing ? '← Back to actions' : 'Editorial Review'}
            </button>

            {reviewing ? (
              <ReviewPanel article={article} missingTerms={missingTerms} />
            ) : (
              <>
                {voiceMismatch && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <p className="text-xs font-semibold text-red-700">⚠ Voice mismatch</p>
                    <p className="text-xs text-red-600 mt-0.5">{voiceMismatch}</p>
                  </div>
                )}

                <MissingTermsBadge count={missingTerms.length} terms={missingTerms} />

                <div className="border-t border-gray-200" />

                <ActionPanel
                  article={article}
                  selectedPresets={selectedPresets}
                  onTogglePreset={togglePreset}
                  customNotes={customNotes}
                  onCustomNotesChange={setCustomNotes}
                  imageBrief={imageBrief}
                  setImageBrief={setImageBrief}
                  loading={loading}
                  onPatchStatus={patchStatus}
                  onSaveField={saveField}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* NLP tab */}
      {tab === 'nlp' && (
        <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
          {plainText ? (
            <NlpCoverage basic={coverage.basic} extended={coverage.extended} />
          ) : (
            <p className="text-sm text-gray-400">No draft to analyse yet.</p>
          )}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
          <HistoryTab history={history} />
        </div>
      )}
    </div>
  );
}
