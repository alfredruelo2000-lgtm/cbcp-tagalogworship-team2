import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Globe, Church, Music, Camera, Loader2, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSetting } from '@/lib/db-settings.functions';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

type SectionDefinition = { key: string; name: string; route: string | null; reserve?: boolean };

const homepageSections: SectionDefinition[] = [
  { key: 'worship', name: 'Worship', route: '/worship' },
  { key: 'songs', name: 'Songs', route: '/songs' },
  { key: 'setlists', name: 'Setlists', route: '/setlists' },
  { key: 'team', name: 'Team', route: '/team' },
  { key: 'resources', name: 'Resources', route: '/resources' },
  { key: 'media', name: 'Media', route: '/media' },
  { key: 'about', name: 'About', route: '/about' },
  { key: 'contact', name: 'Contact', route: '/contact' },
  { key: 'custom_1', name: 'Custom Section 1', route: null, reserve: true },
  { key: 'custom_2', name: 'Custom Section 2', route: null, reserve: true },
  { key: 'custom_3', name: 'Custom Section 3', route: null, reserve: true },
];


const defaultOrder = homepageSections.map((section) => section.key);


export const Route = createFileRoute('/_authenticated/dashboard/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['ministry-settings'],
    queryFn: getSettings
  });

  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settings.length > 0) {
      const initial = settings.reduce((acc, curr) => ({
        ...acc,
        [curr.key]: curr.value
      }), {});
      setLocalSettings(initial);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateSetting,
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['ministry-settings'] });
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + (error as Error).message);
    }
  });

  const handleSave = (key: string, value = localSettings[key]) => {
     setLocalSettings((previous) => ({ ...previous, [key]: value }));
     mutation.mutate({ data: { key, value } });
   };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Ministry Configuration
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Manage your ministry identity, worship preferences, and system defaults.
          </p>
        </div>
      </header>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="bg-transparent border-b border-accent/10 w-full justify-start rounded-none h-auto p-0 gap-8">
           <TabsTrigger value="identity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-[10px] uppercase font-bold tracking-widest px-0 py-4">Identity</TabsTrigger>
           <TabsTrigger value="worship" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-[10px] uppercase font-bold tracking-widest px-0 py-4">Worship</TabsTrigger>
           <TabsTrigger value="homepage" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-[10px] uppercase font-bold tracking-widest px-0 py-4">Homepage Sections</TabsTrigger>
           <TabsTrigger value="branding" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-[10px] uppercase font-bold tracking-widest px-0 py-4">Branding</TabsTrigger>
           <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-[10px] uppercase font-bold tracking-widest px-0 py-4">Notifications</TabsTrigger>
         </TabsList>

        <div className="mt-12 max-w-4xl">
          <TabsContent value="identity" className="space-y-8 animate-in slide-in-from-left-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <section className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ministry Name</Label>
                  <Input 
                    value={localSettings['ministry_name'] || ''} 
                    onChange={(e) => setLocalSettings(p => ({...p, ministry_name: e.target.value}))}
                    placeholder="Radiant Praise" 
                    className="rounded-none border-accent/10 bg-background" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Church Affiliation</Label>
                  <Input 
                    value={localSettings['church_affiliation'] || ''} 
                    onChange={(e) => setLocalSettings(p => ({...p, church_affiliation: e.target.value}))}
                    placeholder="Radiant Church" 
                    className="rounded-none border-accent/10 bg-background" 
                  />
                </div>
                <Button onClick={() => handleSave('ministry_name')} disabled={mutation.isPending} className="rounded-none bg-accent text-primary text-[10px] uppercase font-bold tracking-widest">
                  Save Identity
                </Button>
              </section>

              <section className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ministry Vision</Label>
                  <Textarea 
                    value={localSettings['ministry_vision'] || ''} 
                    onChange={(e) => setLocalSettings(p => ({...p, ministry_vision: e.target.value}))}
                    placeholder="Our vision for worship..." 
                    className="rounded-none border-accent/10 bg-background min-h-[120px]" 
                  />
                </div>
                <Button onClick={() => handleSave('ministry_vision')} disabled={mutation.isPending} className="rounded-none bg-accent text-primary text-[10px] uppercase font-bold tracking-widest">
                  Update Vision
                </Button>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="worship" className="space-y-8 animate-in slide-in-from-left-4 duration-500">
             <div className="p-8 bg-muted/20 border border-accent/5">
                <h3 className="text-xl font-serif mb-6">Worship Defaults</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Default Service Type</Label>
                    <Input 
                      value={localSettings['default_service_type'] || ''} 
                      onChange={(e) => setLocalSettings(p => ({...p, default_service_type: e.target.value}))}
                      placeholder="Sunday Worship" 
                      className="rounded-none border-accent/10 bg-background" 
                    />
                  </div>
                </div>
                <Button onClick={() => handleSave('default_service_type')} disabled={mutation.isPending} className="mt-8 rounded-none bg-accent text-primary text-[10px] uppercase font-bold tracking-widest">
                  Save Defaults
                </Button>
             </div>
           </TabsContent>

           <TabsContent value="homepage" className="space-y-6 animate-in slide-in-from-left-4 duration-500">
             <div className="space-y-2">
               <h2 className="text-2xl font-serif text-foreground">Homepage Sections</h2>
               <p className="text-sm text-muted-foreground">Control which existing sections are visible to public visitors.</p>
             </div>
             <div className="divide-y divide-border border-y border-border">
               {(localSettings['homepage_sections']?.order ?? defaultOrder).map((key: string, index: number, order: string[]) => {
                 const section = homepageSections.find((item) => item.key === key) ?? { key, name: key, route: null };
                 const config = localSettings['homepage_sections']?.[key] ?? {};
                 const visible = typeof config === 'boolean' ? config : config.published !== false && !section.reserve;
                 const navigation = typeof config === 'boolean' ? true : config.showInNavigation !== false;
                 const ready = Boolean(section.route);
                 const value = { ...localSettings['homepage_sections'], [key]: { published: visible, showInNavigation: navigation, route: section.route, displayOrder: index } , order };
                 return (
                   <div key={key} className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
                     <div><p className="font-medium text-foreground">{section.name}</p><p className="text-xs text-muted-foreground">{visible ? 'Published' : 'Hidden'} · {navigation ? 'Navigation visible' : 'Navigation hidden'} · {ready ? 'Page configured' : 'Page not configured'}</p></div>
                     <div className="flex flex-wrap gap-2">
                       <Button variant="outline" size="sm" disabled={mutation.isPending || index === 0} onClick={() => { const next = [...order]; const current = next.splice(index, 1)[0]; if (current) next.splice(index - 1, 0, current); handleSave('homepage_sections', { ...value, order: next }); }} className="rounded-none">Move Up</Button>
                       <Button variant="outline" size="sm" disabled={mutation.isPending || index === order.length - 1} onClick={() => { const next = [...order]; const current = next.splice(index, 1)[0]; if (current) next.splice(index + 1, 0, current); handleSave('homepage_sections', { ...value, order: next }); }} className="rounded-none">Move Down</Button>

                       <Button variant="outline" size="sm" disabled={mutation.isPending || !ready} onClick={() => handleSave('homepage_sections', { ...value, [key]: { ...config, published: !visible } })} className="rounded-none gap-2">{visible ? <Eye size={16} /> : <EyeOff size={16} />} {visible ? 'Published' : 'Hidden'}</Button>
                       <Button variant="outline" size="sm" disabled={mutation.isPending || !ready} onClick={() => handleSave('homepage_sections', { ...value, [key]: { ...config, showInNavigation: !navigation } })} className="rounded-none">{navigation ? 'Hide Navigation' : 'Show Navigation'}</Button>
                     </div>
                   </div>
                 );
               })}
             </div>

           </TabsContent>
         </div>
      </Tabs>
    </div>
  );
}
