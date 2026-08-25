import { useState } from 'react';
import { MediaItem } from '@/types/media';
import { MediaCard } from './MediaCard';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <MediaCard 
            key={item.id} 
            item={item} 
            onClick={(i) => setSelectedItem(i)} 
          />
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <button 
            onClick={() => setSelectedItem(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="max-w-5xl w-full h-full flex flex-col items-center justify-center relative">
            {selectedItem.mediaType === 'Photo' ? (
              <img 
                src={selectedItem.fileUrl} 
                alt={selectedItem.title}
                className="max-h-[80vh] w-auto object-contain border border-white/10"
              />
            ) : (
              <div className="w-full aspect-video bg-black flex items-center justify-center border border-white/10">
                <span className="text-white/30 uppercase tracking-widest text-[10px]">
                  {selectedItem.mediaType} Player Component
                </span>
              </div>
            )}
            
            <div className="mt-8 text-center text-white space-y-2">
              <h2 className="font-serif text-3xl">{selectedItem.title}</h2>
              <p className="text-white/60 text-[10px] uppercase tracking-widest flex items-center justify-center gap-4">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(selectedItem.eventDate).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Info className="w-3 h-3"/> {selectedItem.category}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
