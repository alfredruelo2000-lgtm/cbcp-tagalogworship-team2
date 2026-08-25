import { Link } from "@tanstack/react-router";

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-8xl font-serif text-accent/20 mb-6">404</h1>
      <h2 className="font-serif text-3xl mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-12 max-w-sm">
        The page you're looking for may have moved or no longer exists.
      </p>
      <Link
        to="/"
        className="h-12 flex items-center justify-center bg-foreground text-background px-10 text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-foreground/90"
      >
        Return Home
      </Link>
    </div>
  );
}

export default NotFound;
