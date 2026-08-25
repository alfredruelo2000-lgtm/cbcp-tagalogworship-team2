import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMediaPublic } from "@/lib/db-public.functions";

export function GalleryPreview() {
  const { data: media = [] } = useQuery({
    queryKey: ['media-public'],
    queryFn: getMediaPublic,
  });

  const displayMedia = useMemo(() => {
    const photos = (media || []).filter((m: any) => m.media_type === 'Photo' || m.mediaType === 'Photo');
    const featured = photos.filter((m: any) => m.featured);
    const base = featured.length >= 4 ? featured : photos;
    return base.slice(0, 4);
  }, [media]);

  return (
    <section className="py-24 px-6 bg-muted/20">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-end mb-12">
            <div className="space-y-4">
              <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Ministry Highlights</span>
              <h2 className="text-4xl font-serif text-foreground">Worship Moments</h2>
            </div>
            <Link to="/media" className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase border-b border-accent/30 pb-1">View Media</Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {displayMedia.map((item: any, i) => (
             <Link 
               key={item.id} 

               to="/media"
               className={`group relative aspect-[4/5] overflow-hidden ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
             >
                <img 
                  src={item.file_url || item.fileUrl} 
                  alt={item.title} 

                 className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                 loading="lazy"
                 decoding="async"
               />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6 text-center">
                 <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                   <h4 className="font-serif text-white text-lg mb-2">{item.title}</h4>
                   <span className="text-[8px] font-bold text-accent uppercase tracking-widest">{item.category}</span>
                 </div>
               </div>
             </Link>
           ))}
        </div>
      </div>
    </section>
  );
}
