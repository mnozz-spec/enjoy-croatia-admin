import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticle, getRevisionHistory } from '@/lib/airtable';
import StatusBadge from '@/components/StatusBadge';
import ArticleDetail from '@/components/ArticleDetail';

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  let history: Awaited<ReturnType<typeof getRevisionHistory>> = [];

  const article = await getArticle(params.id).catch(() => notFound());

  // History table may not exist yet — failure is non-fatal
  try {
    history = await getRevisionHistory(params.id);
  } catch {
    history = [];
  }

  const { fields } = article;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-8 py-5 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href="/articles" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ← Articles
              </Link>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {fields['Title'] ?? fields['Keyword'] ?? params.id}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {fields['Status'] && <StatusBadge status={fields['Status']} />}
              {fields['Voice'] && (
                <span className="text-xs text-gray-500">{fields['Voice']}</span>
              )}
              {fields['Category'] && (
                <span className="text-xs text-gray-500">{fields['Category']}</span>
              )}
              {fields['Revision Number'] != null && (
                <span className="text-xs text-gray-400">rev {fields['Revision Number']}</span>
              )}
              {fields['NW Score'] != null && (
                <span className="text-xs text-gray-400">NW {fields['NW Score']}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="flex-1 overflow-hidden">
        <ArticleDetail initialArticle={article} history={history} />
      </div>
    </div>
  );
}
