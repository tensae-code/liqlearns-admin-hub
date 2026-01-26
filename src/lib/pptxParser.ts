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
  backgroundImage?: string;
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
  // More flexible matching for xfrm - handle both namespace formats
  const xfrmMatch = shapeXml.match(/<(?:a:)?xfrm[^>]*>[\s\S]*?<\/(?:a:)?xfrm>/i);
  if (!xfrmMatch) return null;
  
  const xfrm = xfrmMatch[0];
  
  // More flexible offset matching - handle different quote styles and spacing
  const offMatch = xfrm.match(/<(?:a:)?off\s+x=["']?(\d+)["']?\s+y=["']?(\d+)["']?\s*\/?>/i);
  const extMatch = xfrm.match(/<(?:a:)?ext\s+cx=["']?(\d+)["']?\s+cy=["']?(\d+)["']?\s*\/?>/i);
  const rotMatch = xfrm.match(/rot=["']?(\d+)["']?/);
  
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
  // Check for solid fill in background properties
  const bgPrMatch = xmlString.match(/<p:bgPr>[\s\S]*?<a:srgbClr val="([^"]+)"[\s\S]*?<\/p:bgPr>/);
  if (bgPrMatch) return `#${bgPrMatch[1]}`;
  
  // Check for solid fill in cSld > bg (common in newer PPTX)
  const cSldBgMatch = xmlString.match(/<p:cSld[^>]*>[\s\S]*?<p:bg>[\s\S]*?<a:srgbClr val="([^"]+)"/);
  if (cSldBgMatch) return `#${cSldBgMatch[1]}`;
  
  // Check for solid fill in spTree shapes that might be acting as background
  // Look for rectangle shapes with fills early in the shape tree
  const bgRectMatch = xmlString.match(/<a:solidFill>[\s\S]*?<a:srgbClr val="([^"]+)"/);
  if (bgRectMatch) return `#${bgRectMatch[1]}`;
  
  // Check for schemeClr (theme colors) - common values
  const schemeClrMatch = xmlString.match(/<p:bg>[\s\S]*?<a:schemeClr val="([^"]+)"/);
  if (schemeClrMatch) {
    // Map common theme colors - these are approximations
    const themeColors: Record<string, string> = {
      'bg1': '#ffffff',
      'bg2': '#f2f2f2',
      'tx1': '#000000',
      'tx2': '#666666',
      'accent1': '#4472c4',
      'accent2': '#ed7d31',
      'accent3': '#a5a5a5',
      'accent4': '#ffc000',
      'accent5': '#5b9bd5',
      'accent6': '#70ad47',
      'lt1': '#ffffff',
      'lt2': '#e7e6e6',
      'dk1': '#000000',
      'dk2': '#44546a',
    };
    return themeColors[schemeClrMatch[1]] || '#ffffff';
  }
  
  return '#ffffff';
};

/**
 * Parse XML with DOMParser and find the background image embedded via r:embed in the slide
 * and resolve the corresponding Target from the slide rels XML.
 *
 * This is more robust than regex and handles namespace prefixes by checking localName and attribute localName.
 *
 * Returns data URL string from mediaFiles map if found, or undefined.
 */
export const extractBackgroundImage = (
  slideXml: string,
  relsXml: string,
  mediaFiles: Record<string, string>
): string | undefined => {
  try {
    if (!slideXml || !relsXml) return undefined;
    
    // DOMParser exists in browser; in test environment the test runner should set jsdom
    const parser = new DOMParser();
    const slideDoc = parser.parseFromString(slideXml, 'application/xml');
    
    // find <p:bg> (namespace-insensitive)
    const allNodes = Array.from(slideDoc.getElementsByTagName('*'));
    const bgNode = allNodes.find(n => n.localName === 'bg' || n.nodeName.toLowerCase().endsWith(':bg'));
    if (!bgNode) return undefined;
    
    // search for any element under bgNode that carries an 'embed' attribute (r:embed)
    let relId: string | undefined;
    const bgChildren = Array.from(bgNode.getElementsByTagName('*'));
    for (const c of [bgNode, ...bgChildren]) {
      for (let i = 0; i < c.attributes.length; i++) {
        const attr = c.attributes[i];
        if (attr && attr.localName === 'embed') {
          relId = attr.value;
          break;
        }
      }
      if (relId) break;
    }
    if (!relId) return undefined;
    
    // parse rels XML
    const relsDoc = parser.parseFromString(relsXml, 'application/xml');
    const relNodes = Array.from(relsDoc.getElementsByTagName('*'));
    const relNode = relNodes.find(n => {
      const id = n.getAttribute('Id') || n.getAttribute('id');
      return id === relId;
    });
    if (!relNode) return undefined;
    
    const target = relNode.getAttribute('Target') || relNode.getAttribute('target');
    if (!target) return undefined;
    
    // convert ../media/xxx to ppt/media/xxx
    const targetPath = target.replace(/^\.\.\//, 'ppt/');
    return mediaFiles[targetPath];
  } catch (err) {
    console.warn('[pptxParser] extractBackgroundImage failed with error:', err);
    return undefined;
  }
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
  
  // Parse picture shapes (pic elements) - handle various namespace formats
  const picMatches = spTree.match(/<(?:p:)?pic[^>]*>[\s\S]*?<\/(?:p:)?pic>/gi) || [];
  for (const picXml of picMatches) {
    const transform = parseShapeTransform(picXml);
    if (!transform) continue;
    
    // Get relationship ID - try different attribute patterns
    const rIdMatch = picXml.match(/(?:r:embed|embed)=["']([^"']+)["']/i);
    if (!rIdMatch) continue;
    
    // Find image path from relationships - flexible matching
    const relIdToFind = rIdMatch[1];
    const relPatterns = [
      new RegExp(`Id=["']${relIdToFind}["'][^>]*Target=["']([^"']+)["']`, 'i'),
      new RegExp(`Target=["']([^"']+)["'][^>]*Id=["']${relIdToFind}["']`, 'i'),
    ];
    
    let targetPath: string | null = null;
    for (const pattern of relPatterns) {
      const match = relsXml.match(pattern);
      if (match) {
        targetPath = match[1];
        break;
      }
    }
    if (!targetPath) continue;
    
    // Normalize the target path
    const normalizedPath = targetPath.replace(/^\.\.\//, 'ppt/');
    const imageSrc = mediaFiles[normalizedPath];
    if (!imageSrc) continue;
    
    shapes.push({
      type: 'image',
      ...transform,
      imageSrc,
    });
  }
  
  return shapes;
};

// Helper to get layout/master background
const getLayoutBackground = async (
  zip: JSZip,
  slideRelsXml: string,
  mediaFiles: Record<string, string>
): Promise<{ backgroundColor?: string; backgroundImage?: string }> => {
  // Find the layout reference in slide rels
  const layoutMatch = slideRelsXml.match(/Target="\.\.\/slideLayouts\/slideLayout(\d+)\.xml"/);
  if (!layoutMatch) return {};
  
  const layoutNum = layoutMatch[1];
  const layoutFile = zip.file(`ppt/slideLayouts/slideLayout${layoutNum}.xml`);
  if (!layoutFile) return {};
  
  const layoutXml = await layoutFile.async('text');
  
  // Check layout for background color
  const layoutBgColor = extractBackgroundColor(layoutXml);
  
  // Check layout rels for background image
  const layoutRelsFile = zip.file(`ppt/slideLayouts/_rels/slideLayout${layoutNum}.xml.rels`);
  let layoutBgImage: string | undefined;
  
  if (layoutRelsFile) {
    const layoutRelsXml = await layoutRelsFile.async('text');
    layoutBgImage = extractBackgroundImage(layoutXml, layoutRelsXml, mediaFiles);
    
    // If no background image from layout, check slide master
    if (!layoutBgImage) {
      const masterMatch = layoutRelsXml.match(/Target="\.\.\/slideMasters\/slideMaster(\d+)\.xml"/);
      if (masterMatch) {
        const masterNum = masterMatch[1];
        const masterFile = zip.file(`ppt/slideMasters/slideMaster${masterNum}.xml`);
        const masterRelsFile = zip.file(`ppt/slideMasters/_rels/slideMaster${masterNum}.xml.rels`);
        
        if (masterFile && masterRelsFile) {
          const masterXml = await masterFile.async('text');
          const masterRelsXml = await masterRelsFile.async('text');
          layoutBgImage = extractBackgroundImage(masterXml, masterRelsXml, mediaFiles);
          
          // Also get master background color if layout didn't have one
          if (layoutBgColor === '#ffffff') {
            const masterBgColor = extractBackgroundColor(masterXml);
            if (masterBgColor !== '#ffffff') {
              return { backgroundColor: masterBgColor, backgroundImage: layoutBgImage };
            }
          }
        }
      }
    }
  }
  
  return {
    backgroundColor: layoutBgColor !== '#ffffff' ? layoutBgColor : undefined,
    backgroundImage: layoutBgImage,
  };
};

// Extract images from layout/master that should appear on all slides using that layout
const getLayoutImages = async (
  zip: JSZip,
  slideRelsXml: string,
  mediaFiles: Record<string, string>
): Promise<string[]> => {
  const images: string[] = [];
  
  // Find the layout reference
  const layoutMatch = slideRelsXml.match(/Target="\.\.\/slideLayouts\/slideLayout(\d+)\.xml"/);
  if (!layoutMatch) return images;
  
  const layoutNum = layoutMatch[1];
  const layoutRelsFile = zip.file(`ppt/slideLayouts/_rels/slideLayout${layoutNum}.xml.rels`);
  
  if (layoutRelsFile) {
    const layoutRelsXml = await layoutRelsFile.async('text');
    
    // Get all image references from layout
    const imageRels = layoutRelsXml.match(/Target="\.\.\/media\/[^"]+"/g) || [];
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
  
  return images;
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
    let backgroundColor = extractBackgroundColor(slideXml);
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

    // Get background image from slide itself first
    let backgroundImage = relsXml
      ? extractBackgroundImage(slideXml, relsXml, mediaFiles)
      : undefined;

    // If no background found on slide, check layout/master
    if (!backgroundImage && backgroundColor === '#ffffff' && relsXml) {
      const layoutBg = await getLayoutBackground(zip, relsXml, mediaFiles);
      if (layoutBg.backgroundImage) {
        backgroundImage = layoutBg.backgroundImage;
      }
      if (layoutBg.backgroundColor) {
        backgroundColor = layoutBg.backgroundColor;
      }
      
      // Also get decorative images from layout
      const layoutImages = await getLayoutImages(zip, relsXml, mediaFiles);
      for (const img of layoutImages) {
        if (!images.includes(img)) {
          images.push(img);
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
      backgroundImage,
      shapes,
      layout,
    });
    
    // Generate simple thumbnail placeholder (first image or background)
    thumbnails.push(images[0] || backgroundImage || '');
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
