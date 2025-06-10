# File Conversion REST API for Vercel

A simple REST API that provides file conversion capabilities using JavaScript libraries, designed to be deployed on Vercel.

## Features

- **Convert files to Markdown**: Upload one or multiple files of any type and get back a markdown file
- **Convert HTML to DOCX**: Send HTML content and receive a DOCX file
- **Serverless deployment**: Optimized for Vercel's serverless functions
- **No system dependencies**: Uses pure JavaScript libraries instead of pandoc

## Live Demo

Visit the deployed application to test the API with a web interface.

## Supported File Types

### Convert to Markdown
- **HTML/HTM**: Direct conversion using Turndown
- **DOCX**: Converts to HTML first, then to Markdown using Mammoth
- **PDF**: Extracts text content using PDF-parse
- **TXT**: Direct text-to-markdown conversion
- **Other text files**: Wrapped in code blocks

### Convert HTML to DOCX
- Any valid HTML content

## API Endpoints

### `GET /api`
Returns a list of available endpoints and documentation.

### `GET /api/health`
Health check endpoint that verifies the service is running and lists available conversion libraries.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "File Conversion API",
  "version": "1.0.0",
  "dependencies": {
    "turndown": "Available",
    "mammoth": "Available",
    "pdf-parse": "Available",
    "html-docx-js": "Available"
  }
}
```

### `POST /api/convert-to-markdown`
Converts one or multiple files to markdown format.

**Request**: Multipart form data with `files` field
**Response**: Markdown file download

**Example using curl**:
```bash
curl -X POST "https://your-domain.vercel.app/api/convert-to-markdown" \
  -F "files=@document.pdf" \
  -F "files=@spreadsheet.xlsx" \
  --output result.md
```

### `POST /api/html-to-docx`
Converts HTML content to DOCX format.

**Request Body**:
```json
{
  "html_content": "<html><body><h1>Hello World</h1></body></html>",
  "filename": "output.docx"
}
```

**Response**: DOCX file download

**Example using curl**:
```bash
curl -X POST "https://your-domain.vercel.app/api/html-to-docx" \
  -H "Content-Type: application/json" \
  -d '{"html_content": "<html><body><h1>Hello World</h1><p>This is a test document.</p></body></html>", "filename": "test.docx"}' \
  --output test.docx
```

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Deployment to Vercel

### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# For production deployment
vercel --prod
```

### Method 2: GitHub Integration
1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Vercel will automatically deploy on every push to main branch

### Method 3: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Deploy with default settings

## Configuration

### Environment Variables
No environment variables are required for basic functionality.

### Vercel Settings
The project includes a `vercel.json` configuration file with:
- Function timeout: 30 seconds
- Region: US East (iad1)

### File Upload Limits
- Maximum file size: 50MB per file
- Maximum total request size: 50MB
- Function execution timeout: 30 seconds

## Dependencies

### Core Dependencies
- **Next.js**: React framework with API routes
- **React**: Frontend framework
- **formidable**: File upload handling
- **turndown**: HTML to Markdown conversion
- **mammoth**: DOCX to HTML conversion
- **pdf-parse**: PDF text extraction
- **html-docx-js**: HTML to DOCX conversion

### Key Differences from Pandoc Version
This version uses JavaScript libraries instead of pandoc for better compatibility with serverless environments:

| Feature | Pandoc Version | Vercel Version |
|---------|----------------|----------------|
| HTML to Markdown | pandoc | turndown |
| DOCX to Markdown | pandoc | mammoth + turndown |
| PDF to Markdown | pandoc | pdf-parse |
| HTML to DOCX | pandoc | html-docx-js |
| Deployment | Docker/AKS | Vercel Serverless |

## Limitations

1. **PDF conversion**: Only extracts text, doesn't preserve formatting
2. **DOCX conversion**: May not preserve all complex formatting
3. **File size**: Limited to 50MB per file due to Vercel function limits
4. **Execution time**: Limited to 30 seconds per function execution

## Error Handling

The API includes comprehensive error handling:
- File validation
- Format-specific error messages
- Automatic cleanup of temporary files
- Graceful degradation for unsupported formats

## Performance

- **Cold start**: ~2-3 seconds for first request
- **Warm function**: <1 second for subsequent requests
- **Memory usage**: Optimized for Vercel's memory limits
- **Concurrent requests**: Handled automatically by Vercel

## Security

- File type validation
- Filename sanitization
- No persistent file storage
- Automatic cleanup of temporary files
- No system access beyond Node.js runtime

## Support

For issues or questions:
1. Check the health endpoint: `/api/health`
2. Review the API documentation: `/api`
3. Test with the web interface at the root URL

## License

MIT License - see LICENSE file for details. 