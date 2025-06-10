export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const endpoints = {
    message: "File Conversion API",
    version: "1.0.0",
    endpoints: {
      "GET /api": "This endpoint - lists available endpoints",
      "GET /api/health": "Health check endpoint",
      "POST /api/convert-to-markdown": "Convert files to markdown format",
      "POST /api/html-to-docx": "Convert HTML content to DOCX format"
    },
    documentation: {
      "convert-to-markdown": {
        method: "POST",
        description: "Upload one or multiple files and get back a markdown file",
        request: "Multipart form data with 'files' field",
        response: "Markdown file download"
      },
      "html-to-docx": {
        method: "POST",
        description: "Convert HTML content to DOCX format",
        request: {
          html_content: "string - HTML content to convert",
          filename: "string - Output filename (optional, defaults to 'output.docx')"
        },
        response: "DOCX file download"
      }
    }
  };

  res.status(200).json(endpoints);
} 