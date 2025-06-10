import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import TurndownService from 'turndown';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

async function convertFileToMarkdown(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  
  try {
    switch (ext) {
      case '.html':
      case '.htm':
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        return turndownService.turndown(htmlContent);
        
      case '.docx':
        const docxResult = await mammoth.convertToHtml({ path: filePath });
        return turndownService.turndown(docxResult.value);
        
      case '.pdf':
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(pdfBuffer);
        return `# ${originalName}\n\n${pdfData.text}`;
        
      case '.txt':
        const txtContent = fs.readFileSync(filePath, 'utf8');
        return `# ${originalName}\n\n${txtContent}`;
        
      default:
        // Try to read as text file
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          return `# ${originalName}\n\n\`\`\`\n${content}\n\`\`\``;
        } catch {
          return `# ${originalName}\n\n*Unable to convert this file type to markdown*`;
        }
    }
  } catch (error) {
    console.error(`Error converting ${originalName}:`, error);
    return `# ${originalName}\n\n*Error converting file: ${error.message}*`;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({
    uploadDir: '/tmp',
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
  });

  try {
    const [fields, files] = await form.parse(req);
    
    if (!files.files) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const fileArray = Array.isArray(files.files) ? files.files : [files.files];
    let markdownContent = '';

    for (const file of fileArray) {
      const markdown = await convertFileToMarkdown(file.filepath, file.originalFilename);
      markdownContent += markdown + '\n\n---\n\n';
      
      // Clean up temporary file
      try {
        fs.unlinkSync(file.filepath);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }

    // Remove trailing separator
    markdownContent = markdownContent.replace(/\n\n---\n\n$/, '');

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.md"');
    res.status(200).send(markdownContent);

  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ error: 'Error processing files', details: error.message });
  }
} 