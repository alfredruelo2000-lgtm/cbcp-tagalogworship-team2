import { useState } from 'react';
import { MediaItem } from '@/types/media';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

/**
 * Prominent banner for approved/featured collages. Sits above the media toolbar
 * and leaves the gallery grid below untouched.
 */
export function FeaturedCollageBanner({ items }: { items: MediaItem[] }) {
  const [index, setIndex] = useState(0);
  if (items.length === 0) return null;

  const active = items[Math.min(index, items.length - 1)]!;
  const step = (delta: number) => setIndex((prev) => (prev + delta + items.length) % items.length);

  return (
    <section aria-label="Featured collage" className="mb-4 border border-accent/15 bg-muted/10">
      <div className="flex items-center justify-between gap-3 border-b border-accent/10 px-3 py-2 sm:px-4">
        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
          <Sparkles className="h-3.5 w-3.5" /> Featured
        </span>
        {items.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              {index + 1} / {items.length}
            </span>
            <button
              onClick={() => step(-1)}
              aria-label="Previous featured collage"
              className="border border-accent/15 p-1 text-muted-foreground hover:border-accent/40 hover:text-accent"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => step(1)}
              aria-label="Next featured collage"
              className="border border-accent/15 p-1 text-muted-foreground hover:border-accent/40 hover:text-accent"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <a href={active.fileUrl} target="_blank" rel="noreferrer" className="group block">
        <div className="relative overflow-hidden bg-primary/5">
          <img
            src={active.thumbnailUrl || active.fileUrl}
            alt={active.title}
            className="max-h-[22rem] w-full object-contain transition-transform duration-500 group-hover:scale-[1.01] sm:max-h-[30rem]"
          />
        </div>
        <div className="space-y-1 px-3 py-3 sm:px-4">
          <h2 className="truncate font-serif text-base text-foreground sm:text-xl">{active.title}</h2>
          {active.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{active.description}</p>
          )}
          <span className="inline-block border-b border-accent/30 pb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
            View full size
          </span>
        </div>
      </a>
    </section>
  );
}
