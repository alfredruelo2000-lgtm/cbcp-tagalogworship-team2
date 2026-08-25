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
    <div className="max-w-4xl mx-auto bg-background border border-accent/10 p-8 md:p-12 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col md:flex-row gap-12 items-start">
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">
              {event.date} • {event.time}
            </span>
            <h3 className="text-3xl font-serif text-foreground">{event.title}</h3>
          </div>
          
          <div className="space-y-4 text-muted-foreground leading-relaxed">
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
            className="inline-flex h-12 items-center justify-center bg-primary px-8 text-[10px] font-bold tracking-[0.2em] text-primary-foreground uppercase transition-all hover:bg-primary/90"
          >
            View Worship Details
          </Link>
        </div>

        {event.theme && (
          <div className="w-full md:w-1/3 pt-6 border-t md:border-t-0 md:border-l border-accent/10 md:pl-12">
            <span className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase block mb-2">Theme</span>
            <p className="font-serif italic text-lg text-foreground/80">{event.theme}</p>
          </div>
        )}
      </div>
    </div>
  );
}
