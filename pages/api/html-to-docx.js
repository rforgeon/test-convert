import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, UnderlineType } from 'docx';
import * as cheerio from 'cheerio';

function hexToRgb(hex) {
  if (!hex) return null;
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  if (hex.length !== 6) return null;
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function extractStyleValue(styleText, property) {
  if (!styleText) return null;
  const match = styleText.match(new RegExp(`${property}\\s*:\\s*([^;]+)`));
  return match ? match[1].trim() : null;
}

function parseStylesFromCSS(html) {
  const styleMap = new Map();
  const $ = cheerio.load(html);
  
  // Extract styles from <style> tag
  const styleTag = $('style').html();
  if (styleTag) {
    // Simple CSS parser for basic selectors
    const rules = styleTag.match(/([^{}]+)\{([^}]+)\}/g) || [];
    rules.forEach(rule => {
      const [selector, declarations] = rule.split('{');
      const cleanSelector = selector.trim();
      const cleanDeclarations = declarations.replace('}', '').trim();
      styleMap.set(cleanSelector, cleanDeclarations);
    });
  }
  
  return styleMap;
}

function getEffectiveStyle(element, styleMap, $) {
  const $elem = $(element);
  const tagName = element.tagName?.toLowerCase();
  const className = $elem.attr('class');
  const id = $elem.attr('id');
  const inlineStyle = $elem.attr('style');
  
  let combinedStyle = '';
  
  // Tag selector
  if (styleMap.has(tagName)) {
    combinedStyle += styleMap.get(tagName) + ';';
  }
  
  // Class selector
  if (className) {
    const classSelector = '.' + className;
    if (styleMap.has(classSelector)) {
      combinedStyle += styleMap.get(classSelector) + ';';
    }
  }
  
  // ID selector
  if (id) {
    const idSelector = '#' + id;
    if (styleMap.has(idSelector)) {
      combinedStyle += styleMap.get(idSelector) + ';';
    }
  }
  
  // Inline style (highest priority)
  if (inlineStyle) {
    combinedStyle += inlineStyle + ';';
  }
  
  return combinedStyle;
}

