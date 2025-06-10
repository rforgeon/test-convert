import { create } from 'html-docx-js';

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

    // Convert HTML to DOCX
    const docxBuffer = create(html_content);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
    res.setHeader('Content-Length', docxBuffer.length);
    
    res.status(200).send(docxBuffer);

  } catch (error) {
    console.error('Error converting HTML to DOCX:', error);
    res.status(500).json({ 
      error: 'Error converting HTML to DOCX', 
      details: error.message 
    });
  }
} 