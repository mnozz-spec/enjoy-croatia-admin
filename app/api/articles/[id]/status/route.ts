import { NextRequest, NextResponse } from 'next/server';
import { setArticleStatus } from '@/lib/airtable';
import type { Status } from '@/lib/types';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { status, ...extraFields } = await request.json();

  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const article = await setArticleStatus(params.id, status as Status, extraFields);
  return NextResponse.json(article);
}
