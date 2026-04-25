import type {
  Article,
  AirtableListResponse,
  ArticleFields,
  Template,
  TemplateFields,
  RevisionHistory,
  Status,
} from './types';

const BASE_URL = 'https://api.airtable.com/v0';
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const ARTICLES_TABLE = process.env.AIRTABLE_ARTICLES_TABLE_ID!;
const TEMPLATES_TABLE = process.env.AIRTABLE_TEMPLATES_TABLE_ID!;

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
    'Content-Type': 'application/json',
  };
}

async function airtableFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`Airtable ${res.status}: ${JSON.stringify(body)}`);
  }

  return res.json();
}

// ─── Articles ────────────────────────────────────────────────────────────────

export async function getArticles(params?: {
  filterByFormula?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  fields?: string[];
  maxRecords?: number;
  offset?: string;
}): Promise<AirtableListResponse<Article>> {
  const q = new URLSearchParams();

  if (params?.filterByFormula) q.set('filterByFormula', params.filterByFormula);
  if (params?.maxRecords) q.set('maxRecords', String(params.maxRecords));
  if (params?.offset) q.set('offset', params.offset);
  params?.fields?.forEach(f => q.append('fields[]', f));
  params?.sort?.forEach((s, i) => {
    q.set(`sort[${i}][field]`, s.field);
    q.set(`sort[${i}][direction]`, s.direction);
  });

  const qs = q.toString();
  return airtableFetch(`/${BASE_ID}/${ARTICLES_TABLE}${qs ? `?${qs}` : ''}`);
}

export async function getArticle(recordId: string): Promise<Article> {
  return airtableFetch(`/${BASE_ID}/${ARTICLES_TABLE}/${recordId}`);
}

export async function updateArticle(
  recordId: string,
  fields: Partial<ArticleFields>,
): Promise<Article> {
  return airtableFetch(`/${BASE_ID}/${ARTICLES_TABLE}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
}

export async function setArticleStatus(
  recordId: string,
  status: Status,
  extraFields?: Partial<ArticleFields>,
): Promise<Article> {
  return updateArticle(recordId, { Status: status, ...extraFields });
}

export async function createArticle(fields: Partial<ArticleFields>): Promise<Article> {
  return airtableFetch(`/${BASE_ID}/${ARTICLES_TABLE}`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
}

export async function deleteArticle(recordId: string): Promise<void> {
  await airtableFetch(`/${BASE_ID}/${ARTICLES_TABLE}/${recordId}`, { method: 'DELETE' });
}

// ─── Attention queue ─────────────────────────────────────────────────────────

export async function getAttentionQueue(): Promise<Article[]> {
  const res = await getArticles({
    filterByFormula: `OR({Status}='draft-ready',{Status}='images-submitted',{Status}='error')`,
    sort: [{ field: 'Created', direction: 'asc' }],
  });
  return res.records;
}

// ─── Pipeline counts ─────────────────────────────────────────────────────────

export async function getPipelineCounts(): Promise<Record<string, number>> {
  const res = await getArticles({
    fields: ['Status'],
    maxRecords: 1000,
  });

  const counts: Record<string, number> = {};
  for (const record of res.records) {
    const status = record.fields['Status'] ?? 'unknown';
    counts[status] = (counts[status] ?? 0) + 1;
  }
  return counts;
}

// ─── Image queue (contributor) ───────────────────────────────────────────────

export async function getAwaitingImagesArticles(): Promise<Article[]> {
  const res = await getArticles({
    filterByFormula: `{Status}='awaiting-images'`,
    sort: [{ field: 'Created', direction: 'asc' }],
    fields: ['Title', 'Voice', 'Image Brief', 'Status', 'Keyword'],
  });
  return res.records;
}

// ─── Image attachment upload ──────────────────────────────────────────────────
// Airtable requires a public URL — upload to Vercel Blob first, then PATCH here.

export async function addImageCandidates(
  recordId: string,
  urls: string[],
  sourceNotes?: string,
): Promise<Article> {
  const attachments = urls.map(url => ({ url }));
  return updateArticle(recordId, {
    'Image Candidates': attachments as never,
    ...(sourceNotes ? { 'Image Source Notes': sourceNotes } : {}),
  });
}

export async function approveImage(
  recordId: string,
  selectedIndex: number,
): Promise<Article> {
  return updateArticle(recordId, {
    'Selected Image': selectedIndex,
    Status: 'image-approved',
  });
}

// ─── Revision history ────────────────────────────────────────────────────────

export async function getRevisionHistory(recordId: string): Promise<RevisionHistory[]> {
  const q = new URLSearchParams();
  q.set('filterByFormula', `{Article}='${recordId}'`);
  q.set('sort[0][field]', 'Revision Number');
  q.set('sort[0][direction]', 'asc');

  const res = await airtableFetch<AirtableListResponse<RevisionHistory>>(
    `/${BASE_ID}/Revision History?${q.toString()}`,
  );
  return res.records;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<AirtableListResponse<Template>> {
  return airtableFetch(`/${BASE_ID}/${TEMPLATES_TABLE}?sort[0][field]=Template%20Name&sort[0][direction]=asc`);
}

export async function getTemplate(recordId: string): Promise<Template> {
  return airtableFetch(`/${BASE_ID}/${TEMPLATES_TABLE}/${recordId}`);
}

export async function updateTemplate(
  recordId: string,
  fields: Partial<TemplateFields>,
): Promise<Template> {
  return airtableFetch(`/${BASE_ID}/${TEMPLATES_TABLE}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
}

export async function createTemplate(fields: Partial<TemplateFields>): Promise<Template> {
  return airtableFetch(`/${BASE_ID}/${TEMPLATES_TABLE}`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
}
