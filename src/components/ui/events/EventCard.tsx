import { Link } from "@tanstack/react-router";

interface EventProps {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  worshipLeader?: string;
  theme?: string;
}

export function EventCard({ event }: { event: EventProps }) {
  return (
    <div className="mx-auto max-w-4xl border border-accent/10 bg-background p-5 shadow-sm sm:p-8 md:p-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col items-start gap-6 md:flex-row md:gap-12">
        <div className="min-w-0 flex-1 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">
              {event.date} • {event.time}
            </span>
            <h3 className="font-serif text-foreground text-[clamp(1.4rem,6vw,1.875rem)]">{event.title}</h3>
          </div>
          
          <div className="space-y-3 leading-relaxed text-muted-foreground sm:space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-foreground">
              <span className="opacity-50">Location:</span> {event.location}
            </div>
            <p className="text-sm">{event.description}</p>
            {event.worshipLeader && (
              <p className="text-xs italic">Worship Led by {event.worshipLeader}</p>
            )}
          </div>

          <Link
            to="/worship"
            className="inline-flex h-12 w-full items-center justify-center bg-primary px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground transition-all hover:bg-primary/90 sm:w-auto"
          >
            View Worship Details
          </Link>
        </div>

        {event.theme && (
          <div className="w-full border-t border-accent/10 pt-5 md:w-1/3 md:border-l md:border-t-0 md:pl-12 md:pt-6">
            <span className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase block mb-2">Theme</span>
            <p className="font-serif italic text-lg text-foreground/80">{event.theme}</p>
          </div>
        )}
      </div>
    </div>
  );
}
