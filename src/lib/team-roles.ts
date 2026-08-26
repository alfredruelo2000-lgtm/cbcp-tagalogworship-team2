/**
 * Canonical ministry roles used by the public Worship Team directory and by the
 * admin personnel forms. Legacy short codes (leader / vocalist / …) are mapped
 * onto these labels so filters, pills and badges always match.
 */
export const TEAM_ROLES = [
  'Pastor',
  'Worship Leader',
  'Worship Vocalist',
  'Musician',
  'Multimedia',
] as const;

export type TeamRoleLabel = (typeof TEAM_ROLES)[number];

const LEGACY_ROLE_MAP: Record<string, TeamRoleLabel> = {
  pastor: 'Pastor',
  'senior pastor': 'Pastor',
  leader: 'Worship Leader',
  'worship leader': 'Worship Leader',
  'song leader': 'Worship Leader',
  vocalist: 'Worship Vocalist',
  'worship vocalist': 'Worship Vocalist',
  singer: 'Worship Vocalist',
  musician: 'Musician',
  instrumentalist: 'Musician',
  multimedia: 'Multimedia',
  production: 'Multimedia',
  technical: 'Multimedia',
};

export function normalizeRole(role?: string | null): TeamRoleLabel | 'Team Member' {
  if (!role) return 'Team Member';
  const key = role.trim().toLowerCase();
  return LEGACY_ROLE_MAP[key] ?? ((TEAM_ROLES as readonly string[]).includes(role.trim())
    ? (role.trim() as TeamRoleLabel)
    : 'Team Member');
}

export const ROLE_SORT_WEIGHT: Record<string, number> = {
  Pastor: 0,
  'Worship Leader': 1,
  'Worship Vocalist': 2,
  Musician: 3,
  Multimedia: 4,
  'Team Member': 5,
};

export const MEMBER_STATUSES = [
  'Active',
  'Available',
  'Limited Availability',
  'On Break',
  'Inactive',
  'Archived',
] as const;

/** Statuses that are allowed to appear on the public directory. */
export const PUBLIC_VISIBLE_STATUSES = [
  'Active',
  'Available',
  'Limited Availability',
  'On Break',
] as const;

export function memberDisplayName(member: { public_name?: string | null; full_name?: string | null }) {
  return (member.public_name?.trim() || member.full_name?.trim() || 'Team Member');
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
