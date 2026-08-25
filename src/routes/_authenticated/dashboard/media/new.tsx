import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Upload, FileVideo, Music, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMediaItem } from '@/lib/db-resources.functions';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/dashboard/media/new')({
  component: UploadMediaPage,
});

function UploadMediaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    title: '', media_type: 'Photo', category: 'Worship Service', description: '', visibility: 'Private', file_url: ''
  });

  const mutation = useMutation({
    mutationFn: createMediaItem,
    onMutate: async (newItem: any) => {
      await queryClient.cancelQueries({ queryKey: ['media-items'] });
      const previousMedia = queryClient.getQueryData(['media-items']);
      queryClient.setQueryData(['media-items'], (old: any[]) => [{ id: crypto.randomUUID(), ...newItem, created_at: new Date().toISOString() }, ...(old || [])]);
      return { previousMedia };
    },
    onSuccess: () => { toast.success('Media uploaded successfully'); navigate({ to: '/dashboard/media' }); },
    onError: (error: any, _newItem, context: any) => { queryClient.setQueryData(['media-items'], context?.previousMedia); toast.error('Failed to upload media: ' + error.message); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['media-items'] }); }
  });

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error('File must be 25MB or smaller'); return; }
    setSelectedFile(file);
    setIsUploadingFile(true);
    const path = `media/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    try {
      const { error } = await supabase.storage.from('song-resources').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('song-resources').getPublicUrl(path);
      setFormData((prev) => ({ ...prev, file_url: data.publicUrl, media_type: file.type.startsWith('image/') ? 'Photo' : file.type.startsWith('video/') ? 'Video' : 'Audio' }));
      toast.success('File stored and ready to publish');
    } catch (error: any) { setSelectedFile(null); toast.error('File upload failed: ' + error.message); }
    finally { setIsUploadingFile(false); }
  };

  const handleSubmit = (): void => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    if (!formData.file_url) {
      toast.error('Select a file before starting the upload');
      return;
    }
    mutation.mutate({ data: formData });
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6"><div className="space-y-4"><Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">Media Archive</Badge><div className="flex items-center gap-4"><Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => window.history.back()}><ArrowLeft className="w-5 h-5" /></Button><h1 className="font-serif text-5xl text-foreground">Upload Media</h1></div></div><Button onClick={handleSubmit} disabled={mutation.isPending || isUploadingFile} className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl">{mutation.isPending || isUploadingFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {isUploadingFile ? 'Storing File' : 'Start Upload'}</Button></header>
      <div className="max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-12 ml-14"><div className="md:col-span-2 space-y-12"><section className="space-y-8"><input ref={fileInputRef} type="file" className="sr-only" accept="image/*,video/*,audio/*,.pdf" onChange={(e) => void handleFileChange(e.target.files?.[0])} /><div onClick={() => fileInputRef.current?.click()} className="flex justify-center px-6 pt-10 pb-12 border-2 border-accent/10 border-dashed rounded-none hover:border-accent/30 transition-colors cursor-pointer bg-muted/5"><div className="space-y-4 text-center"><div className="flex justify-center gap-4 text-accent/20"><FileVideo className="h-10 w-10" /><ImageIcon className="h-10 w-10" /><Music className="h-10 w-10" /></div><Button type="button" variant="outline" className="rounded-none border-accent/20 text-[10px] uppercase font-bold tracking-[0.2em]"><Upload className="w-3 h-3 mr-2" /> Select File</Button>{selectedFile && <p className="text-[10px] text-accent">{selectedFile.name} · {formData.file_url ? 'Stored' : 'Processing'}</p>}</div></div><div className="space-y-6"><h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Media Metadata</h3><div className="space-y-4"><div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} placeholder="Descriptive name" className="rounded-none border-accent/10 bg-background" /></div><div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="Details about this media..." className="rounded-none border-accent/10 bg-background min-h-[100px]" /></div></div></div></section></div><div className="space-y-12"><section className="p-6 bg-muted/20 border border-accent/5 space-y-4"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Public in Gallery</span><button type="button" aria-label="Toggle public gallery" onClick={() => setFormData((prev) => ({ ...prev, visibility: prev.visibility === 'Public' ? 'Private' : 'Public' }))} className={`w-8 h-4 rounded-full relative transition-colors ${formData.visibility === 'Public' ? 'bg-accent/20' : 'bg-muted/30'}`}><div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${formData.visibility === 'Public' ? 'left-5 bg-accent' : 'left-1 bg-muted'}`} /></button></div></section></div></div>
    </div>
  );
}
