import JSZip from 'jszip';

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
}

export interface TextParagraph {
  runs: TextRun[];
  alignment?: 'left' | 'center' | 'right' | 'justify';
  bulletType?: 'none' | 'bullet' | 'number';
  level?: number;
}

export interface SlideShape {
  type: 'text' | 'image' | 'shape' | 'table';
  x: number; // percentage of slide width
  y: number; // percentage of slide height
  width: number; // percentage
  height: number; // percentage
  rotation?: number;
  content?: TextParagraph[];
  imageSrc?: string;
  shapeType?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface ParsedSlide {
  index: number;
  title: string;
  content: string[];
  notes: string;
  images: string[];
  backgroundColor: string;
  shapes: SlideShape[];
  layout: 'title' | 'titleContent' | 'twoColumn' | 'blank' | 'custom';
}

export interface ParsedPresentation {
  title: string;
  author: string;
  totalSlides: number;
  slides: ParsedSlide[];
  thumbnails: string[];
}

// EMU (English Metric Units) to percentage conversion
const EMU_PER_INCH = 914400;
const SLIDE_WIDTH_EMU = 9144000; // Standard 10 inch
const SLIDE_HEIGHT_EMU = 6858000; // Standard 7.5 inch

const emuToPercent = (emu: number, isWidth: boolean): number => {
  const base = isWidth ? SLIDE_WIDTH_EMU : SLIDE_HEIGHT_EMU;
  return (emu / base) * 100;
};

// Parse text runs with formatting
const parseTextRuns = (paragraphXml: string): TextRun[] => {
  const runs: TextRun[] = [];
  const runMatches = paragraphXml.match(/<a:r>[\s\S]*?<\/a:r>/g) || [];
  
  for (const runXml of runMatches) {
    const textMatch = runXml.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
    if (!textMatch) continue;
    
    const text = textMatch[1];
    const run: TextRun = { text };
    
    // Check for bold
    if (runXml.includes('b="1"') || runXml.includes('<a:b/>')) {
      run.bold = true;
    }
    
    // Check for italic
    if (runXml.includes('i="1"') || runXml.includes('<a:i/>')) {
      run.italic = true;
    }
    
    // Check for underline
    if (runXml.includes('u="sng"') || runXml.includes('<a:u')) {
      run.underline = true;
    }
    
    // Extract font size (in hundredths of a point)
    const sizeMatch = runXml.match(/sz="(\d+)"/);
    if (sizeMatch) {
      run.fontSize = parseInt(sizeMatch[1]) / 100;
    }
    
    // Extract color
    const colorMatch = runXml.match(/<a:srgbClr val="([^"]+)"/);
    if (colorMatch) {
      run.color = `#${colorMatch[1]}`;
    }
    
    // Extract font family
    const fontMatch = runXml.match(/<a:latin typeface="([^"]+)"/);
    if (fontMatch) {
      run.fontFamily = fontMatch[1];
    }
    
    runs.push(run);
  }
  
  return runs;
};

// Parse paragraphs with alignment and bullets
const parseParagraphs = (shapeXml: string): TextParagraph[] => {
  const paragraphs: TextParagraph[] = [];
  const pMatches = shapeXml.match(/<a:p>[\s\S]*?<\/a:p>/g) || [];
  
  for (const pXml of pMatches) {
    const runs = parseTextRuns(pXml);
    if (runs.length === 0) continue;
    
    const paragraph: TextParagraph = { runs };
    
    // Check alignment
    if (pXml.includes('algn="ctr"')) paragraph.alignment = 'center';
    else if (pXml.includes('algn="r"')) paragraph.alignment = 'right';
    else if (pXml.includes('algn="just"')) paragraph.alignment = 'justify';
    else paragraph.alignment = 'left';
    
    // Check for bullets
    if (pXml.includes('<a:buChar') || pXml.includes('<a:buAutoNum')) {
      paragraph.bulletType = pXml.includes('<a:buAutoNum') ? 'number' : 'bullet';
    }
    
    // Check indent level
    const lvlMatch = pXml.match(/lvl="(\d+)"/);
    if (lvlMatch) {
      paragraph.level = parseInt(lvlMatch[1]);
    }
    
    paragraphs.push(paragraph);
  }
  
  return paragraphs;
};

