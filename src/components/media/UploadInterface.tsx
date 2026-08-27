import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File as FileIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { MEDIA_MAX_BYTES, uploadMediaFile } from '@/lib/media-upload';
import { createMediaItem } from '@/lib/db-resources.functions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface FileWithProgress {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadInterfaceProps {
  /** Album to attach uploads to. */
  albumId?: string | null;
  /** Visibility applied to newly created records. */
  visibility?: 'Public' | 'Worship Team' | 'Leaders Only' | 'Private';
  category?: string;
}

export function UploadInterface({ albumId = null, visibility = 'Public', category = 'Worship Service' }: UploadInterfaceProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const queryClient = useQueryClient();

  const patch = (id: string, next: Partial<FileWithProgress>) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...next } : f)));

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const queued = acceptedFiles.map((file) => ({
        file,
        entry: {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'uploading' as const,
        },
      }));
      setFiles((prev) => [...prev, ...queued.map((q) => q.entry)]);

      void (async () => {
        for (const { file, entry } of queued) {
          try {
            const uploaded = await uploadMediaFile(file, (p) => patch(entry.id, { progress: p }));
            await createMediaItem({
              title: file.name.replace(/\.[^.]+$/, ''),
              file_url: uploaded.url,
              thumbnail_url: uploaded.mediaType === 'Photo' ? uploaded.url : null,
              media_type: uploaded.mediaType,
              file_size: uploaded.fileSize,
              file_type: uploaded.fileType,
              album_id: albumId,
              visibility,
              category,
            });
            patch(entry.id, { progress: 100, status: 'success' });
          } catch (error: any) {
            patch(entry.id, { status: 'error', error: error?.message ?? 'Upload failed' });
            toast.error(`${file.name}: ${error?.message ?? 'Upload failed'}`);
          }
        }
        void queryClient.invalidateQueries({ queryKey: ['media-items'] });
        void queryClient.invalidateQueries({ queryKey: ['media-public'] });
      })();
    },
    [albumId, visibility, category, queryClient],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'application/pdf': ['.pdf'],
    },
    maxSize: MEDIA_MAX_BYTES,
  });

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="space-y-5">
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer border-2 border-dashed border-accent/20 px-4 py-8 text-center transition-all',
          isDragActive ? 'border-accent bg-accent/5' : 'bg-muted/5 hover:border-accent/40',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent">
            <Upload className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg sm:text-xl">Upload Ministry Media</h3>
            <p className="mx-auto max-w-xs text-xs text-muted-foreground">
              Drop photos, videos, audio or PDFs here, or tap to select. Multiple files supported.
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-accent/60">Max 50MB per file</p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Upload Queue</h4>
          {files.map((f) => (
            <div key={f.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-accent/5 bg-muted/20 p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center bg-accent/10 text-accent">
                <FileIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="truncate text-xs font-medium text-foreground">{f.name}</span>
                  <span className="shrink-0 text-[9px] uppercase tracking-widest text-muted-foreground">
                    {(f.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <Progress value={f.progress} className="h-1 bg-accent/5" />
                {f.error && <p className="mt-1 text-[9px] text-destructive">{f.error}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2 border-l border-accent/10 pl-3">
                {f.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                {f.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {f.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-foreground" aria-label="Remove">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
