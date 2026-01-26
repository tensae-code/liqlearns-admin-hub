import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseImageGalleryProps {
  images: string[];
  thumbnailUrl?: string | null;
  category?: string;
}

const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    language: '📚',
    culture: '🏛️',
    tech: '💻',
    business: '💼',
    kids: '🎨',
    science: '🔬',
    arts: '🎭',
    music: '🎵',
    health: '💪',
    default: '📖',
  };
  return emojiMap[category?.toLowerCase()] || emojiMap.default;
};

const CourseImageGallery = ({ images, thumbnailUrl, category = 'default' }: CourseImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Combine thumbnail with gallery images
  const allImages = thumbnailUrl ? [thumbnailUrl, ...images] : images;
  const hasMultipleImages = allImages.length > 1;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  // If no images at all, show placeholder
  if (allImages.length === 0) {
    return (
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
        <span className="text-6xl md:text-8xl">{getCategoryEmoji(category)}</span>
      </div>
    );
  }

  const currentImage = allImages[currentIndex];
  const hasError = imageErrors.has(currentIndex);

  return (
    <div className="relative h-48 md:h-64 overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          {hasError ? (
            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
              <span className="text-6xl md:text-8xl">{getCategoryEmoji(category)}</span>
            </div>
          ) : (
            <img
              src={currentImage}
              alt={`Course preview ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              onError={() => handleImageError(currentIndex)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {hasMultipleImages && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {hasMultipleImages && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {allImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}

      {/* Image count badge */}
      {hasMultipleImages && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 text-white text-xs flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          {currentIndex + 1}/{allImages.length}
        </div>
      )}
    </div>
  );
};

export default CourseImageGallery;
