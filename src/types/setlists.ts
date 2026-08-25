import { SongLanguage, SongType, SongStatus, ScriptureReference, SongSection } from './songs';
import { TeamRole } from './team';

export type SetlistStatus = 'Draft' | 'Preparing' | 'Ready' | 'Completed' | 'Archived';

export type AssignmentStatus = 'Pending' | 'Confirmed' | 'Declined' | 'Needs Replacement';

export type ServiceType = 
  | 'Sunday Worship' 
  | 'Prayer Meeting' 
  | 'Youth Worship' 
  | 'Midweek Service' 
  | 'Communion' 
  | 'Special Event' 
  | 'Conference' 
  | 'Fellowship'
  | 'Other';

export type ServiceVisibility = 'Public' | 'Team Only' | 'Private';

export type WorshipFlowCategory = 
  | 'Call to Worship'
  | 'Opening Praise'
  | 'Celebration'
  | 'Thanksgiving'
  | 'Worship'
  | 'Prayer'
  | 'Offering'
  | 'Communion'
  | 'Response'
  | 'Preparation for the Word'
  | 'Closing';

export type ServiceItemType = 'Song' | 'Custom';

export interface SetlistSong {
  id: string;
  songId: string;
  order: number;
  selectedKey: string;
  category: WorshipFlowCategory;
  duration?: number; // in minutes
  transitionNote?: string;
  leaderNote?: string;
  musicianNotes?: string;
}

export interface ServiceItem {
  id: string;
  order: number;
  type: ServiceItemType;
  title: string;
  assignedPerson?: string;
  duration?: number;
  notes?: string;
  songId?: string; // Only if type is 'Song'
}

export interface ServiceAssignment {
  id: string;
  serviceId: string;
  memberId: string;
  role: TeamRole;
  status: AssignmentStatus;
  callTime?: string;
  notes?: string;
}

export interface WorshipSetlist {
  id: string;
  title: string;
  serviceDate: string;
  serviceTime: string;
  serviceType: ServiceType;
  worshipLeader: string; // Member ID
  theme?: string;
  scriptureReference?: string;
  notes?: string;
  status: SetlistStatus;
  visibility: ServiceVisibility;
  isPublic: boolean;
  songs: SetlistSong[];
  items: ServiceItem[];
  assignments: ServiceAssignment[];
  rehearsalDate?: string;
  rehearsalTime?: string;
  rehearsalLocation?: string;
  rehearsalNotes?: string;
  callTimes?: Record<string, string>; // Role to call time
  estimatedDuration?: number;
  createdAt: string;
  updatedAt: string;
}
