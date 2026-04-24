import Link from 'next/link';
import { getArticles } from '@/lib/airtable';
import ArticleCard from '@/components/ArticleCard';

const FILTERS = [
  { label: 'All',               value: '' },
  { label: 'Draft ready',       value: 'draft-ready' },
  { label: 'Needs revision',    value: 'needs-revision' },
  { label: 'Needs enrichment',  value: 'needs-enrichment' },
  { label: 'Approved',          value: 'approved' },
  { label: 'Awaiting images',   value: 'awaiting-images' },
  { label: 'Images submitted',  value: 'images-submitted' },
  { label: 'WP Draft',          value: 'wp-draft' },
  { label: 'Published',         value: 'published' },
  { label: 'Error',             value: 'error' },
  { label: 'Backlog',           value: 'backlog' },
  { label: 'On hold',           value: 'on-hold' },
];

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const activeStatus = searchParams.status ?? '';

  let articles: Awaited<ReturnType<typeof getArticles>>['records'] = [];
  let error: string | null = null;

  try {
    const res = await getArticles({
      filterByFormula: activeStatus ? `{Status}='${activeStatus}'` : undefined,
      sort: [{ field: 'Last Modified', direction: 'desc' }],
    });
    articles = res.records;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load articles';
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Articles</h1>
          {!error && (
            <p className="text-sm text-gray-500 mt-0.5">
              {articles.length} article{articles.length !== 1 ? 's' : ''}
              {activeStatus ? ` · ${activeStatus}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(({ label, value }) => {
          const active = activeStatus === value;
          return (
            <Link
              key={value}
              href={value ? `/articles?status=${value}` : '/articles'}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-red-700 font-medium">Airtable error</p>
          <p className="text-xs text-red-500 mt-0.5">{error}</p>
        </div>
      )}

      {/* List */}
      {!error && articles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-10 text-center">
          <p className="text-sm text-gray-400">
            No articles{activeStatus ? ` with status "${activeStatus}"` : ' yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
