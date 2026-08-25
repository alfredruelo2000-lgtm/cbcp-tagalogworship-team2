import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket: string;
  className?: string;
}

export function ImageUpload({ value, onChange, bucket, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  const logDiagnostic = (msg: string) => {
    console.log(`[ImageUpload Diagnostic] ${msg}`);
    setDiagnostics(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`].slice(-5));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setDiagnostics([]);
    logDiagnostic(`File selected: ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)`);
    
    // Create local preview and validate dimensions
    logDiagnostic("Generating local preview and checking dimensions...");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        logDiagnostic(`Dimensions detected: ${img.width}x${img.height}px`);
        const ratio = img.width / img.height;
        logDiagnostic(`Aspect ratio: ${ratio.toFixed(2)}:1`);

        // Warn if not roughly square (personnel profiles usually expect 1:1)
         if (Math.abs(ratio - 1) > 0.2) {
           const warning = "Note: images display best when square (1:1 ratio).";
           logDiagnostic(`Display Warning: ${warning}`);
           toast(warning);
         }

        // Check for minimum resolution (e.g. 200px)
        if (img.width < 200 || img.height < 200) {
          const warning = "Low resolution: Photos below 200px may appear blurry.";
          logDiagnostic(`Display Warning: ${warning}`);
        }

        setPreview(reader.result as string);
        logDiagnostic("Local preview generated.");
        startActualUpload(file);
      };
      img.onerror = () => {
        const msg = "Could not read image dimensions.";
        logDiagnostic(`Error: ${msg}`);
        setError(msg);
        setPreview(null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const msg = 'Invalid file type. Please upload an image (PNG, JPG, WEBP).';
      logDiagnostic(`Validation failed: ${msg}`);
      setError(msg);
      toast.error(msg);
      setPreview(null);
      return;
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      const msg = 'File too large. Maximum size is 5MB.';
      logDiagnostic(`Validation failed: ${msg}`);
      setError(msg);
      toast.error(msg);
      setPreview(null);
      return;
    }
  };

  const startActualUpload = async (file: File) => {
    logDiagnostic("File accepted. Starting upload...");
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    try {
      if (!file.name) throw new Error('Invalid file name');

      logDiagnostic(`Uploading to bucket: ${bucket} at path: ${filePath}`);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        logDiagnostic(`Storage upload failed: ${uploadError.message}`);
        throw uploadError;
      }

      logDiagnostic("Storage upload successful. Fetching public URL...");
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      logDiagnostic(`Public URL generated: ${publicUrl.substring(0, 50)}...`);

      // Verify reachability
      logDiagnostic("Verifying image reachability...");
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (response.ok) {
        logDiagnostic("Image is reachable and verified.");
      } else {
        logDiagnostic(`Image reachability check returned status: ${response.status}`);
      }

      onChange(publicUrl);
      setPreview(null);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error details:', error);
      const errorMessage = error.message || error.error_description || 'Unknown upload error';
      logDiagnostic(`Critical error: ${errorMessage}`);
      setError(errorMessage);
      toast.error('Upload failed: ' + errorMessage);
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    logDiagnostic("Removing image...");
    onChange('');
    setPreview(null);
    setError(null);
    setDiagnostics([]);
  };

  const displayImage = preview || value;

  return (
    <div className={cn("relative group", className)}>
      <div className="space-y-3">
        <div 
          className={cn(
            "relative w-full aspect-square border-2 transition-all duration-300 overflow-hidden",
            error 
              ? "border-red-500/50 bg-red-500/5" 
              : displayImage 
                ? "border-accent/20 bg-muted/10" 
                : "border-dashed border-accent/10 bg-muted/20 hover:bg-muted/30 hover:border-accent/30"
          )}
        >
          {displayImage ? (
            <>
              <img 
                src={displayImage} 
                alt="Upload preview" 
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  !preview && "grayscale group-hover:grayscale-0",
                  preview && "opacity-70 animate-pulse"
                )} 
              />
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="cursor-pointer bg-accent text-primary px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-accent/90 transition-colors shadow-lg">
                  Change
                  <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept="image/*" />
                </label>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-none h-8 px-3 text-[9px] font-bold uppercase tracking-[0.2em] shadow-lg"
                  onClick={handleRemove}
                >
                  Remove
                </Button>
              </div>

              {preview && (
                <div className="absolute bottom-0 left-0 right-0 bg-accent/90 py-1 text-center">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-primary animate-pulse">Processing...</p>
                </div>
              )}
            </>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 text-center">
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-[9px] uppercase tracking-widest text-accent font-bold">Uploading...</p>
                </div>
              ) : (
                <>
                  <Upload className={cn("w-8 h-8 mb-3 transition-colors", error ? "text-red-500/50" : "text-accent/40")} />
                  <div className="space-y-1">
                    <p className={cn("text-[10px] uppercase tracking-widest font-bold", error ? "text-red-500" : "text-accent")}>
                      {error ? 'Upload Failed' : 'Select Photo'}
                    </p>
                    <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground leading-relaxed">
                      JPG, PNG, WEBP<br />Max size 5MB
                    </p>
                  </div>
                </>
              )}
              <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept="image/*" />
            </label>
          )}

          {isUploading && displayImage && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          )}
        </div>
        
        <div className="min-h-[20px]">
          {error ? (
            <div className="flex items-start gap-2 text-red-500 animate-in fade-in slide-in-from-top-1 duration-300">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-bold leading-tight">
                  Upload Error
                </p>
                <p className="text-[8px] uppercase tracking-widest text-red-400/80 leading-tight">
                  {error}
                </p>
              </div>
            </div>
          ) : displayImage && !preview ? (
            <div className="flex items-center gap-2 text-green-500/60 animate-in fade-in duration-500">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <p className="text-[8px] uppercase tracking-[0.2em] font-bold">Live Photo Synced</p>
            </div>
          ) : null}

          {diagnostics.length > 0 && (
            <div className="mt-4 p-3 bg-muted/30 border border-accent/5 font-mono text-[7px] leading-tight text-muted-foreground/70 uppercase tracking-tighter">
              <div className="flex items-center gap-1.5 mb-2 border-b border-accent/5 pb-1">
                <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                <span>Upload Diagnostics</span>
              </div>
              <div className="space-y-1">
                {diagnostics.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="opacity-50 shrink-0">{d.split(': ')[0]}</span>
                    <span>{d.split(': ').slice(1).join(': ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

