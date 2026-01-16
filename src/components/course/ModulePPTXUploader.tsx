import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileType,
  Presentation,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Eye,
  X,
  GripVertical,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { parsePPTX, ParsedPresentation, ParsedSlide } from '@/lib/pptxParser';
import SlideRenderer from './SlideRenderer';

interface SlideResource {
  id: string;
  type: 'video' | 'audio' | 'quiz' | 'flashcard';
  title: string;
  showAfterSlide: number;
  showBeforeSlide: number;
}

interface UploadedPPTX {
  id: string;
  fileName: string;
  totalSlides: number;
  uploadedAt: string;
  resources: SlideResource[];
  slides?: ParsedSlide[];
}

interface ModulePPTXUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  onSave: (pptxData: UploadedPPTX) => void;
}

const resourceTypes = [
  { id: 'video', label: 'Video', icon: '🎬' },
  { id: 'audio', label: 'Audio', icon: '🎧' },
  { id: 'quiz', label: 'Quiz', icon: '📝' },
  { id: 'flashcard', label: 'Flashcards', icon: '🃏' },
];

const ModulePPTXUploader = ({ open, onOpenChange, moduleId, moduleName, onSave }: ModulePPTXUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pptxData, setPptxData] = useState<UploadedPPTX | null>(null);
  const [parsedPresentation, setParsedPresentation] = useState<ParsedPresentation | null>(null);
  const [currentPreviewSlide, setCurrentPreviewSlide] = useState(1);
  const [resources, setResources] = useState<SlideResource[]>([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResource, setNewResource] = useState({
    type: 'video' as 'video' | 'audio' | 'quiz' | 'flashcard',
    title: '',
    showAfterSlide: 1,
    showBeforeSlide: 2
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      toast.error('Please upload a .pptx file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast.error('File size must be under 100MB');
      return;
    }

    setIsUploading(true);
    setIsParsing(true);
    setUploadProgress(0);

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      // Parse the PPTX file
      const parsed = await parsePPTX(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setParsedPresentation(parsed);
      
      const pptx: UploadedPPTX = {
        id: `pptx-${Date.now()}`,
        fileName: file.name,
        totalSlides: parsed.totalSlides,
        uploadedAt: new Date().toISOString(),
        resources: [],
        slides: parsed.slides
      };

      setPptxData(pptx);
      toast.success('PPTX parsed successfully!', {
        description: `${parsed.totalSlides} slides extracted`
      });
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Failed to parse PPTX file', {
        description: 'Please ensure the file is a valid PowerPoint presentation'
      });
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  const handleAddResource = () => {
    if (!newResource.title.trim()) {
      toast.error('Please enter a resource title');
      return;
    }

    if (newResource.showAfterSlide >= newResource.showBeforeSlide) {
      toast.error('End slide must be after start slide');
      return;
    }

    const resource: SlideResource = {
      id: `res-${Date.now()}`,
      ...newResource
    };

    setResources([...resources, resource]);
    setNewResource({
      type: 'video',
      title: '',
      showAfterSlide: 1,
      showBeforeSlide: 2
    });
    setShowAddResource(false);
    toast.success('Resource added!');
  };

  const handleRemoveResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const handleSave = () => {
    if (!pptxData) return;

    onSave({
      ...pptxData,
      resources
    });

    toast.success('Module presentation saved!');
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setPptxData(null);
    setResources([]);
    setCurrentPreviewSlide(1);
    setShowAddResource(false);
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) resetState();
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Presentation className="w-5 h-5 text-accent" />
            Upload Presentation - {moduleName}
          </DialogTitle>
          <DialogDescription>
            Upload a PPTX file and add interactive resources between slides
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          {!pptxData && (
            <motion.div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isUploading ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pptx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isUploading ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                    <FileType className="w-8 h-8 text-accent animate-pulse" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Processing presentation...</p>
                    <p className="text-sm text-muted-foreground">Extracting slides</p>
                  </div>
                  <Progress value={uploadProgress} className="h-2 max-w-xs mx-auto" />
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Upload PowerPoint</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop your .pptx file or click to browse
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Select PPTX File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Maximum file size: 100MB
                  </p>
                </>
              )}
            </motion.div>
          )}

          {/* PPTX Preview & Resources */}
          {pptxData && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Presentation className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{pptxData.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {pptxData.totalSlides} slides
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPptxData(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Slide Preview */}
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Slide Preview
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPreviewSlide(Math.max(1, currentPreviewSlide - 1))}
                      disabled={currentPreviewSlide === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium text-foreground px-3">
                      {currentPreviewSlide} / {pptxData.totalSlides}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPreviewSlide(Math.min(pptxData.totalSlides, currentPreviewSlide + 1))}
                      disabled={currentPreviewSlide === pptxData.totalSlides}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Real Slide Display */}
                <div className="aspect-video bg-card border border-border rounded-lg flex items-center justify-center overflow-hidden">
                  {parsedPresentation && parsedPresentation.slides[currentPreviewSlide - 1] ? (
                    <SlideRenderer 
                      slide={parsedPresentation.slides[currentPreviewSlide - 1]}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <p className="text-6xl mb-4">📊</p>
                      <p className="text-muted-foreground">Slide {currentPreviewSlide}</p>
                    </div>
                  )}
                </div>

                {/* Show resources for current slide */}
                {resources.filter(r => 
                  currentPreviewSlide >= r.showAfterSlide && 
                  currentPreviewSlide < r.showBeforeSlide
                ).length > 0 && (
                  <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                    <p className="text-xs font-medium text-accent mb-2">Resources shown at this slide:</p>
                    {resources.filter(r => 
                      currentPreviewSlide >= r.showAfterSlide && 
                      currentPreviewSlide < r.showBeforeSlide
                    ).map(r => (
                      <Badge key={r.id} variant="secondary" className="mr-2">
                        {resourceTypes.find(t => t.id === r.type)?.icon} {r.title}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Resources Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Interactive Resources ({resources.length})
                  </h4>
                  <Button variant="outline" size="sm" onClick={() => setShowAddResource(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                </div>

                {/* Resource List */}
                <div className="space-y-2">
                  {resources.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground bg-muted/30 rounded-lg">
                      <p>No resources added yet</p>
                      <p className="text-sm mt-1">Add videos, quizzes, or flashcards between slides</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {resources.map((resource) => (
                        <motion.div
                          key={resource.id}
                          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <span className="text-2xl">
                            {resourceTypes.find(t => t.id === resource.type)?.icon}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{resource.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Show after slide {resource.showAfterSlide}, before slide {resource.showBeforeSlide}
                            </p>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {resource.type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveResource(resource.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {/* Add Resource Form */}
                <AnimatePresence>
                  {showAddResource && (
                    <motion.div
                      className="p-4 bg-muted/50 rounded-lg border border-border space-y-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-foreground">Add Resource</h5>
                        <Button variant="ghost" size="sm" onClick={() => setShowAddResource(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Resource Type</Label>
                          <Select
                            value={newResource.type}
                            onValueChange={(v) => setNewResource({ ...newResource, type: v as any })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {resourceTypes.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.icon} {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Resource Title</Label>
                          <Input
                            value={newResource.title}
                            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                            placeholder="e.g., Practice Quiz"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Show after slide</Label>
                          <Input
                            type="number"
                            min={1}
                            max={pptxData.totalSlides}
                            value={newResource.showAfterSlide}
                            onChange={(e) => setNewResource({ 
                              ...newResource, 
                              showAfterSlide: parseInt(e.target.value) || 1 
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Show before slide</Label>
                          <Input
                            type="number"
                            min={1}
                            max={pptxData.totalSlides + 1}
                            value={newResource.showBeforeSlide}
                            onChange={(e) => setNewResource({ 
                              ...newResource, 
                              showBeforeSlide: parseInt(e.target.value) || 2 
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddResource(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddResource}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Resource
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-gradient-accent">
                  Save Presentation
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModulePPTXUploader;
