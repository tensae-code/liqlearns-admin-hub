import { motion } from 'framer-motion';
import { ParsedSlide, TextParagraph, TextRun, SlideShape } from '@/lib/pptxParser';

interface SlideRendererProps {
  slide: ParsedSlide;
  className?: string;
}

// Render individual text run with formatting
const RenderTextRun = ({ run }: { run: TextRun }) => {
  const style: React.CSSProperties = {};
  
  if (run.fontSize) style.fontSize = `${run.fontSize}pt`;
  if (run.color) style.color = run.color;
  if (run.fontFamily) style.fontFamily = run.fontFamily;
  
  let element = <span style={style}>{run.text}</span>;
  
  if (run.bold) element = <strong>{element}</strong>;
  if (run.italic) element = <em>{element}</em>;
  if (run.underline) element = <u>{element}</u>;
  
  return element;
};

// Render paragraph with alignment and bullets
const RenderParagraph = ({ paragraph, index }: { paragraph: TextParagraph; index: number }) => {
  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };
  
  const indent = paragraph.level ? `${paragraph.level * 1.5}rem` : '0';
  
  const content = (
    <span>
      {paragraph.runs.map((run, i) => (
        <RenderTextRun key={i} run={run} />
      ))}
    </span>
  );
  
  if (paragraph.bulletType === 'bullet') {
    return (
      <li 
        key={index}
        className={`${alignmentClasses[paragraph.alignment || 'left']} list-disc`}
        style={{ marginLeft: indent }}
      >
        {content}
      </li>
    );
  }
  
  if (paragraph.bulletType === 'number') {
    return (
      <li 
        key={index}
        className={`${alignmentClasses[paragraph.alignment || 'left']} list-decimal`}
        style={{ marginLeft: indent }}
      >
        {content}
      </li>
    );
  }
  
  return (
    <p 
      key={index}
      className={`${alignmentClasses[paragraph.alignment || 'left']} leading-relaxed`}
      style={{ marginLeft: indent }}
    >
      {content}
    </p>
  );
};

