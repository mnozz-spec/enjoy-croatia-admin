import { getArticles } from '@/lib/airtable';
import type { Status } from '@/lib/types';

const STATUS_COLOR: Record<string, string> = {
  'draft-ready':        'bg-amber-400',
  'needs-revision':     'bg-red-400',
  'needs-enrichment':   'bg-orange-400',
  'awaiting-fact-check':'bg-yellow-400',
  'approved':           'bg-green-400',
  'awaiting-images':    'bg-indigo-400',
  'images-submitted':   'bg-blue-400',
  'image-approved':     'bg-violet-400',
  'wp-draft':           'bg-gray-400',
  'published':          'bg-gray-600',
  'brief-ready':        'bg-sky-400',
  'backlog':            'bg-gray-300',
  'on-hold':            'bg-gray-300',
  'error':              'bg-red-500',
  'rejected':           'bg-gray-200',
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function HealthPage() {
  let error: string | null = null;
  let articles: Awaited<ReturnType<typeof getArticles>>['records'] = [];

  try {
    const res = await getArticles({
      fields: ['Status', 'Revision Number', 'Created', 'Published Date'],
      maxRecords: 1000,
    });
    articles = res.records;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load data';
  }

  // ── Compute stats ────────────────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const total = articles.length;
  const published = articles.filter(a => a.fields['Status'] === 'published').length;
  const errors = articles.filter(a => a.fields['Status'] === 'error').length;
  const thisMonth = articles.filter(a => (a.fields['Created'] ?? '') >= monthStart).length;

  const revisionNums = articles
    .map(a => a.fields['Revision Number'] ?? 0)
    .filter(n => n > 0);
  const avgRevisions = revisionNums.length
    ? (revisionNums.reduce((a, b) => a + b, 0) / revisionNums.length).toFixed(1)
    : '—';

  // ── Claude API cost estimate ─────────────────────────────────────────────────
  // Based on claude-sonnet-4 pricing: $3/M input, $15/M output tokens
  // WF1 (first draft):  ~2k input + ~2.7k output ≈ $0.047/article
  // WF2 (revision):     ~5k input + ~2.7k output ≈ $0.056/revision pass
  // WF5 (metadata):     ~3k input + ~0.3k output ≈ $0.014/article
  const COST_WF1 = 0.047;
  const COST_WF2 = 0.056;
  const COST_WF5 = 0.014;

  const articlesThisMonth = articles.filter(a => (a.fields['Created'] ?? '') >= monthStart);
  const wf1Calls = articlesThisMonth.length;
  const wf2Calls = articlesThisMonth.reduce((sum, a) => {
    return sum + Math.max(0, (a.fields['Revision Number'] ?? 0) - 1);
  }, 0);
  const wf5Calls = articlesThisMonth.filter(a =>
    ['wp-draft', 'published'].includes(a.fields['Status'] ?? ''),
  ).length;
  const estimatedCost = wf1Calls * COST_WF1 + wf2Calls * COST_WF2 + wf5Calls * COST_WF5;

  // Status distribution
  const counts: Record<string, number> = {};
  for (const a of articles) {
    const s = a.fields['Status'] ?? 'unknown';
    counts[s] = (counts[s] ?? 0) + 1;
  }
  const sortedStatuses = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Health</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pipeline metrics — live from Airtable</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total articles" value={total} />
            <StatCard label="Published" value={published} sub={`${total ? Math.round((published / total) * 100) : 0}% of total`} />
            <StatCard label="Created this month" value={thisMonth} />
            <StatCard label="Avg revision cycles" value={avgRevisions} sub="articles with ≥1 revision" />
          </div>

          {/* Claude API cost estimate */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-gray-400">Estimated Claude API spend this month</p>
                <p className="text-3xl font-semibold text-gray-900 tabular-nums mt-1">
                  ${estimatedCost.toFixed(2)}
                </p>
              </div>
              <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase tracking-wide">
                estimate
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center border-t border-gray-100 pt-4">
              <div>
                <p className="text-lg font-semibold text-gray-800 tabular-nums">{wf1Calls}</p>
                <p className="text-xs text-gray-400 mt-0.5">drafts generated</p>
                <p className="text-xs text-gray-300">${(wf1Calls * COST_WF1).toFixed(2)} · WF1</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800 tabular-nums">{wf2Calls}</p>
                <p className="text-xs text-gray-400 mt-0.5">revision passes</p>
                <p className="text-xs text-gray-300">${(wf2Calls * COST_WF2).toFixed(2)} · WF2</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800 tabular-nums">{wf5Calls}</p>
                <p className="text-xs text-gray-400 mt-0.5">metadata generated</p>
                <p className="text-xs text-gray-300">${(wf5Calls * COST_WF5).toFixed(2)} · WF5</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-300 mt-3">
              Based on claude-sonnet-4 pricing · $3/M input, $15/M output · articles created this month only
            </p>
          </div>

          {/* Error alert */}
          {errors > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700">{errors} article{errors !== 1 ? 's' : ''} in error state</p>
                <p className="text-xs text-red-500 mt-0.5">Check the Error Log on each article for details</p>
              </div>
              <a
                href="/articles?status=error"
                className="text-xs font-medium text-red-700 underline underline-offset-2"
              >
                View →
              </a>
            </div>
          )}

          {/* Status distribution */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Status distribution</h2>

            {/* Bar */}
            <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 mb-5">
              {sortedStatuses.map(([status, count]) => (
                <div
                  key={status}
                  className={`${STATUS_COLOR[status] ?? 'bg-gray-300'} transition-all`}
                  style={{ width: `${(count / total) * 100}%` }}
                  title={`${status}: ${count}`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {sortedStatuses.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLOR[status] ?? 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700">{status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`${STATUS_COLOR[status] ?? 'bg-gray-300'} h-1.5 rounded-full`}
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 tabular-nums w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
