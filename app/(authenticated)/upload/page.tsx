import { getAwaitingImagesArticles } from '@/lib/airtable';
import ContributorUploadCard from '@/components/ContributorUploadCard';

export default async function UploadPage() {
  let articles: Awaited<ReturnType<typeof getAwaitingImagesArticles>> = [];
  let error: string | null = null;

  try {
    articles = await getAwaitingImagesArticles();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load queue';
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Upload Images</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {articles.length > 0
            ? `${articles.length} article${articles.length !== 1 ? 's' : ''} waiting for images`
            : 'Your image upload queue'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!error && articles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-12 text-center">
          <p className="text-sm font-medium text-gray-500">Nothing to upload right now</p>
          <p className="text-xs text-gray-400 mt-1">New assignments will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map(article => (
            <ContributorUploadCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
