import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    let filePath = '';
    let contentType = 'text/html';
    
    if (req.url === '/' || req.url === '/index.html') {
      filePath = join(__dirname, 'index.html');
      contentType = 'text/html';
    } else if (req.url === '/index.js') {
      filePath = join(__dirname, 'index.js');
      contentType = 'application/javascript';
    } else {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
