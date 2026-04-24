import Link from 'next/link';
import { getArticles } from '@/lib/airtable';
import StatusBadge from '@/components/StatusBadge';

export default async function ImagesPage() {
  let articles: Awaited<ReturnType<typeof getArticles>>['records'] = [];
  let error: string | null = null;

  try {
    const res = await getArticles({
      filterByFormula: `{Status}='images-submitted'`,
      sort: [{ field: 'Last Modified', direction: 'desc' }],
      fields: ['Title', 'Keyword', 'Voice', 'Status', 'Image Brief', 'Article ID'],
    });
    articles = res.records;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load';
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Images</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {articles.length} article{articles.length !== 1 ? 's' : ''} awaiting image review
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!error && articles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-10 text-center">
          <p className="text-sm text-gray-400">No images waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map(article => (
            <Link
              key={article.id}
              href={`/images/${article.id}`}
              className="flex items-start justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {article.fields['Title'] ?? article.fields['Keyword'] ?? '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{article.fields['Voice']}</p>
                {article.fields['Image Brief'] && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                    {article.fields['Image Brief']}
                  </p>
                )}
              </div>
              <StatusBadge status="images-submitted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
