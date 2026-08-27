import { useCallback, useEffect, useState } from 'react';
import { MediaItem } from '@/types/media';
import { MediaCard } from './MediaCard';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const active = index === null ? null : items[index] ?? null;

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) => setIndex((prev) => (prev === null ? prev : (prev + delta + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, close, step]);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item, i) => (
          <MediaCard key={item.id} item={item} onClick={() => setIndex(i)} />
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <span className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              {index !== null ? `${index + 1} / ${items.length}` : ''}
            </span>
            <div className="flex shrink-0 items-center gap-4">
              <a
                href={active.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-white/60 transition-colors hover:text-white"
                aria-label="Open original file"
              >
                <Download className="h-5 w-5" />
              </a>
              <button onClick={close} className="text-white/60 transition-colors hover:text-white" aria-label="Close">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-4">
            {items.length > 1 && (
              <>
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous"
                  className="absolute left-1 z-10 grid h-10 w-10 place-items-center text-white/50 hover:text-white"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next"
                  className="absolute right-1 z-10 grid h-10 w-10 place-items-center text-white/50 hover:text-white"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}

            <div className="flex max-h-full w-full max-w-4xl flex-col items-center justify-center gap-4">
              {active.mediaType === 'Photo' && (
                <img
                  src={active.fileUrl}
                  alt={active.title}
                  decoding="async"
                  className="max-h-[65vh] w-auto max-w-full object-contain"
                />
              )}
              {active.mediaType === 'Video' && (
                <video src={active.fileUrl} controls playsInline className="max-h-[65vh] w-full bg-black" />
              )}
              {active.mediaType === 'Audio' && (
                <div className="w-full space-y-4 border border-white/10 p-6">
                  <audio src={active.fileUrl} controls className="w-full" />
                </div>
              )}
              {active.mediaType === 'Document' && (
                <a
                  href={active.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-white/20 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white"
                >
                  Open document
                </a>
              )}

              <div className="w-full space-y-1 text-center text-white">
                <h2 className="font-serif text-lg sm:text-2xl">{active.title}</h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                  {active.category}
                  {active.eventDate ? ` · ${new Date(active.eventDate).toLocaleDateString()}` : ''}
                </p>
                {active.description && (
                  <p className="mx-auto max-w-xl text-xs italic leading-relaxed text-white/60">{active.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
