import { MediaItem } from '@/types/media';
import { Play, Music, FileText, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  item: MediaItem;
  onClick?: (item: MediaItem) => void;
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  const type = item.mediaType;
  const preview = item.thumbnailUrl || (type === 'Photo' ? item.fileUrl : undefined);

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className="group relative block w-full overflow-hidden border border-accent/10 bg-muted/20 text-left transition-colors hover:border-accent/30"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {preview ? (
          <img
            src={preview}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5 text-accent/25">
            {type === 'Audio' && <Music className="h-8 w-8" />}
            {type === 'Video' && <Play className="h-8 w-8" />}
            {type === 'Document' && <FileText className="h-8 w-8" />}
            {type === 'Photo' && <ImageIcon className="h-8 w-8" />}
          </div>
        )}

        {(type === 'Video' || type === 'Audio') && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-background/85 text-accent">
              <Play className="h-3.5 w-3.5" />
            </span>
          </span>
        )}

        <span className="absolute left-1.5 top-1.5 bg-background/85 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-accent backdrop-blur-sm">
          {type}
        </span>
      </div>

      <div className={cn('space-y-0.5 px-2.5 py-2')}>
        <h3 className="truncate font-serif text-[13px] leading-tight text-foreground sm:text-sm">{item.title}</h3>
        <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {item.category}
        </p>
      </div>
    </button>
  );
}
