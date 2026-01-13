import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, BookOpen, Users, Star, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CourseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    title: string;
    description: string;
    instructor: string;
    category: string;
    level: string;
    duration: string;
    lessons: number;
    students: number;
    rating: number;
    reviews: number;
    requirements?: string[];
    learningOutcomes?: string[];
  };
}

const CourseInfoModal = ({ isOpen, onClose, course }: CourseInfoModalProps) => {
  const requirements = course.requirements || [
    'Basic understanding of the subject',
    'Willingness to practice daily',
    'Access to a computer or mobile device',
  ];

  const outcomes = course.learningOutcomes || [
    'Master fundamental concepts',
    'Apply knowledge in real-world scenarios',
    'Earn a verified certificate upon completion',
    'Join a community of learners',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-card rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-border shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-accent px-2 py-0.5 bg-accent/10 rounded-full">
                      {course.category}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                      {course.level}
                    </span>
                  </div>
                  <h2 className="text-xl font-display font-bold text-foreground">{course.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">by {course.instructor}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">About this Course</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Duration</span>
                  </div>
                  <p className="font-semibold text-foreground">{course.duration}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs">Lessons</span>
                  </div>
                  <p className="font-semibold text-foreground">{course.lessons} lessons</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">Students</span>
                  </div>
                  <p className="font-semibold text-foreground">{course.students.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Star className="w-4 h-4 text-gold" />
                    <span className="text-xs">Rating</span>
                  </div>
                  <p className="font-semibold text-foreground">{course.rating} ({course.reviews})</p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Requirements</h3>
                <ul className="space-y-2">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Learning Outcomes */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">What You'll Learn</h3>
                <ul className="space-y-2">
                  {outcomes.map((outcome, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Completion Note */}
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-accent" />
                  <span className="font-semibold text-foreground">Certification</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete <strong className="text-foreground">80% of the modules</strong> to earn your official certificate and course badge.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CourseInfoModal;
