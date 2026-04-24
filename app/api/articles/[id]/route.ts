import { NextRequest, NextResponse } from 'next/server';
import { getArticle, updateArticle } from '@/lib/airtable';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  return NextResponse.json(article);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const fields = await request.json();
  const article = await updateArticle(params.id, fields);
  return NextResponse.json(article);
}
