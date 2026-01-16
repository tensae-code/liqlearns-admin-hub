import { motion } from 'framer-motion';
import { ParsedSlide } from '@/lib/pptxParser';

interface SlideRendererProps {
  slide: ParsedSlide;
  className?: string;
}

const SlideRenderer = ({ slide, className = '' }: SlideRendererProps) => {
  const hasImages = slide.images.length > 0;
  const hasContent = slide.content.length > 0;
  
  return (
    <motion.div
      key={slide.index}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`w-full h-full flex flex-col items-center justify-center p-8 ${className}`}
      style={{ backgroundColor: slide.backgroundColor }}
    >
      {/* Title */}
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center max-w-4xl">
        {slide.title}
      </h2>
      
      {/* Content Layout */}
      <div className={`flex-1 w-full max-w-5xl flex ${hasImages && hasContent ? 'gap-8' : ''} items-center justify-center`}>
        {/* Text Content */}
        {hasContent && (
          <div className={`${hasImages ? 'flex-1' : 'w-full'} space-y-4`}>
            {slide.content.map((text, idx) => (
              <p key={idx} className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                {text.startsWith('•') ? text : `• ${text}`}
              </p>
            ))}
          </div>
        )}
        
        {/* Images */}
        {hasImages && (
          <div className={`${hasContent ? 'flex-1' : 'w-full'} flex flex-wrap gap-4 items-center justify-center`}>
            {slide.images.slice(0, 4).map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Slide ${slide.index} image ${idx + 1}`}
                className="max-h-[300px] max-w-full object-contain rounded-lg shadow-lg"
                draggable={false}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Empty State */}
      {!hasContent && !hasImages && (
        <div className="text-center text-muted-foreground">
          <p className="text-6xl mb-4">📊</p>
          <p>Slide {slide.index}</p>
        </div>
      )}
      
      {/* Slide Number Badge */}
      <div className="absolute bottom-4 right-4 text-sm text-muted-foreground/60 font-medium">
        {slide.index}
      </div>
    </motion.div>
  );
};

export default SlideRenderer;
