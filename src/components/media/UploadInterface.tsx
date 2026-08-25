import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function UploadInterface() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    setFiles(prev => [...prev, ...newFiles]);
    
    // Simulate upload for each file
    newFiles.forEach((fileObj, index) => {
      simulateUpload(fileObj.file.name);
    });
  }, []);

  const simulateUpload = (fileName: string) => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.file.name === fileName ? { ...f, progress: 100, status: 'success' } : f
        ));
      } else {
        setFiles(prev => prev.map(f => 
          f.file.name === fileName ? { ...f, progress } : f
        ));
      }
    }, 500);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.file.name !== name));
  };

  return (
    <div className="space-y-8">
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed border-accent/20 p-12 text-center transition-all cursor-pointer group",
          isDragActive ? "bg-accent/5 border-accent" : "hover:border-accent/40 bg-muted/5"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl">Upload Ministry Media</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Drag and drop photos, videos, or documents here, or click to select files.
            </p>
            <p className="text-[9px] text-accent/60 font-bold uppercase tracking-widest">
              Max file size: 50MB
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Upload Queue</h4>
          <div className="grid grid-cols-1 gap-3">
            {files.map((fileObj) => (
              <div 
                key={fileObj.file.name}
                className="p-4 bg-muted/20 border border-accent/5 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-accent/10 flex items-center justify-center text-accent">
                  <File className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                      {fileObj.file.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                      {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <Progress value={fileObj.progress} className="h-1 bg-accent/5" />
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-accent/10">
                  {fileObj.status === 'uploading' && <Loader2 className="w-4 h-4 text-accent animate-spin" />}
                  {fileObj.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {fileObj.status === 'error' && <AlertCircle className="w-4 h-4 text-destructive" />}
                  
                  <button 
                    onClick={() => removeFile(fileObj.file.name)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
