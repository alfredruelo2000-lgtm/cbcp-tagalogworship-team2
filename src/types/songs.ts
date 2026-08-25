export type SongStatus = 'Active' | 'Learning' | 'Inactive' | 'Archived';
export type SongType = 'Opening' | 'Praise' | 'Worship' | 'Response' | 'Communion' | 'Offering' | 'Closing' | 'Special Number';
export type SongLanguage = 'English' | 'Filipino/Tagalog' | 'Cebuano/Bisaya' | 'Other';
export type SongVisibility = 'Public' | 'Team Only' | 'Private';

export interface ChordLine {
  type: 'chords' | 'lyrics' | 'both';
  content: string;
}

export interface SongSection {
  type: string;
  label?: string;
  lines: ChordLine[];
}

export interface ScriptureReference {
  reference: string;
  notes?: string;
}

export interface WorshipSong {
  id: string;
  title: string;
  artist: string;
  songwriter?: string;
  defaultKey: string;
  bpm?: number;
  timeSignature?: string;
  language: SongLanguage;
  themes: string[];
  scriptureReferences: (ScriptureReference | string)[];
  songType: SongType;
  status: SongStatus;
  visibility: SongVisibility;
  isPublic: boolean;
  featured: boolean;
  lyrics?: string;
  chords?: string;
  copyrightNotes?: string;
  artworkUrl?: string;
  sections?: SongSection[];
  flow?: string[];
  worshipLeaderNotes?: string[];
  isFavorite?: boolean;
  lastUsed?: string;
  usageCount?: number;
  copyrightOwner?: string;
  copyrightYear?: number;
  ccliNumber?: string;
  publicDomain?: boolean;
  createdAt: string;
  updatedAt: string;
  audioUrl?: string;
  sheetMusicUrl?: string;
  externalResources?: {
    audioUrl?: string;
    sheetMusicUrl?: string;
    metronomeDefaultSound?: 'beep' | 'woodblock' | 'click';
    metronomeDefaultVolume?: number;
    [key: string]: any;
  };
}


