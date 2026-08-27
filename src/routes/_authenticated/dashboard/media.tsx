import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMediaItems,
  getMediaAlbums,
  updateMediaItem,
  deleteMediaItem,
  createMediaAlbum,
  updateMediaAlbum,
} from '@/lib/db-resources.functions';
import { UploadInterface } from '@/components/media/UploadInterface';
import { CollageStudio } from '@/components/media/CollageStudio';
import { createMediaItem } from '@/lib/db-resources.functions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Play,
  Image as ImageIcon,
  FileText,
  Music,
  Search,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Plus,
  Check,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/dashboard/media')({
  component: MediaLibraryPage,
});

const TYPES = ['All Types', 'Photo', 'Video', 'Audio', 'Document'];

function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadAlbum, setUploadAlbum] = useState<string | null>(null);
  const [uploadPublic, setUploadPublic] = useState(true);
  const [newAlbum, setNewAlbum] = useState('');
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);

  const { data: mediaItems = [], isLoading } = useQuery({ queryKey: ['media-items'], queryFn: getMediaItems });
  const { data: albums = [] } = useQuery({ queryKey: ['media-albums'], queryFn: getMediaAlbums });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['media-items'] });
    void queryClient.invalidateQueries({ queryKey: ['media-albums'] });
    void queryClient.invalidateQueries({ queryKey: ['media-public'] });
    void queryClient.invalidateQueries({ queryKey: ['media-albums-public'] });
  };

  const patchItem = useMutation({
    mutationFn: (vars: { id: string; patch: any }) => updateMediaItem(vars),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['media-items'] });
      const previous = queryClient.getQueryData(['media-items']);
      queryClient.setQueryData(['media-items'], (old: any[] = []) =>
        old.map((item) => (item.id === vars.id ? { ...item, ...vars.patch } : item)),
      );
      return { previous };
    },
    onError: (error: any, _v, ctx: any) => {
      queryClient.setQueryData(['media-items'], ctx?.previous);
      toast.error(`Update failed: ${error.message}`);
    },
    onSuccess: () => toast.success('Media updated'),
    onSettled: refresh,
  });

  const removeItem = useMutation({
    mutationFn: (id: string) => deleteMediaItem({ id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['media-items'] });
      const previous = queryClient.getQueryData(['media-items']);
      queryClient.setQueryData(['media-items'], (old: any[] = []) => old.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (error: any, _v, ctx: any) => {
      queryClient.setQueryData(['media-items'], ctx?.previous);
      toast.error(`Delete failed: ${error.message}`);
    },
    onSuccess: () => toast.success('Media removed'),
    onSettled: refresh,
  });

  const addAlbum = useMutation({
    mutationFn: (title: string) => createMediaAlbum({ title, is_public: true }),
    onSuccess: () => {
      setNewAlbum('');
      toast.success('Album created');
      refresh();
    },
    onError: (error: any) => toast.error(`Album failed: ${error.message}`),
  });

  const patchAlbum = useMutation({
    mutationFn: (vars: { id: string; patch: any }) => updateMediaAlbum(vars),
    onSuccess: refresh,
    onError: (error: any) => toast.error(`Album update failed: ${error.message}`),
  });

  const collagePhotos = useMemo(
    () =>
      (mediaItems as any[])
        .filter((item) => item.media_type === 'Photo' && (item.thumbnail_url || item.file_url))
        .map((item) => ({ id: item.id, title: item.title, url: item.thumbnail_url || item.file_url })),
    [mediaItems],
  );

  const filteredMedia = useMemo(
    () =>
      (mediaItems as any[]).filter((item) => {
        const haystack = `${item.title ?? ''} ${item.description ?? ''} ${item.category ?? ''}`.toLowerCase();
        const matchesSearch = haystack.includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'All Types' || item.media_type === typeFilter;
        return matchesSearch && matchesType;
      }),
    [mediaItems, searchQuery, typeFilter],
  );

  const icon = (type: string) => {
    if (type === 'Video') return <Play className="h-6 w-6" />;
    if (type === 'Audio') return <Music className="h-6 w-6" />;
    if (type === 'Photo') return <ImageIcon className="h-6 w-6" />;
    return <FileText className="h-6 w-6" />;
  };

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-10 animate-in fade-in duration-500">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Badge variant="outline" className="rounded-none border-accent/20 text-[9px] uppercase tracking-widest text-accent">
            Digital Assets
          </Badge>
          <h1 className="truncate font-serif text-[clamp(1.6rem,6vw,2.75rem)] text-foreground">Media Library</h1>
          <p className="max-w-2xl text-xs text-muted-foreground sm:text-sm">
            Upload once — anything marked public appears instantly on the Worship Media page.
          </p>
        </div>
        <Button
          onClick={() => setShowUpload((v) => !v)}
          className="shrink-0 rounded-none bg-accent px-5 py-5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" /> {showUpload ? 'Close' : 'Upload'}
        </Button>
      </header>

      {showUpload && (
        <section className="space-y-4 border border-accent/10 bg-muted/10 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Album (optional)</Label>
              <select
                value={uploadAlbum ?? ''}
                onChange={(e) => setUploadAlbum(e.target.value || null)}
                className="h-9 w-full border border-accent/10 bg-background px-3 text-[10px] uppercase tracking-widest focus:outline-none"
              >
                <option value="">No album</option>
                {(albums as any[]).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setUploadPublic((v) => !v)}
              className={`h-9 border px-4 text-[10px] font-bold uppercase tracking-widest ${
                uploadPublic ? 'border-accent bg-accent/10 text-accent' : 'border-accent/10 text-muted-foreground'
              }`}
            >
              {uploadPublic ? 'Publish publicly' : 'Keep private'}
            </button>
          </div>

          <UploadInterface albumId={uploadAlbum} visibility={uploadPublic ? 'Public' : 'Private'} />

          <div className="flex flex-wrap items-end gap-2 border-t border-accent/10 pt-4">
            <div className="min-w-[180px] flex-1 space-y-1.5">
              <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">New album</Label>
              <Input
                value={newAlbum}
                onChange={(e) => setNewAlbum(e.target.value)}
                placeholder="Album title"
                className="h-9 rounded-none border-accent/10 bg-background text-xs"
              />
            </div>
            <Button
              variant="outline"
              disabled={!newAlbum.trim() || addAlbum.isPending}
              onClick={() => addAlbum.mutate(newAlbum.trim())}
              className="h-9 rounded-none border-accent/20 text-[10px] font-bold uppercase tracking-widest"
            >
              Create album
            </Button>
          </div>

          {albums.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(albums as any[]).map((a) => (
                <button
                  key={a.id}
                  onClick={() => patchAlbum.mutate({ id: a.id, patch: { is_public: !a.is_public } })}
                  className={`border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${
                    a.is_public ? 'border-accent/40 text-accent' : 'border-accent/10 text-muted-foreground'
                  }`}
                >
                  {a.title} · {a.is_public ? 'Public' : 'Hidden'}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <CollageStudio
        photos={collagePhotos}
        onPublished={async (collage) => {
          try {
            await createMediaItem({
              title: collage.title,
              media_type: 'Photo',
              category: 'Worship Service',
              file_url: collage.file_url,
              thumbnail_url: collage.thumbnail_url,
              visibility: 'Public',
              file_size: collage.fileSize,
              file_type: 'JPG',
              album_id: uploadAlbum,
            });
            toast.success('Collage published to Worship Media');
            refresh();
          } catch (error: any) {
            toast.error(`Publish failed: ${error.message}`);
          }
        }}
      />

      {/* Filters */}
      <div className="space-y-2.5 border border-accent/5 bg-muted/20 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="SEARCH ASSETS..."
            className="h-9 w-full border border-accent/10 bg-background pl-9 pr-3 text-[10px] uppercase tracking-widest focus:border-accent/30 focus:outline-none"
          />
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`shrink-0 border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] ${
                typeFilter === t ? 'border-accent bg-accent/10 text-accent' : 'border-accent/10 text-muted-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse border border-accent/5 bg-muted/30" />
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="border border-dashed border-accent/10 p-12 text-center">
          <p className="text-[10px] uppercase tracking-widest italic text-muted-foreground">
            {mediaItems.length === 0 ? 'Your media library is empty — upload your first files.' : 'No assets match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredMedia.map((item) => {
            const isPublic = item.visibility === 'Public';
            return (
              <div key={item.id} className="group flex flex-col border border-accent/5 bg-muted/10 transition-colors hover:border-accent/20">
                <div className="relative aspect-square overflow-hidden bg-muted/20">
                  {item.thumbnail_url || item.media_type === 'Photo' ? (
                    <img
                      src={item.thumbnail_url || item.file_url}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-accent/20">{icon(item.media_type)}</div>
                  )}
                  <span className="absolute left-1.5 top-1.5 bg-background/85 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-accent backdrop-blur-sm">
                    {item.media_type}
                  </span>
                  {item.featured && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center bg-accent text-primary">
                      <Star className="h-3 w-3" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 space-y-1.5 p-2.5">
                  {editing?.id === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={editing?.title ?? ''}
                        onChange={(e) => setEditing({ id: item.id, title: e.target.value })}
                        className="h-7 rounded-none border-accent/20 bg-background text-xs"
                      />
                      <button
                        onClick={() => {
                          patchItem.mutate({ id: item.id, patch: { title: editing?.title.trim() || item.title } });
                          setEditing(null);
                        }}
                        className="text-accent"
                        aria-label="Save title"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditing({ id: item.id, title: item.title })}
                      className="block w-full truncate text-left font-serif text-sm hover:text-accent"
                    >
                      {item.title}
                    </button>
                  )}
                  <p className="truncate text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.category} {item.media_albums?.title ? `· ${item.media_albums.title}` : ''}
                  </p>

                  <div className="flex items-center justify-between gap-1 border-t border-accent/5 pt-2">
                    <button
                      onClick={() => patchItem.mutate({ id: item.id, patch: { visibility: isPublic ? 'Private' : 'Public' } })}
                      className={`flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest ${
                        isPublic ? 'text-accent' : 'text-muted-foreground'
                      }`}
                    >
                      {isPublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {isPublic ? 'Public' : 'Private'}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => patchItem.mutate({ id: item.id, patch: { featured: !item.featured } })}
                        aria-label="Toggle featured"
                        className={item.featured ? 'text-accent' : 'text-muted-foreground hover:text-accent'}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${item.title}"?`)) removeItem.mutate(item.id);
                        }}
                        aria-label="Delete media"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
