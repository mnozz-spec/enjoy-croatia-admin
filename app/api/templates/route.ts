import { NextRequest, NextResponse } from 'next/server';
import { getTemplates, createTemplate, updateTemplate } from '@/lib/airtable';

export async function GET() {
  const templates = await getTemplates();
  return NextResponse.json(templates);
}

// POST creates a new version of a template and deactivates the previous one
export async function POST(request: NextRequest) {
  const { name, prompt, version, deactivateId } = await request.json();

  if (!name || !prompt) {
    return NextResponse.json({ error: 'name and prompt are required' }, { status: 400 });
  }

  // Create new active version
  const template = await createTemplate({
    'Template Name': name,
    'Prompt Text': prompt,
    Active: true,
    Version: version ?? 1,
  });

  // Deactivate the previous version
  if (deactivateId) {
    await updateTemplate(deactivateId, { Active: false });
  }

  return NextResponse.json(template);
}
