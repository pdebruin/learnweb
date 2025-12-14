import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const MCP_ENDPOINT = "https://learn.microsoft.com/api/mcp";

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
    } else if (req.url === '/api/search' && req.method === 'POST') {
      // Handle MCP search requests server-side to avoid CORS issues
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { query } = JSON.parse(body);
          
          if (!query || typeof query !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid query parameter' }));
            return;
          }
          
          const transport = new StreamableHTTPClientTransport(new URL(MCP_ENDPOINT));
          const client = new Client(
            {
              name: "learnweb",
              version: "1.0.0",
            },
            {
              capabilities: {},
            }
          );
          
          await client.connect(transport);
          
          // Validate tool availability
          const tools = await client.listTools();
          const toolAvailable = tools.tools.some((tool: any) => tool.name === 'microsoft_docs_search');
          
          if (!toolAvailable) {
            await client.close();
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Search tool not available' }));
            return;
          }
          
          // Call the search tool
          const result = await client.callTool({
            name: 'microsoft_docs_search',
            arguments: { query },
          });
          
          await client.close();
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          console.error('Error handling search request:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
          }));
        }
      });
      return;
    } else {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    console.error('Error serving file:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
