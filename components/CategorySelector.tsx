'use client';

import { useState, useRef } from 'react';
import { WP_CATEGORIES } from '@/lib/categories';

interface Props {
  value: string; // comma-separated IDs e.g. "257, 274, 275"
  onSave: (value: string) => Promise<void>;
}

export default function CategorySelector({ value, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(() => {
    const parsed = value
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
    return new Set(parsed);
  });
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function toggle(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);

    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const str = Array.from(next).sort((a, b) => a - b).join(', ');
      setSaving(true);
      await onSave(str);
      setSaving(false);
    }, 600);
  }

  const filtered = search
    ? WP_CATEGORIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : WP_CATEGORIES;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span>
          WP Categories
          {selected.size > 0 && (
            <span className="ml-1.5 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {selected.size}
            </span>
          )}
        </span>
        <span className="text-gray-400">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="mt-2 border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
            {filtered.map(cat => (
              <label
                key={cat.id}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(cat.id)}
                  onChange={() => toggle(cat.id)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-xs text-gray-700 flex-1">{cat.name}</span>
                <span className="text-[10px] text-gray-300 tabular-nums">{cat.id}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 px-3 py-3 text-center">No match</p>
            )}
          </div>

          {selected.size > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-[10px] text-gray-400 font-mono leading-relaxed break-all">
                {Array.from(selected).sort((a, b) => a - b).join(', ')}
              </p>
              {saving && <p className="text-[10px] text-gray-400 mt-1">Saving…</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
