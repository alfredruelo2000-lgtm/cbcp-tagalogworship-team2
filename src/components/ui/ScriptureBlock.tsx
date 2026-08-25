import { cn } from "@/lib/utils";

export function ScriptureBlock({
  verse,
  reference,
  className = "",
}: {
  verse: string;
  reference: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <blockquote className="max-w-3xl">
        <p className={cn("font-serif text-2xl italic leading-relaxed md:text-3xl lg:text-4xl text-balance", verse === "Scripture reference for study and reflection." && "text-muted-foreground/40")}>
          "{verse}"
        </p>
        <footer className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px w-8 bg-accent/30" />
          <cite className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase not-italic">
            — {reference}
          </cite>
          <div className="h-px w-8 bg-accent/30" />
        </footer>
      </blockquote>
    </div>
  );
}
