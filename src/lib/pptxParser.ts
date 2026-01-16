import JSZip from 'jszip';

export interface ParsedSlide {
  index: number;
  title: string;
  content: string[];
  notes: string;
  images: string[];
  backgroundColor: string;
}

export interface ParsedPresentation {
  title: string;
  author: string;
  totalSlides: number;
  slides: ParsedSlide[];
  thumbnails: string[];
}

// Parse text content from XML
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
  
  // Fall back to first text element
  const texts = parseTextFromXml(xmlString);
  return texts[0] || 'Untitled Slide';
};

// Extract background color from slide
const extractBackgroundColor = (xmlString: string): string => {
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
  };
  return types[ext || ''] || 'image/png';
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
    
    // Get slide notes
    let notes = '';
    const notesFile = zip.file(`ppt/notesSlides/notesSlide${i + 1}.xml`);
    if (notesFile) {
      const notesXml = await notesFile.async('text');
      notes = parseTextFromXml(notesXml).join(' ');
    }
    
    // Get slide relationships to find images
    const relsFile = zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`);
    const images: string[] = [];
    
    if (relsFile) {
      const relsXml = await relsFile.async('text');
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
    
    slides.push({
      index: i + 1,
      title: slideTitle,
      content,
      notes,
      images,
      backgroundColor,
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