// Render a positioned shape
const RenderShape = ({ shape }: { shape: SlideShape }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${shape.x}%`,
    top: `${shape.y}%`,
    width: `${shape.width}%`,
    height: `${shape.height}%`,
    transform: shape.rotation ? `rotate(${shape.rotation}deg)` : undefined,
    backgroundColor: shape.fill,
    borderColor: shape.stroke,
    borderWidth: shape.strokeWidth,
  };
  
  if (shape.type === 'image' && shape.imageSrc) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={style}
        className="overflow-hidden rounded-lg shadow-lg"
      >
        <img
          src={shape.imageSrc}
          alt="Slide content"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </motion.div>
    );
  }
  
  if (shape.type === 'text' && shape.content) {
    const hasBullets = shape.content.some(p => p.bulletType);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        style={style}
        className="overflow-auto p-2"
      >
        {hasBullets ? (
          <ul className="space-y-1">
            {shape.content.map((para, i) => (
              <RenderParagraph key={i} paragraph={para} index={i} />
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            {shape.content.map((para, i) => (
              <RenderParagraph key={i} paragraph={para} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    );
  }
  
  return null;
};

// Layout-specific renderers
const TitleSlideLayout = ({ slide }: { slide: ParsedSlide }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <motion.h1
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-4xl md:text-6xl font-bold text-foreground mb-4"
    >
      {slide.title}
    </motion.h1>
    {slide.content.length > 0 && (
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-2xl text-muted-foreground"
      >
        {slide.content[0]}
      </motion.p>
    )}
  </div>
);

const TitleContentLayout = ({ slide }: { slide: ParsedSlide }) => (
  <div className="flex flex-col h-full p-8">
    <motion.h2
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-3xl md:text-4xl font-bold text-foreground mb-6"
    >
      {slide.title}
    </motion.h2>
    
    <div className="flex-1 flex gap-8">
      {/* Text content */}
      {slide.content.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`${slide.images.length > 0 ? 'flex-1' : 'w-full'} space-y-3`}
        >
          <ul className="space-y-3 list-disc list-inside">
            {slide.content.map((text, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="text-lg md:text-xl text-foreground/90 leading-relaxed"
              >
                {text.startsWith('•') ? text.slice(1).trim() : text}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
      
      {/* Images */}
      {slide.images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`${slide.content.length > 0 ? 'flex-1' : 'w-full'} flex flex-wrap gap-4 items-center justify-center`}
        >
          {slide.images.slice(0, 4).map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`Slide ${slide.index} image ${idx + 1}`}
              className="max-h-[300px] max-w-full object-contain rounded-lg shadow-lg"
              draggable={false}
            />
          ))}
        </motion.div>
      )}
    </div>
  </div>
);

const TwoColumnLayout = ({ slide }: { slide: ParsedSlide }) => {
  const midpoint = Math.ceil(slide.content.length / 2);
  const leftContent = slide.content.slice(0, midpoint);
  const rightContent = slide.content.slice(midpoint);
  
  return (
    <div className="flex flex-col h-full p-8">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center"
      >
        {slide.title}
      </motion.h2>
      
      <div className="flex-1 grid grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <ul className="space-y-2 list-disc list-inside">
            {leftContent.map((text, idx) => (
              <li key={idx} className="text-lg text-foreground/90 leading-relaxed">
                {text.startsWith('•') ? text.slice(1).trim() : text}
              </li>
            ))}
          </ul>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <ul className="space-y-2 list-disc list-inside">
            {rightContent.map((text, idx) => (
              <li key={idx} className="text-lg text-foreground/90 leading-relaxed">
                {text.startsWith('•') ? text.slice(1).trim() : text}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

const BlankLayout = ({ slide }: { slide: ParsedSlide }) => (
  <div className="flex items-center justify-center h-full">
    {slide.images.length > 0 ? (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-wrap gap-4 items-center justify-center p-8"
      >
        {slide.images.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`Slide ${slide.index} image ${idx + 1}`}
            className="max-h-[400px] max-w-full object-contain rounded-lg shadow-lg"
            draggable={false}
          />
        ))}
      </motion.div>
    ) : (
      <div className="text-center text-muted-foreground">
        <p className="text-6xl mb-4">📊</p>
        <p>Slide {slide.index}</p>
      </div>
    )}
  </div>
);

const SlideRenderer = ({ slide, className = '' }: SlideRendererProps) => {
  const hasShapes = slide.shapes && slide.shapes.length > 0;
  const backgroundStyles: React.CSSProperties = {
    backgroundColor: slide.backgroundColor,
    backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
    backgroundSize: slide.backgroundImage ? 'cover' : undefined,
    backgroundPosition: slide.backgroundImage ? 'center' : undefined,
    backgroundRepeat: slide.backgroundImage ? 'no-repeat' : undefined,
  };
  
  // If we have positioned shapes, render them absolutely
  if (hasShapes) {
    return (
      <motion.div
        key={slide.index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`w-full h-full relative ${className}`}
        style={backgroundStyles}
      >
        {/* Title */}
        {slide.title && slide.title !== 'Untitled Slide' && (
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 left-8 right-8 text-3xl md:text-4xl font-bold text-foreground"
          >
            {slide.title}
          </motion.h2>
        )}
        
        {/* Render positioned shapes */}
        {slide.shapes.map((shape, idx) => (
          <RenderShape key={idx} shape={shape} />
        ))}
        
        {/* Slide Number */}
        <div className="absolute bottom-4 right-4 text-sm text-muted-foreground/60 font-medium">
          {slide.index}
        </div>
      </motion.div>
    );
  }
  
  // Use layout-based rendering for slides without positioned shapes
  return (
    <motion.div
      key={slide.index}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`w-full h-full relative ${className}`}
      style={backgroundStyles}
    >
      {slide.layout === 'title' && <TitleSlideLayout slide={slide} />}
      {slide.layout === 'titleContent' && <TitleContentLayout slide={slide} />}
      {slide.layout === 'twoColumn' && <TwoColumnLayout slide={slide} />}
      {slide.layout === 'blank' && <BlankLayout slide={slide} />}
      {(slide.layout === 'custom' || !slide.layout) && <TitleContentLayout slide={slide} />}
      
      {/* Slide Number */}
      <div className="absolute bottom-4 right-4 text-sm text-muted-foreground/60 font-medium">
        {slide.index}
      </div>
    </motion.div>
  );
};

export default SlideRenderer;
