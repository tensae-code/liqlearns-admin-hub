import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCourses } from '@/hooks/useCourses';
import { toast } from 'sonner';
import {
  GripVertical,
  Plus,
  Trash2,
  BookOpen,
  Award,
  Target,
  Clock,
  ChevronRight,
  Search,
  X,
  Flag,
  Milestone,
  Trophy,
  Lock,
  Unlock,
  Loader2,
  Save
} from 'lucide-react';

interface LearningPathBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPath?: {
    id: string;
    title: string;
    description: string;
    courses: PathCourse[];
    milestones: PathMilestone[];
  };
}

interface PathCourse {
  id: string;
  courseId: string;
  title: string;
  isRequired: boolean;
  prerequisites: string[];
}

interface PathMilestone {
  id: string;
  title: string;
  description: string;
  triggerAfterCourseId?: string;
  triggerAtProgress?: number;
  xpReward: number;
}

const LearningPathBuilder = ({ open, onOpenChange, editingPath }: LearningPathBuilderProps) => {
  const { data: availableCourses = [] } = useCourses();
  const [step, setStep] = useState<'info' | 'courses' | 'milestones' | 'review'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [title, setTitle] = useState(editingPath?.title || '');
  const [description, setDescription] = useState(editingPath?.description || '');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Courses in path
  const [pathCourses, setPathCourses] = useState<PathCourse[]>(editingPath?.courses || []);
  
  // Milestones
  const [milestones, setMilestones] = useState<PathMilestone[]>(editingPath?.milestones || []);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    triggerAfterCourseId: '',
    triggerAtProgress: 0,
    xpReward: 100
  });

  const filteredCourses = availableCourses.filter(c => 
    !pathCourses.some(pc => pc.courseId === c.id) &&
    (searchQuery === '' || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addCourseToPath = (course: typeof availableCourses[0]) => {
    setPathCourses([...pathCourses, {
      id: `path-${Date.now()}`,
      courseId: course.id,
      title: course.title,
      isRequired: true,
      prerequisites: []
    }]);
  };

  const removeCourseFromPath = (courseId: string) => {
    setPathCourses(pathCourses.filter(c => c.id !== courseId));
    // Also remove from prerequisites
    setPathCourses(prev => prev.map(c => ({
      ...c,
      prerequisites: c.prerequisites.filter(p => p !== courseId)
    })));
  };

  const togglePrerequisite = (courseId: string, prerequisiteId: string) => {
    setPathCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const hasPrereq = c.prerequisites.includes(prerequisiteId);
        return {
          ...c,
          prerequisites: hasPrereq 
            ? c.prerequisites.filter(p => p !== prerequisiteId)
            : [...c.prerequisites, prerequisiteId]
        };
      }
      return c;
    }));
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) {
      toast.error('Please enter a milestone title');
      return;
    }
    setMilestones([...milestones, {
      id: `milestone-${Date.now()}`,
      ...newMilestone
    }]);
    setNewMilestone({
      title: '',
      description: '',
      triggerAfterCourseId: '',
      triggerAtProgress: 0,
      xpReward: 100
    });
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a path title');
      return;
    }
    if (pathCourses.length === 0) {
      toast.error('Please add at least one course');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(editingPath ? 'Learning path updated!' : 'Learning path created!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save learning path');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['info', 'courses', 'milestones', 'review'] as const;
  const currentStepIndex = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            {editingPath ? 'Edit Learning Path' : 'Create Learning Path'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg mb-4">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className="flex items-center gap-2"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i <= currentStepIndex ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:inline capitalize ${
                i <= currentStepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>
                {s}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
              )}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4">
          {/* Step 1: Basic Info */}
          {step === 'info' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Path Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Complete Amharic Mastery"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what learners will achieve..."
                  rows={3}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Duration (hours)</Label>
                  <Input
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g., 40"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Publish Path</Label>
                  <p className="text-sm text-muted-foreground">Make this path visible to members</p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>
            </motion.div>
          )}

          {/* Step 2: Add Courses */}
          {step === 'courses' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Search Courses */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses to add..."
                  className="pl-10"
                />
              </div>

              {/* Available Courses */}
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {filteredCourses.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-accent" />
                      <span className="font-medium text-foreground">{course.title}</span>
                      <Badge variant="secondary" className="text-xs">{course.difficulty}</Badge>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => addCourseToPath(course)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Path Courses (Reorderable) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Path Sequence ({pathCourses.length} courses)
                </Label>
                {pathCourses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Add courses from above to build your path</p>
                  </div>
                ) : (
                  <Reorder.Group values={pathCourses} onReorder={setPathCourses} className="space-y-2">
                    {pathCourses.map((course, index) => (
                      <Reorder.Item key={course.id} value={course}>
                        <Card className="cursor-grab active:cursor-grabbing">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{course.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={course.isRequired ? 'default' : 'secondary'} 
                                    className="text-xs cursor-pointer"
                                    onClick={() => setPathCourses(prev => prev.map(c => 
                                      c.id === course.id ? { ...c, isRequired: !c.isRequired } : c
                                    ))}
                                  >
                                    {course.isRequired ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                                    {course.isRequired ? 'Required' : 'Optional'}
                                  </Badge>
                                  {index > 0 && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs cursor-pointer"
                                      onClick={() => togglePrerequisite(course.id, pathCourses[index - 1].id)}
                                    >
                                      {course.prerequisites.includes(pathCourses[index - 1].id) 
                                        ? '✓ Requires previous' 
                                        : 'Set prerequisite'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-destructive"
                                onClick={() => removeCourseFromPath(course.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Milestones */}
          {step === 'milestones' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Add Milestone Form */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gold" />
                    Add Milestone
                  </Label>
                  <Input
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    placeholder="Milestone title (e.g., First Module Complete!)"
                  />
                  <Textarea
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="Celebration message..."
                    rows={2}
                  />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Trigger After Course</Label>
                      <Select 
                        value={newMilestone.triggerAfterCourseId} 
                        onValueChange={(v) => setNewMilestone({ ...newMilestone, triggerAfterCourseId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select course..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pathCourses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">XP Reward</Label>
                      <Input
                        type="number"
                        value={newMilestone.xpReward}
                        onChange={(e) => setNewMilestone({ ...newMilestone, xpReward: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <Button onClick={addMilestone} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Milestones */}
              <div className="space-y-2">
                <Label>Path Milestones ({milestones.length})</Label>
                {milestones.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No milestones added yet</p>
                    <p className="text-xs">Milestones celebrate learner progress!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {milestones.map((milestone, i) => (
                      <Card key={milestone.id}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                            <Milestone className="w-4 h-4 text-gold" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{milestone.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>+{milestone.xpReward} XP</span>
                              {milestone.triggerAfterCourseId && (
                                <span>• After: {pathCourses.find(c => c.id === milestone.triggerAfterCourseId)?.title}</span>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => removeMilestone(milestone.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Path Title</Label>
                    <p className="text-lg font-semibold text-foreground">{title || 'Untitled Path'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-foreground">{description || 'No description'}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <Label className="text-muted-foreground">Difficulty</Label>
                      <Badge className="capitalize">{difficulty}</Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Duration</Label>
                      <p className="text-foreground">{estimatedDuration || '—'} hours</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge variant={isPublished ? 'default' : 'secondary'}>
                        {isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Label className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4" />
                    Course Sequence ({pathCourses.length})
                  </Label>
                  <div className="space-y-2">
                    {pathCourses.map((course, i) => (
                      <div key={course.id} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-medium text-accent">
                          {i + 1}
                        </div>
                        <span className="text-foreground">{course.title}</span>
                        {!course.isRequired && <Badge variant="secondary" className="text-xs">Optional</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Label className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-gold" />
                    Milestones ({milestones.length})
                  </Label>
                  {milestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No milestones configured</p>
                  ) : (
                    <div className="space-y-2">
                      {milestones.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-sm">
                          <Milestone className="w-4 h-4 text-gold" />
                          <span className="text-foreground">{m.title}</span>
                          <Badge variant="secondary" className="text-xs">+{m.xpReward} XP</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              const prevIndex = currentStepIndex - 1;
              if (prevIndex >= 0) setStep(steps[prevIndex]);
            }}
            disabled={currentStepIndex === 0}
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === 'review' ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingPath ? 'Update Path' : 'Create Path'}
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={() => {
                const nextIndex = currentStepIndex + 1;
                if (nextIndex < steps.length) setStep(steps[nextIndex]);
              }}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LearningPathBuilder;
