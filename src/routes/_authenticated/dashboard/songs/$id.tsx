import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Music, Type, Languages, Tags, Star, Info, Loader2, Upload, FileText, Trash2, Eye, History, Wand2, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { updateSong, getSongById, getSongVersions, restoreSongVersion, SongVersion } from '@/lib/db-songs.functions';
import { formatSongText } from '@/lib/song-format';

import { cacheSongChart } from '@/lib/offline';
import { isPublicSong, songKeys, syncSongCaches } from '@/lib/song-data';
import { toast } from 'sonner';
import { WorshipSong, SongLanguage, SongType, SongStatus, SongVisibility } from '@/types/songs';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateSongCover } from '@/lib/ai-cover-art.functions';
import { storeSongCover } from '@/lib/song-cover.functions';


export const Route = createFileRoute('/_authenticated/dashboard/songs/$id')({
  component: EditSongPage,
});

function EditSongPage() {
  const { id } = useParams({ from: '/_authenticated/dashboard/songs/$id' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loading, isPending: authPending } = useAuth();
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMood, setAiMood] = useState('Reverent');
  const [aiStyle, setAiStyle] = useState('cinematic worship');
  const [aiDirection, setAiDirection] = useState('');
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const { data: song, isLoading: songLoading } = useQuery({
    queryKey: songKeys.detail(id),
    queryFn: () => getSongById(id),
  });

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['song-versions', id],
    queryFn: () => getSongVersions(id),
  });

  const [formData, setFormData] = useState<Partial<WorshipSong>>({});

  useEffect(() => {
    if (song) {
      setFormData(song);
    }
  }, [song]);

  const mutation = useMutation({
    mutationFn: (data: Partial<WorshipSong>) => updateSong({ id, song: data }),
    onMutate: async (patch) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: songKeys.adminList }),
        queryClient.cancelQueries({ queryKey: songKeys.publicList }),
        queryClient.cancelQueries({ queryKey: songKeys.detail(id) }),
      ]);
      const previousAdmin = queryClient.getQueryData(songKeys.adminList);
      const previousPublic = queryClient.getQueryData(songKeys.publicList);
      const previousDetail = queryClient.getQueryData(songKeys.detail(id));
      if (song) syncSongCaches(queryClient, { ...song, ...patch, id } as WorshipSong);
      return { previousAdmin, previousPublic, previousDetail };
    },
    onSuccess: async (savedSong) => {
      syncSongCaches(queryClient, savedSong);
      if (isPublicSong(savedSong)) await cacheSongChart(savedSong);
      toast.success('Song updated successfully');
      navigate({ to: '/dashboard/songs' });
    },
    onError: (error: any, _patch, context) => {
      queryClient.setQueryData(songKeys.adminList, context?.previousAdmin);
      queryClient.setQueryData(songKeys.publicList, context?.previousPublic);
      queryClient.setQueryData(songKeys.detail(id), context?.previousDetail);
      toast.error('Failed to update song: ' + error.message);
    },
    onSettled: () => void Promise.all([
      queryClient.invalidateQueries({ queryKey: songKeys.adminList }),
      queryClient.invalidateQueries({ queryKey: songKeys.publicList }),
      queryClient.invalidateQueries({ queryKey: songKeys.detail(id) }),
    ]),
  });

  const handleSave = () => {
    if (!formData.title) {
      toast.error('Song title is required');
      return;
    }
    if (mutation.isPending) return;
    mutation.mutate(formData);
  };

  const updateField = (field: keyof WorshipSong, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'sheet') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(type);
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${type}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('song-resources')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('song-resources')
        .getPublicUrl(filePath);

      if (type === 'audio') {
        updateField('audioUrl' as any, publicUrl);
      } else {
        updateField('sheetMusicUrl' as any, publicUrl);
      }
      toast.success(`${type === 'audio' ? 'Audio' : 'Sheet music'} uploaded`);
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setIsUploading(null);
    }
  };

  const handleImportText = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      updateField('lyrics', formatSongText(text));
      toast.success('Lyrics imported and auto-formatted');
    };
    reader.readAsText(file);
  };


  if (loading || authPending || songLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold">Loading Repertoire...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Edit Repertoire
          </Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => navigate({ to: '/dashboard/songs' })}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-5xl text-foreground">Edit: {song?.title}</h1>
          </div>
        </div>
        <Button 
          disabled={mutation.isPending}
          onClick={handleSave}
          className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </header>

      <div className="max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-12 ml-14">
        <div className="md:col-span-2 space-y-12">
          {/* Metadata Section */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Song Metadata</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Song Title *</Label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Title of the song" 
                    className="pl-10 rounded-none border-accent/10 bg-background" 
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Artist / Composer</Label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Original artist or writer" 
                    className="pl-10 rounded-none border-accent/10 bg-background" 
                    value={formData.artist || ''}
                    onChange={(e) => updateField('artist', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Songwriter(s)</Label>
                <Input 
                  placeholder="Additional contributors" 
                  className="rounded-none border-accent/10 bg-background" 
                  value={formData.songwriter || ''}
                  onChange={(e) => updateField('songwriter', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Language</Label>
                  <Select value={formData.language || 'English'} onValueChange={(v) => updateField('language', v)}>
                    <SelectTrigger className="rounded-none border-accent/10 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Filipino/Tagalog">Filipino/Tagalog</SelectItem>
                      <SelectItem value="Cebuano/Bisaya">Cebuano/Bisaya</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Song Type</Label>
                  <Select value={formData.songType || 'Worship'} onValueChange={(v) => updateField('songType', v)}>
                    <SelectTrigger className="rounded-none border-accent/10 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {['Opening', 'Praise', 'Worship', 'Response', 'Communion', 'Offering', 'Closing'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Original Key</Label>
                <Select value={formData.defaultKey || 'C'} onValueChange={(v) => updateField('defaultKey', v)}>
                  <SelectTrigger className="rounded-none border-accent/10 bg-background">
                    <SelectValue placeholder="Key" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none max-h-72">
                    {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
                      'Am', 'A#m', 'Bbm', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'].map(k => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/70">Chart transposes from this key</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tempo (BPM)</Label>
                <Input
                  type="number"
                  placeholder="72"
                  className="rounded-none border-accent/10 bg-background"
                  value={formData.bpm ?? ''}
                  onChange={(e) => updateField('bpm', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time Signature</Label>
                <Select value={formData.timeSignature || '4/4'} onValueChange={(v) => updateField('timeSignature', v)}>
                  <SelectTrigger className="rounded-none border-accent/10 bg-background">
                    <SelectValue placeholder="Meter" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {['4/4', '3/4', '6/8', '2/4', '12/8'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>


          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-accent/10 pb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Content & Lyrics</h3>
              <div className="flex items-center gap-2">
                <Input 
                  type="file" 
                  accept=".txt,.md"
                  className="hidden" 
                  id="import-lyrics"
                  onChange={handleImportText}
                />
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm"
                  className="h-7 rounded-none text-[9px] uppercase tracking-widest font-bold text-accent hover:text-accent hover:bg-accent/5"
                >
                  <label htmlFor="import-lyrics" className="cursor-pointer">
                    <FileText className="w-3 h-3 mr-1" />
                    Import Text
                  </label>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const enhanced = formatSongText(formData.lyrics || '');
                    updateField('lyrics', enhanced);
                    toast.success('Sections highlighted and chords formatted');
                  }}
                  className="h-7 rounded-none text-[9px] uppercase tracking-widest font-bold text-accent hover:text-accent hover:bg-accent/5"
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  Auto-Format
                </Button>

              </div>
            </div>
            
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/20 p-1">
                <TabsTrigger value="edit" className="rounded-none text-[9px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-accent">
                  <Type className="w-3 h-3 mr-2" /> Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="rounded-none text-[9px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-accent">
                  <Eye className="w-3 h-3 mr-2" /> Live Preview
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none text-[9px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-accent">
                  <History className="w-3 h-3 mr-2" /> History
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lyrics & Chords</Label>
                  <Textarea 
                    placeholder="Paste lyrics or chords here..." 
                    className="rounded-none border-accent/10 bg-background min-h-[400px] font-mono text-[12px] leading-relaxed" 
                    value={formData.lyrics || ''}
                    onChange={(e) => updateField('lyrics', e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="preview" className="mt-4 border border-accent/10 bg-muted/5 p-8 min-h-[400px]">
                {formData.lyrics ? (
                  <pre className="whitespace-pre-wrap font-mono text-[13px] leading-loose text-foreground/90">
                    {formData.lyrics}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 py-20">
                    <Music className="w-8 h-8 opacity-20" />
                    <p className="text-[10px] uppercase tracking-widest">No content to preview</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="history" className="mt-4 space-y-4">
                <div className="space-y-4">
                  {versionsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    </div>
                  ) : versions && versions.length > 0 ? (
                    <div className="space-y-3">
                      {versions.map((version) => (
                        <div key={version.id} className="p-4 bg-background border border-accent/10 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-accent px-2 py-0.5 border border-accent/20">v{version.version_number}</span>
                              <p className="text-xs font-serif">{new Date(version.created_at).toLocaleString()}</p>
                            </div>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                              {version.lyrics?.length || 0} characters
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-none text-[9px] uppercase tracking-widest font-bold border-accent/20"
                            onClick={async () => {
                              if (confirm('Restore this version? Unsaved changes will be lost.')) {
                                updateField('lyrics', version.lyrics);
                                updateField('chords', version.chords);
                                toast.success(`Restored version ${version.version_number}`);
                              }
                            }}
                          >
                            <RotateCcw className="w-3 h-3 mr-2" /> Restore
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground space-y-2">
                      <History className="w-8 h-8 mx-auto opacity-20" />
                      <p className="text-[10px] uppercase tracking-widest">No version history yet</p>
                      <p className="text-[8px] uppercase tracking-widest max-w-[200px] mx-auto opacity-60">Versions are created automatically when you save changes to lyrics or chords.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <div className="space-y-12">
          {/* Status & Visibility Section */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Status & Visibility</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
                <Select value={formData.status || 'Active'} onValueChange={(v) => updateField('status', v)}>
                  <SelectTrigger className="rounded-none border-accent/10 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Learning">Learning</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visibility</Label>
                <Select
                  value={formData.visibility || (formData.isPublic ? 'Public' : 'Team Only')}
                  onValueChange={(v) => { updateField('visibility', v); updateField('isPublic', v === 'Public'); }}
                >
                  <SelectTrigger className="rounded-none border-accent/10 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="Public">Public (Website &amp; App)</SelectItem>
                    <SelectItem value="Team Only">Team Only</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>



              <div className="flex items-center justify-between p-4 bg-muted/20 border border-accent/5">
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                    <Star className="w-3 h-3" /> Featured Song
                  </Label>
                </div>
                <Switch 
                  checked={formData.featured || false}
                  onCheckedChange={(v) => updateField('featured', v)}
                />
              </div>
            </div>
          </section>

          {/* Metronome Defaults Section */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Metronome Defaults</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Default BPM</Label>
                <Input 
                  type="number"
                  placeholder="e.g. 72"
                  className="rounded-none border-accent/10 bg-background" 
                  value={formData.bpm || ''}
                  onChange={(e) => updateField('bpm', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Default Sound</Label>
                <Select 
                  value={formData.externalResources?.metronomeDefaultSound || 'beep'} 
                  onValueChange={(v) => updateField('externalResources', { ...formData.externalResources, metronomeDefaultSound: v })}
                >
                  <SelectTrigger className="rounded-none border-accent/10 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="beep">Beep</SelectItem>
                    <SelectItem value="woodblock">Woodblock</SelectItem>
                    <SelectItem value="click">Click</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Default Volume ({Math.round((formData.externalResources?.metronomeDefaultVolume ?? 0.5) * 100)}%)</Label>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.externalResources?.metronomeDefaultVolume ?? 0.5}
                  onChange={(e) => updateField('externalResources', { ...formData.externalResources, metronomeDefaultVolume: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>
            </div>
          </section>

           {/* Cover Section */}
           <section className="space-y-6">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Cover Art</h3>
             <ImageUpload value={formData.artworkUrl || ''} onChange={(url) => updateField('artworkUrl', url)} bucket="song-resources" />
             <Button type="button" variant="outline" className="w-full rounded-none border-accent/20 text-[10px] uppercase tracking-widest font-bold" onClick={() => { setAiOpen(true); setAiError(null); setAiPreview(null); }}>
               <Wand2 className="w-4 h-4 mr-2" /> Generate With AI
             </Button>
           </section>

           <Dialog open={aiOpen} onOpenChange={setAiOpen}>
             <DialogContent className="rounded-none max-w-md">
               <DialogHeader><DialogTitle className="font-serif text-2xl">Original Cover Artwork</DialogTitle><DialogDescription>Generate an original square interpretation from this song’s worship context. Existing artwork will not be changed until you approve a preview.</DialogDescription></DialogHeader>
               {aiPreview ? <img src={aiPreview} alt="Generated cover preview" className="w-full aspect-square object-cover border border-accent/10" /> : <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3"><div><Label>Visual Mood</Label><Select value={aiMood} onValueChange={setAiMood}><SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger><SelectContent className="rounded-none">{['Reverent','Joyful','Celebration','Reflective','Intimate Worship','Hopeful','Majestic','Prayerful'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div><div><Label>Style</Label><Select value={aiStyle} onValueChange={setAiStyle}><SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger><SelectContent className="rounded-none">{['cinematic worship','minimalist','atmospheric','abstract','nature-inspired','typography-focused','modern church creative'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div></div>
                 <div><Label>Short visual direction</Label><Textarea value={aiDirection} onChange={e => setAiDirection(e.target.value)} placeholder="Optional direction based on the song message" className="rounded-none" maxLength={500} /></div>
                 {aiError && <p className="text-sm text-destructive">{aiError}</p>}
               </div>}
               <DialogFooter className="gap-2"><Button type="button" variant="ghost" className="rounded-none" onClick={() => setAiOpen(false)}>Cancel</Button>{aiPreview ? <><Button type="button" variant="outline" className="rounded-none" disabled={aiLoading} onClick={() => setAiPreview(null)}>Generate Again</Button><Button type="button" className="rounded-none bg-accent text-primary" disabled={aiLoading} onClick={async () => { setAiLoading(true); setAiError(null); try { const stored = aiPreview.startsWith('data:') ? (await storeSongCover({ data: { image: aiPreview } })).url : aiPreview; updateField('artworkUrl', stored); await mutation.mutateAsync({ artworkUrl: stored }); setAiPreview(null); setAiOpen(false); toast.success('AI cover published.'); } catch (e) { setAiError(e instanceof Error ? e.message : 'Could not save the cover.'); } finally { setAiLoading(false); } }}>{aiLoading ? 'Publishing...' : 'Use This Cover'}</Button></> : <Button type="button" disabled={aiLoading || !song} className="rounded-none bg-accent text-primary" onClick={async () => { setAiLoading(true); setAiError(null); try { const result = await generateSongCover({ data: { title: formData.title || song?.title || '', artist: formData.artist, songwriter: formData.songwriter, language: formData.language, themes: formData.themes, scripture: formData.scriptureReferences?.map(x => typeof x === 'string' ? x : x.reference).join(', '), mood: aiMood, style: aiStyle, direction: aiDirection } }); setAiPreview(result.url || (result.base64 ? `data:image/png;base64,${result.base64}` : null)); } catch (e) { setAiError(e instanceof Error ? e.message : 'Generation failed. Manual upload remains available.'); } finally { setAiLoading(false); } }}><Wand2 className="w-4 h-4 mr-2" />{aiLoading ? 'Generating...' : 'Generate'}</Button>}</DialogFooter>
             </DialogContent>
           </Dialog>

           {/* Media Section */}
           <section className="space-y-6">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Resources & Media</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Audio Recording</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept="audio/*"
                    className="hidden" 
                    id="audio-upload"
                    onChange={(e) => handleFileUpload(e, 'audio')}
                  />
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1 rounded-none border-accent/10 text-[10px] uppercase tracking-widest font-bold"
                  >
                    <label htmlFor="audio-upload" className="cursor-pointer">
                      {isUploading === 'audio' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      Upload Audio
                    </label>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sheet Music (PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept=".pdf"
                    className="hidden" 
                    id="sheet-upload"
                    onChange={(e) => handleFileUpload(e, 'sheet')}
                  />
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1 rounded-none border-accent/10 text-[10px] uppercase tracking-widest font-bold"
                  >
                    <label htmlFor="sheet-upload" className="cursor-pointer">
                      {isUploading === 'sheet' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      Upload PDF
                    </label>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CCLI Number</Label>
                <Input 
                  placeholder="CCLI #" 
                  className="rounded-none border-accent/10 bg-background" 
                  value={formData.ccliNumber || ''}
                  onChange={(e) => updateField('ccliNumber', e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
