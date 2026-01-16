import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Upload,
  Video,
  Music,
  Link as LinkIcon,
  FileType,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCourseResources } from '@/hooks/useCourseResources';

interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'video' | 'audio';
  courseId: string;
  moduleId: string;
  presentationId?: string;
  showAfterSlide: number;
  showBeforeSlide: number;
  totalSlides: number;
  onSave?: () => void;
}

const MediaUploadModal = ({
  open,
  onOpenChange,
  type,
  courseId,
  moduleId,
  presentationId,
  showAfterSlide,
  showBeforeSlide,
  totalSlides,
  onSave,
}: MediaUploadModalProps) => {
  const { uploadMedia, uploadProgress } = useCourseResources();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');

  const acceptedFormats = type === 'video' 
    ? '.mp4,.webm,.mov,.avi'
    : '.mp3,.wav,.ogg,.m4a';

  const maxSize = type === 'video' ? 500 : 50; // MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      toast.error(`File too large. Maximum size is ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (uploadMode === 'url' && !externalUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setIsUploading(true);
    try {
      if (uploadMode === 'file' && selectedFile) {
        await uploadMedia(
          selectedFile,
          type,
          title,
          courseId,
          moduleId,
          showAfterSlide,
          showBeforeSlide,
          presentationId
        );
      } else {
        // For URL mode, we'd create a resource with the URL directly
        // This would require a different hook method
        toast.info('URL embedding coming soon!');
        setIsUploading(false);
        return;
      }

      toast.success(`${type === 'video' ? 'Video' : 'Audio'} uploaded successfully!`);
      onOpenChange(false);
      onSave?.();
      
      // Reset form
      setTitle('');
      setSelectedFile(null);
      setExternalUrl('');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const Icon = type === 'video' ? Video : Music;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Icon className="w-5 h-5 text-accent" />
            Add {type === 'video' ? 'Video' : 'Audio'}
          </DialogTitle>
          <DialogDescription>
            Upload a {type} file or embed from an external URL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g., ${type === 'video' ? 'Introduction Video' : 'Lecture Recording'}`}
              className="mt-1"
            />
          </div>

          <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'file' | 'url')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                External URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats}
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <FileType className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <motion.div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">
                    Click to select {type}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {type === 'video' ? 'MP4, WebM, MOV, AVI' : 'MP3, WAV, OGG, M4A'} up to {maxSize}MB
                  </p>
                </motion.div>
              )}

              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uploading...</span>
                    <span className="font-medium text-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="mt-4 space-y-4">
              <div>
                <Label>External URL</Label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder={type === 'video' 
                    ? 'https://youtube.com/watch?v=...' 
                    : 'https://soundcloud.com/...'}
                  className="mt-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Supported: {type === 'video' 
                  ? 'YouTube, Vimeo, direct video URLs'
                  : 'SoundCloud, Spotify, direct audio URLs'}
              </p>
            </TabsContent>
          </Tabs>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Position: </span>
              Shown after slide {showAfterSlide}, before slide {showBeforeSlide}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {type === 'video' ? 'Video' : 'Audio'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaUploadModal;
