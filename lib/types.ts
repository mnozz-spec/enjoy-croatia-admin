export type Status =
  | 'backlog'
  | 'nlp-pending'
  | 'nlp-ready'
  | 'brief-ready'
  | 'draft-ready'
  | 'needs-revision'
  | 'needs-enrichment'
  | 'awaiting-fact-check'
  | 'approved'
  | 'awaiting-images'
  | 'images-submitted'
  | 'image-approved'
  | 'wp-draft'
  | 'published'
  | 'on-hold'
  | 'error'
  | 'rejected';

export type Voice = 'couples' | 'family' | 'solo' | 'friends' | 'active-hiking';

export type Category = 'destination' | 'safety' | 'planning' | 'tips' | 'logistics';

export type Priority = 'high' | 'medium' | 'low';

export type FactualRisk = 'low' | 'medium' | 'high';

export type Role = 'editor' | 'contributor';

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

export interface ArticleFields {
  // Core
  'Article ID'?: number;
  'Keyword'?: string;
  'Title'?: string;
  'Voice'?: Voice;
  'Category'?: Category;
  'Target Word Count'?: number;
  'Status'?: Status;
  'Priority'?: Priority;

  // NLP Brief
  'NLP Brief — H1 Terms'?: string;
  'NLP Brief — H2 Terms'?: string;
  'NLP Brief — Body Basic'?: string;
  'NLP Brief — Body Extended'?: string;
  'NLP Brief — Raw'?: string;
  'Special Instructions'?: string;

  // Draft
  'Current Draft HTML'?: string;
  'Current Draft Plain Text'?: string;
  'Revision Number'?: number;
  'Missing Terms'?: string;

  // Review
  'Revision Notes'?: string;
  'NW Score'?: number;
  'Factual Risk Level'?: FactualRisk;
  'Fact Verification Complete'?: boolean;
  'Contains VERIFY Markers'?: boolean;

  // Images
  'Image Candidates'?: AirtableAttachment[];
  'Selected Image'?: number;
  'Image Notes'?: string;
  'Manual Image'?: AirtableAttachment[];
  'Image Brief'?: string;
  'Image Source Notes'?: string;

  // Metadata
  'SEO Title'?: string;
  'Meta Description'?: string;
  'Slug'?: string;
  'Social Headline'?: string;

  // Publishing
  'WP Post URL'?: string;
  'WP Post ID'?: number;
  'Published Date'?: string;

  // System
  'Error Log'?: string;
  'Created'?: string;
  'Last Modified'?: string;
}

export interface Article {
  id: string;
  fields: ArticleFields;
}

export interface TemplateFields {
  'Template Name'?: string;
  'Prompt Text'?: string;
  'Active'?: boolean;
  'Version'?: number;
  'Article Type'?: string;
  'Risk Level'?: string;
  'Last Change Notes'?: string;
  'Last Updated'?: string;
}

export interface Template {
  id: string;
  fields: TemplateFields;
}

export interface RevisionHistoryFields {
  'Article'?: string[];
  'Revision Number'?: number;
  'Revision Notes'?: string;
  'Draft HTML'?: string;
  'Created'?: string;
}

export interface RevisionHistory {
  id: string;
  fields: RevisionHistoryFields;
}

export interface AirtableListResponse<T> {
  records: T[];
  offset?: string;
}

export interface SessionData {
  role?: Role;
  isLoggedIn: boolean;
}

// Status groups for dashboard column counts
export const STATUS_GROUPS = {
  inProgress: ['brief-ready', 'draft-ready', 'needs-revision', 'needs-enrichment', 'awaiting-fact-check'] as Status[],
  images: ['approved', 'awaiting-images', 'images-submitted', 'image-approved'] as Status[],
  publishing: ['wp-draft', 'published'] as Status[],
  paused: ['backlog', 'on-hold', 'rejected', 'error'] as Status[],
};

export const ATTENTION_STATUSES: Status[] = ['draft-ready', 'images-submitted', 'error'];
