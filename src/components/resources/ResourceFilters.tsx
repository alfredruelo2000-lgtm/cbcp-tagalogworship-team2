import { ResourceCategory, ResourceType } from "@/types/resources";
import { TeamRole } from "@/types/team";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ResourceFiltersProps {
  selectedCategory: ResourceCategory | 'All';
  onCategoryChange: (category: ResourceCategory | 'All') => void;
  selectedType: ResourceType | 'All';
  onTypeChange: (type: ResourceType | 'All') => void;
  selectedRole: TeamRole | 'All Team Members' | 'All';
  onRoleChange: (role: TeamRole | 'All Team Members' | 'All') => void;
}

const CATEGORIES: (ResourceCategory | 'All')[] = [
  'All',
  'Worship Devotionals',
  'Biblical Worship',
  'Worship Leadership',
  'Musicianship',
  'Vocal Training',
  'Band Development',
  'Sound & Technical',
  'Multimedia',
  'Spiritual Formation',
  'Team Culture'
];

const TYPES: (ResourceType | 'All')[] = [
  'All', 'Article', 'Devotional', 'Guide', 'Training', 'Video', 'PDF', 'Lesson'
];

const ROLES: (TeamRole | 'All Team Members' | 'All')[] = [
  'All', 'All Team Members', 'Worship Leader', 'Vocalist', 'Keyboard', 'Drums', 'Electric Guitar', 'Sound Engineer', 'Multimedia'
];

export function ResourceFilters({
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  selectedRole,
  onRoleChange
}: ResourceFiltersProps) {
  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase mb-4">Category</h4>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                "px-3 py-1.5 text-xs transition-colors border",
                selectedCategory === cat 
                  ? "bg-accent text-accent-foreground border-accent" 
                  : "bg-transparent text-muted-foreground border-accent/10 hover:border-accent/30"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase mb-4">Resource Type</h4>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={cn(
                "px-3 py-1.5 text-xs transition-colors border",
                selectedType === type 
                  ? "bg-accent text-accent-foreground border-accent" 
                  : "bg-transparent text-muted-foreground border-accent/10 hover:border-accent/30"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase mb-4">Ministry Role</h4>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => onRoleChange(role)}
              className={cn(
                "px-3 py-1.5 text-xs transition-colors border",
                selectedRole === role 
                  ? "bg-accent text-accent-foreground border-accent" 
                  : "bg-transparent text-muted-foreground border-accent/10 hover:border-accent/30"
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
