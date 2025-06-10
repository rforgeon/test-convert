import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as cheerio from 'cheerio';

function parseHtmlToDocxElements(html) {
  const $ = cheerio.load(html);
  const elements = [];

  function processElement(elem) {
    const $elem = $(elem);
    const tagName = elem.tagName?.toLowerCase();
    const text = $elem.text().trim();

    if (!text && !['br', 'hr'].includes(tagName)) return null;

    switch (tagName) {
      case 'h1':
        return new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_1,
        });
      case 'h2':
        return new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_2,
        });
      case 'h3':
        return new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_3,
        });
      case 'p':
        const runs = [];
        $elem.contents().each((i, child) => {
          if (child.type === 'text') {
            runs.push(new TextRun(child.data));
          } else if (child.tagName === 'strong' || child.tagName === 'b') {
            runs.push(new TextRun({ text: $(child).text(), bold: true }));
          } else if (child.tagName === 'em' || child.tagName === 'i') {
            runs.push(new TextRun({ text: $(child).text(), italics: true }));
          } else {
            runs.push(new TextRun($(child).text()));
          }
        });
        return new Paragraph({ children: runs });
      case 'br':
        return new Paragraph({ text: '' });
      default:
        if (text) {
          return new Paragraph({ text: text });
        }
        return null;
    }
  }

  $('body').contents().each((i, elem) => {
    if (elem.type === 'tag') {
      const paragraph = processElement(elem);
      if (paragraph) {
        elements.push(paragraph);
      }
    } else if (elem.type === 'text' && elem.data.trim()) {
      elements.push(new Paragraph({ text: elem.data.trim() }));
    }
  });

  // If no body found, process the entire HTML
  if (elements.length === 0) {
    $('*').each((i, elem) => {
      if (elem.type === 'tag' && ['h1', 'h2', 'h3', 'p'].includes(elem.tagName?.toLowerCase())) {
        const paragraph = processElement(elem);
        if (paragraph) {
          elements.push(paragraph);
        }
      }
    });
  }

  // Fallback: if still no elements, just create a paragraph with all text
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