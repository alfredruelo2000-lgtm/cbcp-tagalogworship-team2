import { ScriptureReference } from './songs';
import { TeamRole } from './team';

export type ResourceCategory = 
  | 'Worship Devotionals'
  | 'Biblical Worship'
  | 'Worship Leadership'
  | 'Musicianship'
  | 'Vocal Training'
  | 'Band Development'
  | 'Sound & Technical'
  | 'Multimedia'
  | 'Rehearsal Preparation'
  | 'Spiritual Formation'
  | 'Team Culture'
  | 'Songwriting'
  | 'Prayer';

export type ResourceType = 
  | 'Article'
  | 'Devotional'
  | 'Guide'
  | 'Training'
  | 'Video'
  | 'PDF'
  | 'Checklist'
  | 'Lesson';

export type ResourceStatus = 'Draft' | 'Published' | 'Archived';

export interface WorshipResource {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string; // HTML or Markdown content
  category: ResourceCategory;
  resourceType: ResourceType;
  author: string;
  coverImage?: string;
  scriptureReferences?: (ScriptureReference | string)[];
  tags: string[];
  ministryRoles: (TeamRole | 'All Team Members')[];
  readingTime?: number; // in minutes
  featured: boolean;
  status: ResourceStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
