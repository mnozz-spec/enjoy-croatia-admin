import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticle } from '@/lib/airtable';
import ImageApproval from '@/components/ImageApproval';

export default async function ImageApprovalPage({ params }: { params: { id: string } }) {
  let article: Awaited<ReturnType<typeof getArticle>>;

  try {
    article = await getArticle(params.id);
  } catch {
    notFound();
  }

  const { fields } = article;
  const candidates = fields['Image Candidates'] ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-200 bg-white shrink-0">
        <Link href="/images" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Images
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 mt-1 truncate">
          {fields['Title'] ?? fields['Keyword'] ?? params.id}
        </h1>
        {fields['Voice'] && (
          <p className="text-sm text-gray-500 mt-0.5">{fields['Voice']}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {/* Image brief */}
        {fields['Image Brief'] && (
          <div className="mb-8 max-w-2xl">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Image Brief
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg px-4 py-3">
              {fields['Image Brief']}
            </p>
          </div>
        )}

        {/* Source notes */}
        {fields['Image Source Notes'] && (
          <div className="mb-8 max-w-2xl">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Contributor Notes
            </h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              {fields['Image Source Notes']}
            </p>
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-10 text-center max-w-2xl">
            <p className="text-sm text-gray-400">No image candidates uploaded yet.</p>
          </div>
        ) : (
          <ImageApproval
            articleId={article.id}
            candidates={candidates}
            currentStatus={fields['Status']}
          />
        )}
      </div>
    </div>
  );
}
