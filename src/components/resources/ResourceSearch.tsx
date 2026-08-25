import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ResourceSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ResourceSearch({ value, onChange }: ResourceSearchProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search resources, scripture, tags..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 bg-background border-accent/20 focus-visible:ring-accent/30 rounded-none h-12"
      />
    </div>
  );
}
