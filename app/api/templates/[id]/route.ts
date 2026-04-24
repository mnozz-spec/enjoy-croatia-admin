import { NextRequest, NextResponse } from 'next/server';
import { getTemplate, updateTemplate } from '@/lib/airtable';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const template = await getTemplate(params.id);
  return NextResponse.json(template);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const fields = await request.json();
  const template = await updateTemplate(params.id, fields);
  return NextResponse.json(template);
}
