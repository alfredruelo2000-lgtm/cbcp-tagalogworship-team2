export type MediaType = 'Photo' | 'Video' | 'Audio' | 'Document';

export type MediaCategory = 
  | 'Worship Service'
  | 'Rehearsal'
  | 'Special Event'
  | 'Team Activity'
  | 'Training'
  | 'Ministry File'
  | 'Worship Night'
  | 'Testimony';

export type VisibilityLevel = 'Public' | 'Worship Team' | 'Leaders Only' | 'Private';

export interface MediaAlbum {
  id: string;
  title: string;
  description?: string;
  coverImageUrl: string;
  date: string;
  mediaCount: number;
  category: MediaCategory;
  featured: boolean;
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  mediaType: MediaType;
  fileUrl: string;
  thumbnailUrl?: string;
  category: MediaCategory;
  albumId?: string;
  eventDate: string;
  tags: string[];
  duration?: string; // For video/audio
  author?: string; // Uploader
  fileSize?: string;
  fileType?: string; // Extension
  visibility: VisibilityLevel;
  featured: boolean;
  relatedSongId?: string;
  relatedServiceId?: string;
  relatedResourceId?: string;
  createdAt: string;
}
