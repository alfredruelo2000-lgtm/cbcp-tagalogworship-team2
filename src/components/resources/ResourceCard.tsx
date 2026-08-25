import { Link } from "@tanstack/react-router";
import { WorshipResource } from "@/types/resources";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, BookOpen } from "lucide-react";

interface ResourceCardProps {
  resource: WorshipResource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Link 
      to="/resources/$id" 
      params={{ id: resource.id }}
      className="group flex flex-col h-full border border-accent/10 hover:border-accent/30 transition-all duration-300 bg-card overflow-hidden"
    >
      {resource.coverImage && (
        <div className="aspect-[16/9] overflow-hidden">
          <img 
            src={resource.coverImage} 
            alt={resource.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">
            {resource.category}
          </span>
          <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-semibold border-accent/20 text-accent/80">
            {resource.resourceType}
          </Badge>
        </div>
        
        <h3 className="font-serif text-xl mb-3 group-hover:text-accent transition-colors leading-tight">
          {resource.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-grow">
          {resource.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-4 border-t border-accent/5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-accent/60" />
            <span>{resource.author}</span>
          </div>
          {resource.readingTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-accent/60" />
              <span>{resource.readingTime} min</span>
            </div>
          )}
          {resource.scriptureReferences && resource.scriptureReferences.length > 0 && resource.scriptureReferences[0] && (
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-accent/60" />
              <span>
                {(() => {
                  const firstRef = resource.scriptureReferences[0];
                  if (!firstRef) return '';
                  return typeof firstRef === 'string' ? firstRef : firstRef.reference;
                })()}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