// Parse shape position and size
const parseShapeTransform = (shapeXml: string): { x: number; y: number; width: number; height: number; rotation?: number } | null => {
  const xfrmMatch = shapeXml.match(/<a:xfrm[^>]*>[\s\S]*?<\/a:xfrm>/);
  if (!xfrmMatch) return null;
  
  const xfrm = xfrmMatch[0];
  
  const offMatch = xfrm.match(/<a:off x="(\d+)" y="(\d+)"\/>/);
  const extMatch = xfrm.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
  const rotMatch = xfrm.match(/rot="(\d+)"/);
  
  if (!offMatch || !extMatch) return null;
  
  return {
    x: emuToPercent(parseInt(offMatch[1]), true),
    y: emuToPercent(parseInt(offMatch[2]), false),
    width: emuToPercent(parseInt(extMatch[1]), true),
    height: emuToPercent(parseInt(extMatch[2]), false),
    rotation: rotMatch ? parseInt(rotMatch[1]) / 60000 : undefined, // Convert from 1/60000 degrees
  };
};

// Parse text content from XML (legacy support)
const parseTextFromXml = (xmlString: string): string[] => {
  const textMatches = xmlString.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
  return textMatches
    .map(match => {
      const textMatch = match.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
      return textMatch ? textMatch[1].trim() : '';
    })
    .filter(text => text.length > 0);
};

// Extract title from slide XML
const extractSlideTitle = (xmlString: string): string => {
  // Look for title placeholder
  const titleMatch = xmlString.match(/<p:ph[^>]*type="title"[^>]*>[\s\S]*?<a:t[^>]*>([^<]*)<\/a:t>/i);
  if (titleMatch) return titleMatch[1].trim();
  
  // Look for centered title placeholder
  const ctrTitleMatch = xmlString.match(/<p:ph[^>]*type="ctrTitle"[^>]*>[\s\S]*?<a:t[^>]*>([^<]*)<\/a:t>/i);
  if (ctrTitleMatch) return ctrTitleMatch[1].trim();
  
  // Fall back to first text element
  const texts = parseTextFromXml(xmlString);
  return texts[0] || 'Untitled Slide';
};

// Detect slide layout type
const detectLayout = (xmlString: string): ParsedSlide['layout'] => {
  if (xmlString.includes('type="ctrTitle"')) return 'title';
  if (xmlString.includes('type="twoColTx"')) return 'twoColumn';
  if (xmlString.includes('type="body"') || xmlString.includes('type="subTitle"')) return 'titleContent';
  if (parseTextFromXml(xmlString).length === 0) return 'blank';
  return 'custom';
};

// Extract background color from slide
const extractBackgroundColor = (xmlString: string): string => {
  // Check for solid fill
  const solidFillMatch = xmlString.match(/<p:bgPr>[\s\S]*?<a:srgbClr val="([^"]+)"[\s\S]*?<\/p:bgPr>/);
  if (solidFillMatch) return `#${solidFillMatch[1]}`;
  
  const colorMatch = xmlString.match(/<a:srgbClr val="([^"]+)"/);
  if (colorMatch) return `#${colorMatch[1]}`;
  return '#ffffff';
};

// Convert image to base64 data URL
const imageToDataUrl = async (data: ArrayBuffer, contentType: string): Promise<string> => {
  const blob = new Blob([data], { type: contentType });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Get content type from file extension
const getContentType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'emf': 'image/x-emf',
    'wmf': 'image/x-wmf',
    'tiff': 'image/tiff',
    'bmp': 'image/bmp',
  };
  return types[ext || ''] || 'image/png';
};

// Parse shapes from slide XML
const parseShapes = (slideXml: string, mediaFiles: Record<string, string>, relsXml: string): SlideShape[] => {
  const shapes: SlideShape[] = [];
  
  // Match all shape trees
  const spTreeMatch = slideXml.match(/<p:spTree>[\s\S]*<\/p:spTree>/);
  if (!spTreeMatch) return shapes;
  
  const spTree = spTreeMatch[0];
  
  // Parse text shapes (sp elements)
  const spMatches = spTree.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || [];
  for (const spXml of spMatches) {
    const transform = parseShapeTransform(spXml);
    if (!transform) continue;
    
    // Skip placeholder types we handle separately
    if (spXml.includes('type="title"') || spXml.includes('type="ctrTitle"')) continue;
    
    const content = parseParagraphs(spXml);
    if (content.length === 0) continue;
    
    // Extract fill color
    let fill: string | undefined;
    const fillMatch = spXml.match(/<a:solidFill>[\s\S]*?<a:srgbClr val="([^"]+)"[\s\S]*?<\/a:solidFill>/);
    if (fillMatch) fill = `#${fillMatch[1]}`;
    
    shapes.push({
      type: 'text',
      ...transform,
      content,
      fill,
    });
  }
  
  // Parse picture shapes (pic elements)
  const picMatches = spTree.match(/<p:pic>[\s\S]*?<\/p:pic>/g) || [];
  for (const picXml of picMatches) {
    const transform = parseShapeTransform(picXml);
    if (!transform) continue;
    
    // Get relationship ID
    const rIdMatch = picXml.match(/r:embed="([^"]+)"/);
    if (!rIdMatch) continue;
    
    // Find image path from relationships
    const relPattern = new RegExp(`Id="${rIdMatch[1]}"[^>]*Target="([^"]+)"`);
    const relMatch = relsXml.match(relPattern);
    if (!relMatch) continue;
    
    const targetPath = relMatch[1].replace('../', 'ppt/');
    const imageSrc = mediaFiles[targetPath];
    if (!imageSrc) continue;
    
    shapes.push({
      type: 'image',
      ...transform,
      imageSrc,
    });
  }
  
  return shapes;
};

