export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "File Conversion API",
    version: "1.0.0",
    dependencies: {
      "turndown": "Available",
      "mammoth": "Available", 
      "pdf-parse": "Available",
      "html-docx-js": "Available"
    },
    supported_conversions: [
      "HTML to Markdown",
      "DOCX to Markdown", 
      "PDF to Markdown",
      "HTML to DOCX"
    ]
  };

  res.status(200).json(health);
} 