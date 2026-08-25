import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getResources } from '@/lib/db-resources.functions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScriptureBlock } from '@/components/ui/ScriptureBlock';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft, 
  Bookmark, 
  Share2,
  Tag,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_public/resources/$id')({
  component: ResourceDetailPage,
});

function ResourceDetailPage() {
  const { id } = Route.useParams();

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: getResources,
  });
  
  const resource = useMemo(() => {
    const raw = (resources || []).find((r: any) => r.id === id);
    if (!raw) return null;
    return {
      ...raw,
      resourceType: (raw as any).resource_type || (raw as any).resourceType,
      ministryRoles: (raw as any).ministry_roles || (raw as any).ministryRoles,
      createdAt: (raw as any).created_at || (raw as any).createdAt,
      updatedAt: (raw as any).updated_at || (raw as any).updatedAt
    };
  }, [resources, id]);

  const relatedResources = useMemo(() => {
    if (!resource) return [];
    return resources
      .filter((r: any) => 
        r.id !== (resource as any).id && 
        (r.category === (resource as any).category || (r.tags || []).some((t: string) => (resource as any).tags?.includes(t)))
      )
      .slice(0, 3);
  }, [resources, resource]);

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-4xl mb-4">Resource Not Found</h1>
          <Link to="/resources" className="text-accent hover:underline">Return to Library</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Navigation & Actions Bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-accent/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            to="/resources" 
            className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-accent uppercase hover:text-accent/80 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Library
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] tracking-widest uppercase font-bold">
              <Bookmark className="w-3.5 h-3.5" />
              Save
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] tracking-widest uppercase font-bold">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <header className="relative pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="outline" className="rounded-none border-accent/20 text-accent font-semibold tracking-wider text-[10px] uppercase">
              {resource.category}
            </Badge>
            <Badge variant="secondary" className="rounded-none text-muted-foreground font-semibold tracking-wider text-[10px] uppercase">
              {(resource as any).resource_type || (resource as any).resourceType}
            </Badge>
          </div>
          
          <h1 className="font-serif text-4xl md:text-6xl text-foreground mb-8 leading-tight">
            {resource.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-4 gap-x-8 text-sm text-muted-foreground border-y border-accent/10 py-6 mb-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-accent/60">Author</span>
                <span className="font-medium text-foreground">{(resource as any).author || 'Ministry Team'}</span>
              </div>
            </div>
            
            {((resource as any).published_at || (resource as any).publishedAt) && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-widest font-bold text-accent/60">Published</span>
                  <span className="font-medium text-foreground">
                    {new Date((resource as any).published_at || (resource as any).publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            {((resource as any).reading_time || (resource as any).readingTime) && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-widest font-bold text-accent/60">Reading Time</span>
                  <span className="font-medium text-foreground">{(resource as any).reading_time || (resource as any).readingTime} minutes</span>
                </div>
              </div>
            )}
          </div>

          {((resource as any).cover_image || (resource as any).coverImage) && (
            <div className="aspect-[21/9] w-full mb-16 overflow-hidden border border-accent/10">
              <img 
                src={(resource as any).cover_image || (resource as any).coverImage} 
                alt={resource.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 mb-24">
        <article className="max-w-3xl mx-auto">
          {/* Scripture Foundations */}
          {((resource as any).scripture_references || (resource as any).scriptureReferences) && ((resource as any).scripture_references || (resource as any).scriptureReferences).length > 0 && (
            <div className="mb-12">
              <h3 className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase mb-6 flex items-center gap-3">
                Scripture Foundation
                <Separator className="flex-1 bg-accent/10" />
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {((resource as any).scripture_references || (resource as any).scriptureReferences).map((ref: any, idx: number) => (
                  <ScriptureBlock 
                    key={idx}
                    reference={typeof ref === 'string' ? ref : (ref.reference || '')}
                    verse={typeof ref === 'object' && ref.notes ? ref.notes : "Scripture reference for study and reflection."}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Body Text */}
          <div 
            className="prose prose-lg prose-serif max-w-none 
              prose-headings:font-serif prose-headings:font-normal prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-8
              prose-blockquote:border-l-accent prose-blockquote:text-foreground prose-blockquote:italic prose-blockquote:bg-accent/5 prose-blockquote:p-8 prose-blockquote:rounded-r-lg
              prose-strong:text-foreground prose-strong:font-bold
              prose-li:text-muted-foreground
            "
            dangerouslySetInnerHTML={{ __html: resource.content || '' }}
          />

          {/* Tags */}
          <div className="mt-16 pt-8 border-t border-accent/10 flex flex-wrap gap-2">
            <Tag className="w-4 h-4 text-accent/60 mr-2" />
            {((resource as any).tags || []).map((tag: string) => (
              <Badge key={tag} variant="outline" className="rounded-none border-accent/10 text-muted-foreground hover:border-accent/30 cursor-pointer transition-colors">
                #{tag}
              </Badge>
            ))}
          </div>
        </article>
      </main>

      {/* Related Resources */}
      {relatedResources.length > 0 && (
        <section className="bg-primary/5 py-24 px-6 border-y border-accent/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div className="max-w-xl">
                <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Keep Growing</span>
                <h2 className="font-serif text-3xl mt-4">Related Resources</h2>
              </div>
              <Link 
                to="/resources" 
                className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent group flex items-center gap-2"
              >
                View Full Library
                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedResources.map(r => (
                <ResourceCard key={r.id} resource={r as any} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
