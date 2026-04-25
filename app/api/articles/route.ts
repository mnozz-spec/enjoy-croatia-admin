import { NextRequest, NextResponse } from 'next/server';
import { getArticles, createArticle } from '@/lib/airtable';

const PIPELINE_STATUSES = [
  'nlp-pending', 'nlp-ready', 'brief-ready', 'draft-ready',
  'needs-revision', 'needs-enrichment', 'awaiting-fact-check',
  'approved', 'awaiting-images', 'images-submitted', 'image-approved',
  'wp-draft', 'error',
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filter = searchParams.get('filter');
  const status = searchParams.get('status');

  let filterByFormula: string | undefined;
  if (status) {
    filterByFormula = `{Status}='${status}'`;
  } else if (filter === 'attention') {
    filterByFormula = `OR({Status}='draft-ready',{Status}='images-submitted',{Status}='error')`;
  } else if (filter === 'pipeline') {
    filterByFormula = `OR(${PIPELINE_STATUSES.map(s => `{Status}='${s}'`).join(',')})`;
  }

  const records = await getArticles({
    filterByFormula,
    sort: [{ field: 'Created', direction: 'asc' }],
  });

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const { keyword, voice, priority } = await request.json();

  if (!keyword?.trim()) {
    return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
  }

  const article = await createArticle({
    Keyword: keyword.trim(),
    ...(voice ? { Voice: voice } : {}),
    ...(priority ? { Priority: priority } : {}),
    Status: 'nlp-pending',
  });

  return NextResponse.json(article, { status: 201 });
}
