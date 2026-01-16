import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  BookOpen, 
  Plus,
  MoreVertical,
  Users,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface EnterpriseCourseManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Course {
  id: string;
  title: string;
  category: string;
  enrolledCount: number;
  completionRate: number;
  duration: string;
  status: 'active' | 'draft' | 'archived';
  isRequired: boolean;
}

const mockCourses: Course[] = [
  { id: '1', title: 'Leadership Fundamentals', category: 'Leadership', enrolledCount: 45, completionRate: 72, duration: '4 hours', status: 'active', isRequired: true },
  { id: '2', title: 'Project Management Essentials', category: 'Management', enrolledCount: 38, completionRate: 85, duration: '6 hours', status: 'active', isRequired: true },
  { id: '3', title: 'Effective Communication', category: 'Soft Skills', enrolledCount: 52, completionRate: 68, duration: '3 hours', status: 'active', isRequired: false },
  { id: '4', title: 'Data Analysis Basics', category: 'Technical', enrolledCount: 28, completionRate: 45, duration: '8 hours', status: 'active', isRequired: false },
  { id: '5', title: 'Cybersecurity Awareness', category: 'Security', enrolledCount: 67, completionRate: 92, duration: '2 hours', status: 'active', isRequired: true },
  { id: '6', title: 'Advanced Excel', category: 'Technical', enrolledCount: 0, completionRate: 0, duration: '5 hours', status: 'draft', isRequired: false },
];

const EnterpriseCourseManager = ({ open, onOpenChange }: EnterpriseCourseManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = mockCourses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Course['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case 'draft':
        return <Badge className="bg-gold/10 text-gold border-gold/30">Draft</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
    }
  };

  const handleDuplicateCourse = (course: Course) => {
    toast.success(`"${course.title}" duplicated!`);
  };

  const handleArchiveCourse = (course: Course) => {
    toast.success(`"${course.title}" archived`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-accent" />
            Course Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-accent">{mockCourses.filter(c => c.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground">Active Courses</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{mockCourses.reduce((acc, c) => acc + c.enrolledCount, 0)}</p>
              <p className="text-xs text-muted-foreground">Total Enrollments</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-success">
                {Math.round(mockCourses.reduce((acc, c) => acc + c.completionRate, 0) / mockCourses.length)}%
              </p>
              <p className="text-xs text-muted-foreground">Avg. Completion</p>
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredCourses.map(course => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground truncate">{course.title}</p>
                        {course.isRequired && (
                          <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Required</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {course.enrolledCount} enrolled
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </span>
                        <span>{course.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="hidden md:block w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-medium text-foreground">{course.completionRate}%</span>
                      </div>
                      <Progress value={course.completionRate} className="h-2" />
                    </div>
                    {getStatusBadge(course.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateCourse(course)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleArchiveCourse(course)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnterpriseCourseManager;
