import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, ListMusic, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createService, getServices } from '@/lib/db-services.functions';
import { WorshipSetlist } from '@/types/setlists';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/dashboard/setlists/new')({ component: CreateSetlistPage });

function CreateSetlistPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: getServices });
  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (serviceId) return { id: serviceId };
      return createService({ title: title || 'New Worship Service', status: 'Draft', visibility: 'Public' });
    },
    onSuccess: (service) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Setlist workspace ready');
      navigate({ to: '/dashboard/setlists/$id', params: { id: service.id } });
    },
    onError: (error: Error) => { setIsSaving(false); toast.error(`Unable to create setlist: ${error.message}`); },
  });

  const handleSave = () => {
    if (!serviceId && !title.trim()) { toast.error('Enter a setlist title or select a service'); return; }
    setIsSaving(true);
    mutation.mutate();
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">Planning Center</Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => navigate({ to: '/dashboard/setlists' })}><ArrowLeft className="w-5 h-5" /></Button>
            <h1 className="font-serif text-5xl text-foreground">Create Setlist</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl ml-14">Create a draft setlist or open an existing service to arrange its songs.</p>
        </div>
        <Button disabled={isSaving} onClick={handleSave} className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest"><Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Setlist'}</Button>
      </header>
      <div className="max-w-2xl ml-14 space-y-8">
        <section className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Service Assignment</h3>
          <div className="space-y-2"><Label>Existing Service</Label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full h-10 pl-10 border border-accent/10 bg-background text-sm"><option value="">Create a new service draft</option>{services.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.serviceDate})</option>)}</select></div></div>
          {!serviceId && <div className="space-y-2"><Label htmlFor="setlist-title">Setlist / Service Title</Label><div className="relative"><ListMusic className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="setlist-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sunday Morning Main Set" className="pl-10 rounded-none border-accent/10" /></div></div>}
        </section>
      </div>
    </div>
  );
}
