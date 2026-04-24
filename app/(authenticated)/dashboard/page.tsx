import Link from 'next/link';
import { getAttentionQueue, getPipelineCounts } from '@/lib/airtable';
import ArticleCard from '@/components/ArticleCard';
import StatusBadge from '@/components/StatusBadge';
import { STATUS_GROUPS } from '@/lib/types';
import type { Status } from '@/lib/types';

const PIPELINE_GROUPS = [
  { label: 'In Progress', statuses: STATUS_GROUPS.inProgress },
  { label: 'Images',      statuses: STATUS_GROUPS.images },
  { label: 'Publishing',  statuses: STATUS_GROUPS.publishing },
  { label: 'Paused',      statuses: STATUS_GROUPS.paused },
];

export default async function DashboardPage() {
  let attentionItems: Awaited<ReturnType<typeof getAttentionQueue>> = [];
  let counts: Record<string, number> = {};
  let error: string | null = null;

  try {
    [attentionItems, counts] = await Promise.all([
      getAttentionQueue(),
      getPipelineCounts(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load pipeline data';
  }

  const totalActive = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalActive} articles in pipeline</p>
        </div>
        <Link
          href="/articles"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          All articles →
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700 font-medium">Airtable connection error</p>
          <p className="text-xs text-red-500 mt-0.5">{error}</p>
        </div>
      )}

      {/* Attention queue */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Needs attention</h2>
          {attentionItems.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {attentionItems.length}
            </span>
          )}
        </div>

        {attentionItems.length === 0 && !error ? (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-6 text-center">
            <p className="text-sm text-gray-400">Nothing needs your attention right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attentionItems.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      {/* Pipeline overview */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Pipeline</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PIPELINE_GROUPS.map(group => {
            const groupTotal = group.statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
            const activeStatuses = group.statuses.filter(s => (counts[s] ?? 0) > 0);

            return (
              <div key={group.label} className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-400 mb-1">{group.label}</p>
                <p className="text-3xl font-semibold text-gray-900 mb-3 tabular-nums">
                  {groupTotal}
                </p>
                <div className="space-y-1.5">
                  {activeStatuses.length === 0 ? (
                    <p className="text-xs text-gray-300">—</p>
                  ) : (
                    activeStatuses.map(status => (
                      <div key={status} className="flex items-center justify-between gap-2">
                        <StatusBadge status={status as Status} />
                        <span className="text-xs font-semibold text-gray-700 tabular-nums">
                          {counts[status]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
