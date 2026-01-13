import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, MessageSquare, Image as ImageIcon, ChevronDown, CheckCircle2, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReviewAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  reviewCount: number;
  uploadedMaterials: number;
}

interface Review {
  id: string;
  author: ReviewAuthor;
  rating: number;
  moduleTag: string;
  moduleNumber: number;
  content: string;
  images?: string[];
  likes: number;
  date: string;
  helpful: boolean;
}

const mockReviews: Review[] = [
  {
    id: '1',
    author: {
      id: 'a1',
      name: 'Alemayehu M.',
      username: 'alemayehu_m',
      avatar: 'A',
      isVerified: true,
      reviewCount: 15,
      uploadedMaterials: 8,
    },
    rating: 5,
    moduleTag: 'Getting Started',
    moduleNumber: 1,
    content: 'Excellent introduction to the basics! The instructor explains concepts clearly and the practice exercises really helped solidify my understanding. Highly recommend for beginners.',
    images: ['https://via.placeholder.com/120', 'https://via.placeholder.com/120'],
    likes: 24,
    date: '2 days ago',
    helpful: true,
  },
  {
    id: '2',
    author: {
      id: 'a2',
      name: 'Sara T.',
      username: 'sara_t',
      avatar: 'S',
      isVerified: true,
      reviewCount: 8,
      uploadedMaterials: 3,
    },
    rating: 4,
    moduleTag: 'Basic Greetings',
    moduleNumber: 2,
    content: 'Great content! The pronunciation guides are very helpful. I wish there were more interactive exercises, but overall a solid module.',
    likes: 12,
    date: '1 week ago',
    helpful: false,
  },
  {
    id: '3',
    author: {
      id: 'a3',
      name: 'Dawit B.',
      username: 'dawit_b',
      avatar: 'D',
      isVerified: false,
      reviewCount: 3,
      uploadedMaterials: 0,
    },
    rating: 5,
    moduleTag: 'Numbers & Counting',
    moduleNumber: 3,
    content: 'This module really helped me grasp the number system. The flashcards feature is amazing for memorization!',
    images: ['https://via.placeholder.com/120'],
    likes: 8,
    date: '3 days ago',
    helpful: true,
  },
];

interface CourseReviewsProps {
  courseRating?: number;
  totalReviews?: number;
  onAuthorClick?: (author: ReviewAuthor) => void;
}

const CourseReviews = ({ 
  courseRating = 4.8, 
  totalReviews = 342,
  onAuthorClick 
}: CourseReviewsProps) => {
  const [filter, setFilter] = useState<'all' | number>('all');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [authorModalOpen, setAuthorModalOpen] = useState<ReviewAuthor | null>(null);

  const filteredReviews = filter === 'all' 
    ? mockReviews 
    : mockReviews.filter(r => r.moduleNumber === filter);

  const ratingDistribution = [
    { stars: 5, count: 245, percentage: 72 },
    { stars: 4, count: 68, percentage: 20 },
    { stars: 3, count: 20, percentage: 6 },
    { stars: 2, count: 6, percentage: 2 },
    { stars: 1, count: 3, percentage: 1 },
  ];

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <motion.div
        className="bg-card rounded-xl border border-border p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-6">
          {/* Overall Rating */}
          <div className="text-center">
            <p className="text-4xl font-display font-bold text-foreground">{courseRating}</p>
            <div className="flex items-center gap-0.5 justify-center my-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i}
                  className={cn(
                    'w-4 h-4',
                    i < Math.floor(courseRating) ? 'text-gold fill-gold' : 'text-muted-foreground'
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{totalReviews} reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-3">{stars}</span>
                <Star className="w-3 h-3 text-gold fill-gold" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gold rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Module Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Modules
        </Button>
        {[1, 2, 3, 4, 5].map(num => (
          <Button
            key={num}
            variant={filter === num ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(num)}
          >
            Module {num}
          </Button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review, i) => (
          <motion.div
            key={review.id}
            className="bg-card rounded-xl border border-border p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {/* Author Header */}
            <div className="flex items-start gap-3 mb-3">
              <button
                onClick={() => onAuthorClick?.(review.author)}
                className="flex-shrink-0 group"
              >
                <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-accent/50 transition-all">
                  <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                    {review.author.avatar}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onAuthorClick?.(review.author)}
                    className="font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {review.author.name}
                  </button>
                  {review.author.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    {review.moduleTag}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i}
                        className={cn(
                          'w-3 h-3',
                          i < review.rating ? 'text-gold fill-gold' : 'text-muted-foreground'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
              </div>
            </div>

            {/* Review Content */}
            <p className="text-sm text-foreground mb-3">{review.content}</p>

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-3">
                {review.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-20 h-20 rounded-lg bg-muted border border-border overflow-hidden"
                  >
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 text-sm">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <ThumbsUp className={cn('w-4 h-4', review.helpful && 'fill-accent text-accent')} />
                <span>{review.likes}</span>
              </button>
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>Reply</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Author Preview Modal */}
      <AnimatePresence>
        {authorModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthorModalOpen(null)}
          >
            <motion.div
              className="bg-card rounded-2xl p-5 max-w-sm w-full border border-border shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-accent/10 text-accent font-semibold text-xl">
                    {authorModalOpen.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{authorModalOpen.name}</p>
                    {authorModalOpen.isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{authorModalOpen.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-xl font-bold text-foreground">{authorModalOpen.reviewCount}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-xl font-bold text-foreground">{authorModalOpen.uploadedMaterials}</p>
                  <p className="text-xs text-muted-foreground">Materials</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline">
                  View Profile <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
                <Button className="flex-1">Follow</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseReviews;