function createTextRunFromElement(element, $, styleMap) {
  const $elem = $(element);
  const text = $elem.text();
  const tagName = element.tagName?.toLowerCase();
  
  if (!text.trim()) return null;
  
  const effectiveStyle = getEffectiveStyle(element, styleMap, $);
  const color = extractStyleValue(effectiveStyle, 'color');
  const fontFamily = extractStyleValue(effectiveStyle, 'font-family');
  const fontSize = extractStyleValue(effectiveStyle, 'font-size');
  const fontWeight = extractStyleValue(effectiveStyle, 'font-weight');
  const textTransform = extractStyleValue(effectiveStyle, 'text-transform');
  
  let processedText = text;
  if (textTransform === 'uppercase') {
    processedText = text.toUpperCase();
  }
  
  const textRunProps = {
    text: processedText,
  };
  
  // Apply color
  if (color) {
    const rgbColor = hexToRgb(color);
    if (rgbColor) {
      textRunProps.color = rgbColor;
    }
  }
  
  // Apply font
  if (fontFamily) {
    textRunProps.font = fontFamily.replace(/["']/g, '').split(',')[0].trim();
  }
  
  // Apply size (convert px to points, roughly)
  if (fontSize && fontSize.includes('px')) {
    const px = parseInt(fontSize);
    textRunProps.size = Math.round(px * 0.75) * 2; // Convert px to half-points
  }
  
  // Apply bold
  if (fontWeight === 'bold' || tagName === 'strong' || tagName === 'b') {
    textRunProps.bold = true;
  }
  
  // Apply italic
  if (tagName === 'em' || tagName === 'i') {
    textRunProps.italics = true;
  }
  
  return new TextRun(textRunProps);
}

function createTextRunFromText(text, parentStyle = '') {
  if (!text.trim()) return null;
  
  const color = extractStyleValue(parentStyle, 'color');
  const fontFamily = extractStyleValue(parentStyle, 'font-family');
  const fontSize = extractStyleValue(parentStyle, 'font-size');
  const fontWeight = extractStyleValue(parentStyle, 'font-weight');
  const textTransform = extractStyleValue(parentStyle, 'text-transform');
  
  let processedText = text;
  if (textTransform === 'uppercase') {
    processedText = text.toUpperCase();
  }
  
  const textRunProps = {
    text: processedText,
  };
  
  // Apply styling
  if (color) {
    const rgbColor = hexToRgb(color);
    if (rgbColor) {
      textRunProps.color = rgbColor;
    }
  }
  
  if (fontFamily) {
    textRunProps.font = fontFamily.replace(/["']/g, '').split(',')[0].trim();
  }
  
  if (fontSize && fontSize.includes('px')) {
    const px = parseInt(fontSize);
    textRunProps.size = Math.round(px * 0.75) * 2;
  }
  
  if (fontWeight === 'bold') {
    textRunProps.bold = true;
  }
  
  return new TextRun(textRunProps);
}

function parseHtmlToDocxElements(html) {
  const $ = cheerio.load(html);
  const elements = [];
  const styleMap = parseStylesFromCSS(html);
  
  function processElement(elem) {
    const $elem = $(elem);
    const tagName = elem.tagName?.toLowerCase();
    const text = $elem.text().trim();
    const effectiveStyle = getEffectiveStyle(elem, styleMap, $);
    
    if (!text && !['br', 'hr', 'ul', 'ol', 'div'].includes(tagName)) return null;
    
    // Extract styling
    const color = extractStyleValue(effectiveStyle, 'color');
    const textAlign = extractStyleValue(effectiveStyle, 'text-align');
    const textTransform = extractStyleValue(effectiveStyle, 'text-transform');
    const fontWeight = extractStyleValue(effectiveStyle, 'font-weight');
    
    let alignment = AlignmentType.LEFT;
    if (textAlign === 'center') alignment = AlignmentType.CENTER;
    if (textAlign === 'right') alignment = AlignmentType.RIGHT;
    
    switch (tagName) {
      case 'h1':
        const h1Text = textTransform === 'uppercase' ? text.toUpperCase() : text;
        const h1Props = {
          text: h1Text,
          heading: HeadingLevel.HEADING_1,
          alignment: alignment,
        };
        if (color) {
          const rgbColor = hexToRgb(color);
          if (rgbColor) {
            h1Props.children = [new TextRun({ text: h1Text, color: rgbColor, bold: true })];
            delete h1Props.text;
          }
        }
        return new Paragraph(h1Props);
        
      case 'h2':
        const h2Props = {
          text: text,
          heading: HeadingLevel.HEADING_2,
          alignment: alignment,
        };
        if (color) {
          const rgbColor = hexToRgb(color);
          if (rgbColor) {
            h2Props.children = [new TextRun({ text: text, color: rgbColor, bold: true })];
            delete h2Props.text;
          }
        }
        return new Paragraph(h2Props);
        
      case 'h3':
        const h3Props = {
          text: text,
          heading: HeadingLevel.HEADING_3,
          alignment: alignment,
        };
        return new Paragraph(h3Props);
        
      case 'p':
        const runs = [];
        let hasContent = false;
        
        $elem.contents().each((i, child) => {
          if (child.type === 'text' && child.data.trim()) {
            const textRun = createTextRunFromText(child.data, effectiveStyle);
            if (textRun) {
              runs.push(textRun);
              hasContent = true;
            }
          } else if (child.type === 'tag') {
            const textRun = createTextRunFromElement(child, $, styleMap);
            if (textRun) {
              runs.push(textRun);
              hasContent = true;
            }
          }
        });
        
        if (!hasContent && text) {
          runs.push(new TextRun(text));
        }
        
        const pProps = {
          children: runs.length > 0 ? runs : [new TextRun(text)],
          alignment: alignment,
        };
        
        return new Paragraph(pProps);
        
      case 'ul':
      case 'ol':
        const listItems = [];
        $elem.find('li').each((i, li) => {
          const $li = $(li);
          const listItemText = $li.text().trim();
          if (listItemText) {
            listItems.push(new Paragraph({
              text: `• ${listItemText}`,
              bullet: {
                level: 0
              },
              alignment: alignment,
            }));
          }
        });
        return listItems;
        
      case 'div':
        // Handle div with class styling
        if ($elem.hasClass('section-title')) {
          const titleText = textTransform === 'uppercase' ? text.toUpperCase() : text;
          const titleProps = {
            children: [new TextRun({ 
              text: titleText, 
              bold: fontWeight === 'bold' || true,
              color: color ? hexToRgb(color) : '666666'
            })],
            alignment: alignment,
          };
          return new Paragraph(titleProps);
        }
        
        // For other divs, process children
        const divElements = [];
        $elem.children().each((i, child) => {
          const processed = processElement(child);
          if (processed) {
            if (Array.isArray(processed)) {
              divElements.push(...processed);
            } else {
              divElements.push(processed);
            }
          }
        });
        return divElements.length > 0 ? divElements : null;
        
      case 'br':
        return new Paragraph({ text: '' });
        
      default:
        if (text) {
          const defaultProps = {
            text: text,
            alignment: alignment,
          };
          return new Paragraph(defaultProps);
        }
        return null;
    }
  }
  
  // Process body content first
  let processed = false;
  $('body').children().each((i, elem) => {
    if (elem.type === 'tag') {
      const result = processElement(elem);
      if (result) {
        if (Array.isArray(result)) {
          elements.push(...result);
        } else {
          elements.push(result);
        }
        processed = true;
      }
    }
  });
  
  // Fallback: if no body found, process all elements
  if (!processed) {
    $('h1, h2, h3, h4, h5, h6, p, div, ul, ol, li').each((i, elem) => {
      const result = processElement(elem);
      if (result) {
        if (Array.isArray(result)) {
          elements.push(...result);
        } else {
          elements.push(result);
        }
      }
    });
  }
  
  // Final fallback: just create a paragraph with all text
  if (elements.length === 0) {
    const allText = $.text().trim();
    if (allText) {
      elements.push(new Paragraph({ text: allText }));
    }
  }
  
  return elements;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { html_content, filename = 'output.docx' } = req.body;

    if (!html_content) {
      return res.status(400).json({ error: 'html_content is required' });
    }

    // Validate filename
    const sanitizedFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;

    // Parse HTML and convert to DOCX elements
    const paragraphs = parseHtmlToDocxElements(html_content);

    // Create DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.status(200).send(buffer);

  } catch (error) {
    console.error('Error converting HTML to DOCX:', error);
    res.status(500).json({ 
      error: 'Error converting HTML to DOCX', 
      details: error.message 
    });
  }
} 