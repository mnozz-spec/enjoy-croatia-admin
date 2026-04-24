import { getTemplates } from '@/lib/airtable';
import PromptsEditor from '@/components/PromptsEditor';

export default async function PromptsPage() {
  let templates: Awaited<ReturnType<typeof getTemplates>>['records'] = [];
  let error: string | null = null;

  try {
    const res = await getTemplates();
    templates = res.records;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load templates';
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-5 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Prompts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Claude prompt templates — versioned</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : (
          <PromptsEditor initialTemplates={templates} />
        )}
      </div>
    </div>
  );
}
