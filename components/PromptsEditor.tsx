'use client';

import { useState } from 'react';
import type { Template } from '@/lib/types';

interface PromptsEditorProps {
  initialTemplates: Template[];
}

interface TemplateGroup {
  name: string;
  active: Template | null;
  history: Template[];
}

function groupTemplates(templates: Template[]): TemplateGroup[] {
  const map = new Map<string, Template[]>();

  for (const t of templates) {
    const name = t.fields['Template Name'] ?? 'Unnamed';
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(t);
  }

  return Array.from(map.entries()).map(([name, records]) => {
    const sorted = [...records].sort((a, b) => (b.fields['Version'] ?? 0) - (a.fields['Version'] ?? 0));
    return {
      name,
      active: sorted.find(t => t.fields['Active']) ?? sorted[0] ?? null,
      history: sorted.filter(t => !t.fields['Active']),
    };
  });
}

// ─── Single template group card ───────────────────────────────────────────────

function TemplateGroupCard({ group }: { group: TemplateGroup }) {
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState(group.active?.fields['Prompt Text'] ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const activeVersion = group.active?.fields['Version'] ?? 1;
  const hasChanges = prompt !== (group.active?.fields['Prompt Text'] ?? '');

  async function saveNewVersion() {
    setSaving(true);
    setSaved(false);

    await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: group.name,
        prompt,
        version: activeVersion + 1,
        deactivateId: group.active?.id,
      }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate">{group.name}</span>
          <span className="text-xs text-gray-400 shrink-0">v{activeVersion}</span>
          {group.active?.fields['Active'] && (
            <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded shrink-0">
              active
            </span>
          )}
        </div>
        <span className="text-gray-400 text-xs ml-4 shrink-0">{expanded ? '▴' : '▾'}</span>
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-4">
          {/* Prompt textarea */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Prompt — v{activeVersion}
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={16}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg resize-y font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              spellCheck={false}
            />
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={saveNewVersion}
              disabled={!hasChanges || saving}
              className="bg-gray-900 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : `Save as v${activeVersion + 1}`}
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">✓ Saved</span>
            )}
            {!hasChanges && !saving && (
              <span className="text-xs text-gray-400">No changes</span>
            )}
          </div>

          {/* Version history */}
          {group.history.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => setShowHistory(h => !h)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                {showHistory ? '▴ Hide' : '▾ Show'} version history ({group.history.length})
              </button>

              {showHistory && (
                <div className="mt-3 space-y-2">
                  {group.history.map(t => (
                    <div key={t.id} className="bg-gray-50 rounded-lg px-3 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-gray-600">
                          v{t.fields['Version'] ?? '?'}
                        </span>
                        {t.fields['Last Updated'] && (
                          <span className="text-xs text-gray-400">
                            {new Date(t.fields['Last Updated']).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                      <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono line-clamp-4">
                        {t.fields['Prompt Text']}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export default function PromptsEditor({ initialTemplates }: PromptsEditorProps) {
  const groups = groupTemplates(initialTemplates);

  if (groups.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-10 text-center max-w-2xl">
        <p className="text-sm text-gray-400">No templates found in the Templates table.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {groups.map(group => (
        <TemplateGroupCard key={group.name} group={group} />
      ))}
    </div>
  );
}
