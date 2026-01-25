import { describe, it, expect } from 'vitest';
import { extractBackgroundImage } from '../pptxParser';

describe('extractBackgroundImage', () => {
  it('extracts background image when r:embed is present and rels has matching Target', () => {
    const slideXml = `
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <p:cSld>
          <p:bg>
            <p:bgRef>
              <a:blipFill>
                <a:blip r:embed="rId1"/>
              </a:blipFill>
            </p:bgRef>
          </p:bg>
        </p:cSld>
      </p:sld>
    `;
    const relsXml = `
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
      </Relationships>
    `;
    const mediaFiles: Record<string, string> = {
      'ppt/media/image1.png': 'data:image/png;base64,AAAA',
    };

    const result = extractBackgroundImage(slideXml, relsXml, mediaFiles);
    expect(result).toBe('data:image/png;base64,AAAA');
  });

  it('returns undefined when no background section', () => {
    const slideXml = `<p:sld></p:sld>`;
    const relsXml = `<Relationships></Relationships>`;
    const mediaFiles: Record<string, string> = {};

    const result = extractBackgroundImage(slideXml, relsXml, mediaFiles);
    expect(result).toBeUndefined();
  });

  it('returns undefined when rels does not contain matching Id', () => {
    const slideXml = `
      <p:sld xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <p:bg>
          <p:bgRef>
            <a:blipFill>
              <a:blip r:embed="rIdMissing"/>
            </a:blipFill>
          </p:bgRef>
        </p:bg>
      </p:sld>
    `;
    const relsXml = `<Relationships></Relationships>`;
    const mediaFiles: Record<string, string> = {};

    const result = extractBackgroundImage(slideXml, relsXml, mediaFiles);
    expect(result).toBeUndefined();
  });
});
