import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  TrendingUp
} from 'lucide-react';

const Courses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Courses', count: 48 },
    { id: 'language', label: 'Languages', count: 12 },
    { id: 'culture', label: 'Culture', count: 8 },
    { id: 'tech', label: 'Technology', count: 15 },
    { id: 'business', label: 'Business', count: 7 },
    { id: 'kids', label: 'Kids Zone', count: 6 },
  ];

  const courses = [
    {
      id: '1',
      title: 'Amharic for Beginners',
      description: 'Learn the fundamentals of Amharic language with native speakers',
      category: 'language',
      difficulty: 'Beginner',
      lessons: 24,
      duration: '6 hours',
      rating: 4.8,
      students: 1250,
      instructor: 'Dr. Alemayehu',
      thumbnail: '📚',
      price: 0,
      featured: true,
    },
    {
      id: '2',
      title: 'Ethiopian History & Culture',
      description: 'Explore the rich heritage and traditions of Ethiopia',
      category: 'culture',
      difficulty: 'All Levels',
      lessons: 18,
      duration: '4.5 hours',
      rating: 4.9,
      students: 890,
      instructor: 'Prof. Sara',
      thumbnail: '🏛️',
      price: 499,
      featured: true,
    },
    {
      id: '3',
      title: 'Web Development Bootcamp',
      description: 'Master HTML, CSS, JavaScript, and React from scratch',
      category: 'tech',
      difficulty: 'Intermediate',
      lessons: 48,
      duration: '12 hours',
      rating: 4.7,
      students: 2100,
      instructor: 'Eng. Dawit',
      thumbnail: '💻',
      price: 799,
      featured: false,
    },
    {
      id: '4',
      title: 'Business English',
      description: 'Professional English for workplace communication',
      category: 'business',
      difficulty: 'Intermediate',
      lessons: 20,
      duration: '5 hours',
      rating: 4.6,
      students: 650,
      instructor: 'Ms. Hannah',
      thumbnail: '💼',
      price: 599,
      featured: false,
    },
    {
      id: '5',
      title: 'Kids Amharic Fun',
      description: 'Interactive Amharic lessons for children ages 5-12',
      category: 'kids',
      difficulty: 'Beginner',
      lessons: 30,
      duration: '3 hours',
      rating: 4.9,
      students: 450,
      instructor: 'Teacher Meron',
      thumbnail: '🎨',
      price: 299,
      featured: true,
    },
    {
      id: '6',
      title: 'Geez Script Mastery',
      description: 'Learn to read and write the ancient Ethiopian script',
      category: 'language',
      difficulty: 'Advanced',
      lessons: 15,
      duration: '4 hours',
      rating: 4.8,
      students: 320,
      instructor: 'Dr. Yonas',
      thumbnail: '✍️',
      price: 699,
      featured: false,
    },
    {
      id: '7',
      title: 'Mobile App Development',
      description: 'Build iOS and Android apps with React Native',
      category: 'tech',
      difficulty: 'Advanced',
      lessons: 36,
      duration: '10 hours',
      rating: 4.5,
      students: 780,
      instructor: 'Eng. Bereket',
      thumbnail: '📱',
      price: 899,
      featured: false,
    },
    {
      id: '8',
      title: 'Ethiopian Coffee Culture',
      description: 'Discover the art of Ethiopian coffee ceremony',
      category: 'culture',
      difficulty: 'Beginner',
      lessons: 8,
      duration: '2 hours',
      rating: 4.9,
      students: 1100,
      instructor: 'Auntie Tigist',
      thumbnail: '☕',
      price: 0,
      featured: true,
    },
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredCourses = courses.filter(c => c.featured);

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
        {categories.map((cat) => (
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
        ))}
      </motion.div>

      {/* Featured Courses */}
      {selectedCategory === 'all' && (
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
            {featuredCourses.map((course, i) => (
              <motion.div
                key={course.id}
                className="bg-gradient-hero text-primary-foreground rounded-xl p-5 cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => navigate(`/course/${course.id}`)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <span className="text-3xl mb-3 block">{course.thumbnail}</span>
                <h3 className="font-display font-semibold mb-1">{course.title}</h3>
                <p className="text-sm text-primary-foreground/70 mb-3 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-gold fill-gold" />
                    <span>{course.rating}</span>
                  </div>
                  {course.price === 0 ? (
                    <Badge className="bg-success/20 text-success border-0">Free</Badge>
                  ) : (
                    <span className="text-sm font-medium">{course.price} ETB</span>
                  )}
                </div>
              </motion.div>
            ))}
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
              {selectedCategory === 'all' ? 'All Courses' : categories.find(c => c.id === selectedCategory)?.label}
            </h2>
            <span className="text-sm text-muted-foreground">({filteredCourses.length})</span>
          </div>
          <Button variant="ghost" size="sm">
            Sort by <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, i) => (
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
                <span className="text-5xl">{course.thumbnail}</span>
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="text-xs">
                    {course.difficulty}
                  </Badge>
                </div>
                <Button 
                  size="icon" 
                  className="absolute bottom-3 right-3 rounded-full bg-accent text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span>{course.instructor}</span>
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
                    <span>{course.lessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      <span className="font-medium">{course.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                  </div>
                  {course.price === 0 ? (
                    <Badge className="bg-success/10 text-success border-success/30">Free</Badge>
                  ) : (
                    <span className="font-display font-bold text-accent">{course.price} ETB</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No courses found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Courses;
