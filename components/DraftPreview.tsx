'use client';

interface DraftPreviewProps {
  html: string;
}

// Highlights [VERIFY: ...] markers in amber before rendering
function prepareHtml(raw: string): string {
  return raw.replace(
    /\[VERIFY:\s*(.*?)\]/g,
    '<mark class="bg-amber-100 text-amber-800 px-1 rounded not-prose font-medium">[VERIFY: $1]</mark>',
  );
}

export default function DraftPreview({ html }: DraftPreviewProps) {
  return (
    <div
      className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-blue-600"
      dangerouslySetInnerHTML={{ __html: prepareHtml(html) }}
    />
  );
}
