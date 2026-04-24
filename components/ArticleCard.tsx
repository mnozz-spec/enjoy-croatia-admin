import Link from 'next/link';
import type { Article } from '@/lib/types';
import StatusBadge from './StatusBadge';

export default function ArticleCard({ article }: { article: Article }) {
  const { fields } = article;
  return (
    <Link
      href={`/articles/${article.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fields['Title'] ?? fields['Keyword'] ?? '—'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {fields['Voice']} · rev {fields['Revision Number'] ?? 0}
            {fields['NW Score'] ? ` · NW ${fields['NW Score']}` : ''}
          </p>
        </div>
        {fields['Status'] && <StatusBadge status={fields['Status']} />}
      </div>
      {fields['Contains VERIFY Markers'] && (
        <p className="mt-2 text-xs text-amber-600 font-medium">⚠ Contains VERIFY markers</p>
      )}
    </Link>
  );
}
