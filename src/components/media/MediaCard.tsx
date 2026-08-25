import { MediaItem } from '@/types/media';
import { Play, Music, FileText, ExternalLink, Clock, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  item: MediaItem;
  onClick?: (item: MediaItem) => void;
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  const isVideo = item.mediaType === 'Video';
  const isAudio = item.mediaType === 'Audio';
  const isPhoto = item.mediaType === 'Photo';
  const isDocument = item.mediaType === 'Document';

  return (
    <div 
      className={cn(
        "group relative overflow-hidden bg-muted/20 border border-accent/5 hover:border-accent/20 transition-all duration-500 cursor-pointer",
        isPhoto ? "aspect-[4/5] md:aspect-square" : "aspect-video"
      )}
      onClick={() => onClick?.(item)}
    >
      {/* Thumbnail */}
      {(isPhoto || isVideo) && item.thumbnailUrl ? (
        <img 
          src={item.thumbnailUrl} 
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/5">
          {isAudio && <Music className="w-12 h-12 text-accent/20" />}
          {isDocument && <FileText className="w-12 h-12 text-accent/20" />}
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6 flex flex-col justify-end">
        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <Badge variant="outline" className="rounded-none border-white/20 text-white text-[8px] uppercase tracking-widest mb-3">
            {item.mediaType}
          </Badge>
          <h3 className="font-serif text-xl text-white mb-2 leading-tight">{item.title}</h3>
          
          <div className="flex items-center gap-4 text-[9px] text-white/60 uppercase tracking-widest">
            {item.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {item.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {new Date(item.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Type Indicators */}
      <div className="absolute top-4 right-4">
        {isVideo && (
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        )}
        {isAudio && (
          <div className="w-10 h-10 rounded-full bg-accent/10 backdrop-blur-md flex items-center justify-center border border-accent/20">
            <Music className="w-4 h-4 text-accent" />
          </div>
        )}
      </div>

      {/* Featured Badge */}
      {item.featured && (
        <div className="absolute top-4 left-4">
          <Badge className="rounded-none bg-accent text-primary text-[8px] font-bold tracking-widest uppercase">
            Featured
          </Badge>
        </div>
      )}

      {/* Visibility Indicator (for non-public) */}
      {item.visibility !== 'Public' && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="rounded-none text-[7px] uppercase tracking-tighter">
            {item.visibility}
          </Badge>
        </div>
      )}
    </div>
  );
}
