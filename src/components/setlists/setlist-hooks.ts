import { useQuery } from "@tanstack/react-query";
import { getSetlistPermissions, getSetlists, type Setlist } from "@/lib/db-setlists.functions";
import { useAuth } from "@/hooks/use-auth";

export const SETLIST_KEYS = {
  all: ["setlists"] as const,
  permissions: ["setlist-permissions"] as const,
};

export function useSetlists() {
  return useQuery({ queryKey: SETLIST_KEYS.all, queryFn: getSetlists, staleTime: 15_000 });
}

export function useSetlistPermissions() {
  return useQuery({ queryKey: SETLIST_KEYS.permissions, queryFn: getSetlistPermissions, staleTime: 60_000 });
}

/** Can the current user edit this setlist (own personal setlist, or a planner)? */
export function useSetlistAbilities() {
  const { user, isWorshipLeader } = useAuth();
  const { data: permissions } = useSetlistPermissions();

  const canEdit = (setlist?: Pick<Setlist, "owner_id" | "is_official"> | null) => {
    if (!setlist || !user) return false;
    if (isWorshipLeader) return true;
    if (setlist.is_official) return Boolean(permissions?.allowEditingOfficial) && setlist.owner_id === user.id;
    return setlist.owner_id === user.id;
  };

  const canDuplicate = (setlist?: Pick<Setlist, "owner_id" | "is_official" | "allow_public_duplicate"> | null) => {
    if (!setlist || !user) return false;
    if (isWorshipLeader) return true;
    if (setlist.is_official) return Boolean(permissions?.allowDuplicateOfficial) && setlist.allow_public_duplicate !== false;
    return setlist.owner_id === user.id;
  };

  const canCreate = Boolean(user) && (isWorshipLeader || permissions?.allowPublicCreation !== false);

  return { canEdit, canDuplicate, canCreate, permissions, user, isWorshipLeader };
}
