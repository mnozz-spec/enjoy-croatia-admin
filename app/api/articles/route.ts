import { NextRequest, NextResponse } from 'next/server';
import { getArticles } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filter = searchParams.get('filter');
  const status = searchParams.get('status');

  let filterByFormula: string | undefined;
  if (status) {
    filterByFormula = `{Status}='${status}'`;
  } else if (filter === 'attention') {
    filterByFormula = `OR({Status}='draft-ready',{Status}='images-submitted',{Status}='error')`;
  }

  const records = await getArticles({
    filterByFormula,
    sort: [{ field: 'Created', direction: 'asc' }],
  });

  return NextResponse.json(records);
}
