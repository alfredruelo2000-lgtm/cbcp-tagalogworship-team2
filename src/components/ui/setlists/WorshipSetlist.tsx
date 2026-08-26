import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getSongsPublic, getUpcomingServicePublic } from "@/lib/db-public.functions";

export function WorshipSetlist() {
  const { data: songs = [] } = useQuery({
    queryKey: ['songs-public'],
    queryFn: getSongsPublic,
  });

  const { data: upcomingService } = useQuery({
    queryKey: ['upcoming-service-public'],
    queryFn: getUpcomingServicePublic,
  });

  if (!upcomingService) return null;

  const setlistSongs = (upcomingService.service_items || [])
    .filter((item: any) => item.item_type === 'Song')
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  const getSongTitle = (songId: string) => songs.find((s: any) => s.id === songId)?.title || "Unknown Song";

  return (
    <section className="bg-background px-5 py-12 sm:px-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col items-center text-center sm:mb-12">
          <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Current Focus</span>
          <h2 className="mt-3 font-serif text-foreground text-[clamp(1.6rem,6.5vw,2.25rem)]">This Week's Worship Set</h2>
          <p className="text-muted-foreground text-sm mt-2 uppercase tracking-widest">{upcomingService.title}</p>
        </div>

        <div className="divide-y divide-accent/10">
          {setlistSongs.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-4 sm:py-6">
              <div>
                <h4 className="font-serif text-base text-foreground sm:text-xl">{getSongTitle(item.song_id)}</h4>
                <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mt-1">{item.category}</p>
              </div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">
                Key: {item.selected_key}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center sm:mt-12">
           <Link 
            to="/setlists/$id" 
            params={{ id: upcomingService.id }}
            className="inline-flex h-12 items-center justify-center border border-accent text-accent px-8 text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-accent hover:text-accent-foreground"
          >
            View Full Setlist
          </Link>
        </div>
      </div>
    </section>
  );
}
