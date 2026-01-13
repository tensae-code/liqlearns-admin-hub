import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Star, 
  Users,
  Play,
  ChevronRight,
  Sparkles,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useCourses, useCategories, useEnrollInCourse } from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';
import { getGradient } from '@/lib/theme';

const CourseCardSkeleton = () => (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <Skeleton className="h-32 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between pt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  </div>
);

const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const enrollMutation = useEnrollInCourse();

  // Fallback categories if database is empty
  const displayCategories = categories.length > 0 ? categories : [
    { id: 'all', label: 'All Courses', count: 0, emoji: '📖' },
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredCourses = courses.slice(0, 4); // Show first 4 as featured

  const handleEnroll = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    enrollMutation.mutate(courseId);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Self-paced';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    return `${mins}m`;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-1">
          Course Catalog 📖
        </h1>
        <p className="text-muted-foreground">Explore our library of courses and start learning</p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        className="flex flex-col md:flex-row gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </motion.div>

      {/* Categories */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {categoriesLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-full flex-shrink-0" />
          ))
        ) : (
          displayCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.label}
              <span className="text-xs opacity-70">({cat.count})</span>
            </button>
          ))
        )}
      </motion.div>

      {/* Featured Courses */}
      {selectedCategory === 'all' && featuredCourses.length > 0 && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-display font-semibold text-foreground">Featured Courses</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {coursesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))
            ) : (
              featuredCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  className={`bg-gradient-to-br ${getGradient(i)} text-white rounded-xl p-5 cursor-pointer hover:scale-[1.02] transition-transform relative`}
                  onClick={() => navigate(`/course/${course.id}`)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  {course.is_enrolled && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                  )}
                  <span className="text-3xl mb-3 block">{course.thumbnail_emoji}</span>
                  <h3 className="font-display font-semibold mb-1">{course.title}</h3>
                  <p className="text-sm text-white/80 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-white/80">
                      <Users className="w-4 h-4" />
                      <span>{course.enrollment_count}</span>
                    </div>
                    {!course.price || course.price === 0 ? (
                      <Badge className="bg-success/20 text-success border-0">Free</Badge>
                    ) : (
                      <span className="text-sm font-medium">{course.price} ETB</span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Course Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-semibold text-foreground">
              {selectedCategory === 'all' ? 'All Courses' : displayCategories.find(c => c.id === selectedCategory)?.label}
            </h2>
            <span className="text-sm text-muted-foreground">({filteredCourses.length})</span>
          </div>
          <Button variant="ghost" size="sm">
            Sort by <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))
          ) : (
            filteredCourses.map((course, i) => (
              <motion.div
                key={course.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-accent/30 hover:shadow-elevated transition-all cursor-pointer group"
                onClick={() => navigate(`/course/${course.id}`)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
              >
                {/* Thumbnail */}
                <div className="h-32 bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center relative">
                  <span className="text-5xl">{course.thumbnail_emoji}</span>
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="text-xs">
                      {course.difficulty}
                    </Badge>
                  </div>
                  {course.is_enrolled ? (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-success/20 text-success border-success/30 gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Enrolled
                      </Badge>
                    </div>
                  ) : (
                    <Button 
                      size="icon" 
                      className="absolute bottom-3 right-3 rounded-full bg-accent text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleEnroll(e, course.id)}
                      disabled={enrollMutation.isPending}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{course.instructor?.full_name || 'LiqLearns'}</span>
                    <span>•</span>
                    <span className="capitalize">{course.category}</span>
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.total_lessons || 0} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(course.estimated_duration)}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{course.enrollment_count?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                    {!course.price || course.price === 0 ? (
                      <Badge className="bg-success/10 text-success border-success/30">Free</Badge>
                    ) : (
                      <span className="font-display font-bold text-accent">{course.price} ETB</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {!coursesLoading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              {courses.length === 0 
                ? "No courses have been published yet. Check back soon!" 
                : "Try adjusting your search or filters"}
            </p>
            {courses.length === 0 && (
              <Button onClick={() => navigate('/teacher')} variant="outline">
                Create a Course
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Courses;
