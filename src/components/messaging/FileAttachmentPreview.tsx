import { X, File, FileImage, FileAudio, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface FileAttachmentPreviewProps {
  file: File;
  onRemove: () => void;
  isUploading?: boolean;
}

const FileAttachmentPreview = ({ file, onRemove, isUploading }: FileAttachmentPreviewProps) => {
  const isImage = file.type.startsWith('image/');
  const isAudio = file.type.startsWith('audio/');
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIcon = () => {
    if (isImage) return <FileImage className="w-5 h-5" />;
    if (isAudio) return <FileAudio className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative flex items-center gap-3 p-3 bg-muted rounded-lg max-w-xs"
    >
      {isUploading && (
        <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}
      
      {isImage ? (
        <div className="w-12 h-12 rounded-md overflow-hidden shrink-0">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          {getIcon()}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-6 w-6"
        onClick={onRemove}
        disabled={isUploading}
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};

export default FileAttachmentPreview;
