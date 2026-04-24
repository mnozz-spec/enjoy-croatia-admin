import { NextRequest, NextResponse } from 'next/server';
import { addImageCandidates, setArticleStatus } from '@/lib/airtable';

async function uploadToBlob(file: File, path: string): Promise<string> {
  // In local dev without BLOB_READ_WRITE_TOKEN, return a stable placeholder
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const seed = encodeURIComponent(file.name);
    return `https://picsum.photos/seed/${seed}/1200/800`;
  }

  const { put } = await import('@vercel/blob');
  const blob = await put(path, file, { access: 'public' });
  return blob.url;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  const sourceNotes = formData.get('sourceNotes') as string | null;

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  if (files.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 });
  }

  const uploadedUrls: string[] = [];
  for (const file of files) {
    const url = await uploadToBlob(file, `candidates/${params.id}/${file.name}`);
    uploadedUrls.push(url);
  }

  await addImageCandidates(params.id, uploadedUrls, sourceNotes ?? undefined);
  const article = await setArticleStatus(params.id, 'images-submitted');

  return NextResponse.json(article);
}
