import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, BookOpen, Tag, Link2, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createResource } from '@/lib/db-resources.functions';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/dashboard/resources/new')({
  component: CreateResourcePage,
});

function CreateResourcePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    tags: [] as string[],
    description: '',
    content: '',
    external_link: '',
    status: 'Published',
    visibility: 'Public',
    featured: false
  });

  const mutation = useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      toast.success('Resource created successfully');
      queryClient.invalidateQueries({ queryKey: ['worship-resources'] });
      navigate({ to: '/dashboard/resources' });
    },
    onError: (error) => {
      toast.error('Failed to create resource: ' + (error as Error).message);
    }
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.category) {
      toast.error('Title and category are required');
      return;
    }
    mutation.mutate({ data: formData });
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Education & Training
          </Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-5xl text-foreground">Create Resource</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl ml-14">
            Share training materials, devotionals, and ministry standards with your team and the public.
          </p>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Publish Resource
        </Button>
      </header>

      <div className="max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-12 ml-14">
        <div className="md:col-span-2 space-y-12">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Basic Info</h3>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resource Title</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Worship Leading Essentials" 
                  className="pl-10 rounded-none border-accent/10 bg-background" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="rounded-none border-accent/10 bg-background">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="Worship Devotionals">Worship Devotionals</SelectItem>
                    <SelectItem value="Musicianship">Musicianship</SelectItem>
                    <SelectItem value="Vocal Training">Vocal Training</SelectItem>
                    <SelectItem value="Spiritual Formation">Spiritual Formation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tags</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Separate with commas" 
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
                    className="pl-10 rounded-none border-accent/10 bg-background" 
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Description & Content</h3>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resource Summary</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief overview of the resource..." 
                className="rounded-none border-accent/10 bg-background min-h-[100px]" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detailed Content</Label>
              <Textarea 
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Full resource content or instructions..." 
                className="rounded-none border-accent/10 bg-background min-h-[300px]" 
              />
            </div>
          </section>
        </div>

        <div className="space-y-12">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Attachment & Metadata</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">External Link (Optional)</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={formData.external_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, external_link: e.target.value }))}
                    placeholder="https://..." 
                    className="pl-10 rounded-none border-accent/10 bg-background" 
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="p-6 bg-muted/20 border border-accent/5 space-y-4">
             <div className="flex items-center justify-between">
               <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Publicly Accessible</span>
               <button 
                onClick={() => setFormData(prev => ({ ...prev, visibility: prev.visibility === 'Public' ? 'Private' : 'Public' }))}
                className={`w-8 h-4 rounded-full relative transition-colors ${formData.visibility === 'Public' ? 'bg-accent/20' : 'bg-muted/30'}`}
               >
                 <div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${formData.visibility === 'Public' ? 'left-5 bg-accent' : 'left-1 bg-muted'}`} />
               </button>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Featured Resource</span>
               <button 
                onClick={() => setFormData(prev => ({ ...prev, featured: !prev.featured }))}
                className={`w-8 h-4 rounded-full relative transition-colors ${formData.featured ? 'bg-accent/20' : 'bg-muted/30'}`}
               >
                 <div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${formData.featured ? 'left-5 bg-accent' : 'left-1 bg-muted'}`} />
               </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}


