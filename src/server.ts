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
        // Collect server-side events to send to client
        const events: string[] = [];
        
        try {
          const { query } = JSON.parse(body);
          
          if (!query || typeof query !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid query parameter' }));
            return;
          }
          
          events.push('Creating MCP client connection');
          
          // Create a new MCP client for each request to ensure clean state
          // and proper connection lifecycle management
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
          
          events.push(`Connecting to MCP endpoint: ${MCP_ENDPOINT}`);
          await client.connect(transport);
          events.push('Successfully connected to MCP server');
          
          // Validate tool availability
          events.push('Listing available tools');
          const tools = await client.listTools();
          events.push(`Found ${tools.tools.length} available tool(s)`);
          const toolAvailable = tools.tools.some((tool: any) => tool.name === 'microsoft_docs_search');
          
          if (!toolAvailable) {
            await client.close();
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Search tool not available', events }));
            return;
          }
          
          events.push('Calling microsoft_docs_search tool');
          // Call the search tool
          const result = await client.callTool({
            name: 'microsoft_docs_search',
            arguments: { query },
          });
          
          events.push('Search completed successfully');
          events.push('Closing MCP connection');
          await client.close();
          events.push('Connection closed');
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...result, events }));
        } catch (error) {
          console.error('Error handling search request:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Internal server error',
            events
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
