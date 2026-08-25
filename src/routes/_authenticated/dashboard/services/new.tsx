import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Calendar, Clock, MapPin, Info, Tag, BookOpen, User } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createService } from '@/lib/db-services.functions';
import { toast } from 'sonner';
import { WorshipSetlist, ServiceType, ServiceVisibility, SetlistStatus } from '@/types/setlists';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/dashboard/services/new')({
  component: CreateServicePage,
});

function CreateServicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: team = [] } = useQuery({
    queryKey: ['profiles-directory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name').neq('status', 'Archived');
      if (error) throw error;
      return data;
    }
  });

  const [formData, setFormData] = useState<Partial<WorshipSetlist>>({
    title: '',
    serviceDate: new Date().toISOString().split('T')[0] as string,
    serviceTime: '10:00',
    serviceType: 'Sunday Worship',
    status: 'Draft',
    visibility: 'Public',
    theme: '',
    scriptureReference: '',
    notes: '',
    rehearsalDate: '',
    rehearsalTime: '',
    rehearsalLocation: 'Main Sanctuary',
    isPublic: true
  });

  const mutation = useMutation({
    mutationFn: createService,
    onMutate: async (newService: Partial<WorshipSetlist>) => {
      await queryClient.cancelQueries({ queryKey: ['services'] });
      const previousServices = queryClient.getQueryData(['services']);
      
      const optimisticService = {
        id: crypto.randomUUID(),
        ...newService,
        status: newService.status || 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      queryClient.setQueryData(['services'], (old: WorshipSetlist[]) => [optimisticService as WorshipSetlist, ...(old || [])]);
      
      return { previousServices };
    },
    onSuccess: (data) => {
      toast.success('Service created successfully');
      navigate({ to: '/dashboard/setlists' });
    },
    onError: (error: any, newService, context: any) => {
      queryClient.setQueryData(['services'], context.previousServices);
      toast.error('Failed to create service: ' + error.message);
      setIsSaving(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const handleSave = () => {
    if (!formData.title || !formData.serviceDate) {
      toast.error('Title and Date are required');
      return;
    }
    setIsSaving(true);
    mutation.mutate(formData);
  };

  const updateField = (field: keyof WorshipSetlist, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Planning Center
          </Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-5xl text-foreground">Plan New Service</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl ml-14">
            Initialize a new worship gathering. You can add songs and schedule the team after creation.
          </p>
        </div>
        <Button 
          disabled={isSaving}
          onClick={handleSave}
          className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl"
        >
          <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Service'}
        </Button>
      </header>

      <div className="max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 ml-14">
        <div className="space-y-12">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Gathering Details</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service Title *</Label>
                <Input 
                  placeholder="e.g. Sunday Morning Worship" 
                  className="rounded-none border-accent/10 bg-background" 
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="date" 
                      className="pl-10 rounded-none border-accent/10 bg-background" 
                      value={formData.serviceDate}
                      onChange={(e) => updateField('serviceDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="time" 
                      className="pl-10 rounded-none border-accent/10 bg-background" 
                      value={formData.serviceTime}
                      onChange={(e) => updateField('serviceTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service Type</Label>
                  <Select value={formData.serviceType || 'Sunday Worship'} onValueChange={(v) => updateField('serviceType', v)}>
                    <SelectTrigger className="rounded-none border-accent/10 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {['Sunday Worship', 'Prayer Meeting', 'Youth Worship', 'Midweek Service', 'Communion', 'Special Event', 'Conference', 'Fellowship', 'Other'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Worship Leader</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Select value={formData.worshipLeader || ''} onValueChange={(v) => updateField('worshipLeader', v)}>
                      <SelectTrigger className="pl-10 rounded-none border-accent/10 bg-background">
                        <SelectValue placeholder="Assign leader..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {team.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Main Sanctuary" 
                    className="pl-10 rounded-none border-accent/10 bg-background" 
                    value={formData.rehearsalLocation}
                    onChange={(e) => updateField('rehearsalLocation', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Rehearsal & Call Times</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rehearsal Date</Label>
                <Input 
                  type="date" 
                  className="rounded-none border-accent/10 bg-background" 
                  value={formData.rehearsalDate}
                  onChange={(e) => updateField('rehearsalDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rehearsal Time</Label>
                <Input 
                  type="time" 
                  className="rounded-none border-accent/10 bg-background" 
                  value={formData.rehearsalTime}
                  onChange={(e) => updateField('rehearsalTime', e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-12">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Vision & Status</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service Theme</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. The Grace of God" 
                    className="pl-10 rounded-none border-accent/10 bg-background" 
                    value={formData.theme}
                    onChange={(e) => updateField('theme', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scripture Reference</Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Ephesians 2:8-9" 
                    className="pl-10 rounded-none border-accent/10 bg-background" 
                    value={formData.scriptureReference}
                    onChange={(e) => updateField('scriptureReference', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Internal Planning Notes</Label>
                <Textarea 
                  placeholder="Specific instructions for the worship team..." 
                  className="rounded-none border-accent/10 bg-background min-h-[120px]" 
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
                  <Select value={formData.status || 'Draft'} onValueChange={(v) => updateField('status', v)}>
                    <SelectTrigger className="rounded-none border-accent/10 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Preparing">Preparing</SelectItem>
                      <SelectItem value="Ready">Ready</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visibility</Label>
                  <Select value={formData.visibility || 'Public'} onValueChange={(v) => updateField('visibility', v)}>
                    <SelectTrigger className="rounded-none border-accent/10 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Team Only">Team Only</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-6 bg-muted/20 border border-accent/5 space-y-3 mt-6">
                <div className="flex items-center gap-2 text-accent">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Next Steps</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  After saving, you will be redirected to the Setlist Builder where you can select songs and assign team members to their roles.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
