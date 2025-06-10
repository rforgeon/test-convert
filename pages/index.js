import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [converting, setConverting] = useState(false);
  const [htmlContent, setHtmlContent] = useState('<html><body><h1>Hello World</h1><p>This is a test document.</p></body></html>');
  const [filename, setFilename] = useState('test.docx');

  const handleFileUpload = async (event) => {
    event.preventDefault();
    setConverting(true);

    const formData = new FormData();
    const files = event.target.files.files;
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/convert-to-markdown', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'converted.md';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error converting files');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setConverting(false);
    }
  };

  const handleHtmlToDocx = async () => {
    setConverting(true);

    try {
      const response = await fetch('/api/html-to-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html_content: htmlContent,
          filename: filename,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error converting HTML to DOCX');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>File Conversion API</title>
        <meta name="description" content="Convert files to markdown and HTML to DOCX" />
      </Head>

      <h1>File Conversion API</h1>
      <p>A simple REST API for file conversion using JavaScript libraries instead of pandoc.</p>

      <div style={{ marginBottom: '40px' }}>
        <h2>🔗 API Endpoints</h2>
        <ul>
          <li><strong>GET /api</strong> - List available endpoints</li>
          <li><strong>GET /api/health</strong> - Health check</li>
          <li><strong>POST /api/convert-to-markdown</strong> - Convert files to markdown</li>
          <li><strong>POST /api/html-to-docx</strong> - Convert HTML to DOCX</li>
        </ul>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>📄 Convert Files to Markdown</h2>
        <p>Upload one or multiple files (HTML, DOCX, PDF, TXT) to convert them to markdown.</p>
        <form onSubmit={handleFileUpload}>
          <input 
            type="file" 
            name="files" 
            multiple 
            accept=".html,.htm,.docx,.pdf,.txt"
            style={{ marginBottom: '10px', display: 'block' }}
          />
          <button 
            type="submit" 
            disabled={converting}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#0070f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: converting ? 'not-allowed' : 'pointer'
            }}
          >
            {converting ? 'Converting...' : 'Convert to Markdown'}
          </button>
        </form>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>📝 Convert HTML to DOCX</h2>
        <p>Enter HTML content to convert it to a DOCX file.</p>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>HTML Content:</label>
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            rows={6}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              fontFamily: 'monospace'
            }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Filename:</label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            style={{ 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              width: '200px'
            }}
          />
        </div>
        <button 
          onClick={handleHtmlToDocx}
          disabled={converting}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: converting ? 'not-allowed' : 'pointer'
          }}
        >
          {converting ? 'Converting...' : 'Convert to DOCX'}
        </button>
      </div>

      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
        <h3>📋 Example cURL Commands</h3>
        <div style={{ marginBottom: '20px' }}>
          <h4>Convert files to markdown:</h4>
          <code style={{ backgroundColor: '#fff', padding: '10px', display: 'block', borderRadius: '3px' }}>
            curl -X POST "https://your-domain.vercel.app/api/convert-to-markdown" \<br/>
            &nbsp;&nbsp;-F "files=@document.pdf" \<br/>
            &nbsp;&nbsp;-F "files=@spreadsheet.xlsx" \<br/>
            &nbsp;&nbsp;--output result.md
          </code>
        </div>
        <div>
          <h4>Convert HTML to DOCX:</h4>
          <code style={{ backgroundColor: '#fff', padding: '10px', display: 'block', borderRadius: '3px' }}>
            curl -X POST "https://your-domain.vercel.app/api/html-to-docx" \<br/>
            &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
            &nbsp;&nbsp;-d &apos;{'{'}html_content&apos;: &apos;&lt;h1&gt;Hello&lt;/h1&gt;&apos;, &apos;filename&apos;: &apos;test.docx&apos;{'}'}&apos; \<br/>
            &nbsp;&nbsp;--output test.docx
          </code>
        </div>
      </div>
    </div>
  );
} 