export const parsePPTX = async (file: File): Promise<ParsedPresentation> => {
  const zip = await JSZip.loadAsync(file);
  
  // Get presentation properties
  let title = file.name.replace('.pptx', '');
  let author = 'Unknown';
  
  const corePropsFile = zip.file('docProps/core.xml');
  if (corePropsFile) {
    const corePropsXml = await corePropsFile.async('text');
    const titleMatch = corePropsXml.match(/<dc:title>([^<]*)<\/dc:title>/);
    const authorMatch = corePropsXml.match(/<dc:creator>([^<]*)<\/dc:creator>/);
    if (titleMatch) title = titleMatch[1] || title;
    if (authorMatch) author = authorMatch[1] || author;
  }
  
  // Get all slide files
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
      return numA - numB;
    });
  
  // Extract media files
  const mediaFiles: Record<string, string> = {};
  const mediaEntries = Object.keys(zip.files).filter(name => name.startsWith('ppt/media/'));
  
  for (const mediaPath of mediaEntries) {
    const mediaFile = zip.file(mediaPath);
    if (mediaFile) {
      const data = await mediaFile.async('arraybuffer');
      const contentType = getContentType(mediaPath);
      mediaFiles[mediaPath] = await imageToDataUrl(data, contentType);
    }
  }
  
  // Parse each slide
  const slides: ParsedSlide[] = [];
  const thumbnails: string[] = [];
  
  for (let i = 0; i < slideFiles.length; i++) {
    const slideFile = zip.file(slideFiles[i]);
    if (!slideFile) continue;
    
    const slideXml = await slideFile.async('text');
    
    // Extract slide content
    const slideTitle = extractSlideTitle(slideXml);
    const allText = parseTextFromXml(slideXml);
    const content = allText.slice(1); // Skip title
    const backgroundColor = extractBackgroundColor(slideXml);
    const layout = detectLayout(slideXml);
    
    // Get slide notes
    let notes = '';
    const notesFile = zip.file(`ppt/notesSlides/notesSlide${i + 1}.xml`);
    if (notesFile) {
      const notesXml = await notesFile.async('text');
      notes = parseTextFromXml(notesXml).join(' ');
    }
    
    // Get slide relationships
    const relsFile = zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`);
    let relsXml = '';
    const images: string[] = [];
    
    if (relsFile) {
      relsXml = await relsFile.async('text');
      const imageRels = relsXml.match(/Target="\.\.\/media\/[^"]+"/g) || [];
      
      for (const rel of imageRels) {
        const pathMatch = rel.match(/Target="\.\.\/media\/([^"]+)"/);
        if (pathMatch) {
          const mediaPath = `ppt/media/${pathMatch[1]}`;
          if (mediaFiles[mediaPath]) {
            images.push(mediaFiles[mediaPath]);
          }
        }
      }
    }
    
    // Parse shapes with positioning
    const shapes = parseShapes(slideXml, mediaFiles, relsXml);
    
    slides.push({
      index: i + 1,
      title: slideTitle,
      content,
      notes,
      images,
      backgroundColor,
      shapes,
      layout,
    });
    
    // Generate simple thumbnail placeholder (first image or background)
    thumbnails.push(images[0] || '');
  }
  
  return {
    title,
    author,
    totalSlides: slides.length,
    slides,
    thumbnails,
  };
};

// Lighter parse for quick slide count
export const getSlideCount = async (file: File): Promise<number> => {
  const zip = await JSZip.loadAsync(file);
  const slideFiles = Object.keys(zip.files).filter(name => 
    name.match(/ppt\/slides\/slide\d+\.xml$/)
  );
  return slideFiles.length;
};
