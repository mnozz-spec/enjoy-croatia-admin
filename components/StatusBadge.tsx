import type { Status } from '@/lib/types';

const STATUS_STYLES: Record<string, string> = {
  'draft-ready':        'bg-amber-100 text-amber-800',
  'needs-revision':     'bg-red-100 text-red-700',
  'needs-enrichment':   'bg-orange-100 text-orange-700',
  'awaiting-fact-check':'bg-yellow-100 text-yellow-700',
  'images-submitted':   'bg-blue-100 text-blue-700',
  'awaiting-images':    'bg-indigo-100 text-indigo-700',
  'image-approved':     'bg-violet-100 text-violet-700',
  'approved':           'bg-green-100 text-green-700',
  'wp-draft':           'bg-gray-100 text-gray-600',
  'published':          'bg-gray-100 text-gray-600',
  'backlog':            'bg-gray-100 text-gray-500',
  'on-hold':            'bg-gray-100 text-gray-500',
  'error':              'bg-red-100 text-red-700',
  'rejected':           'bg-gray-100 text-gray-400',
};

export default function StatusBadge({ status }: { status: Status }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
