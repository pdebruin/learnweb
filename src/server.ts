import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const MCP_ENDPOINT = "https://learn.microsoft.com/api/mcp";

/**
 * Connect to an MCP server with backwards compatibility.
 * Tries Streamable HTTP transport first, then falls back to SSE transport if that fails.
 */
async function connectWithBackwardsCompatibility(url: URL, events: string[]): Promise<{ client: Client; transport: StreamableHTTPClientTransport | SSEClientTransport }> {
  const client = new Client(
    {
      name: "learnweb",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  // Try Streamable HTTP transport first (modern protocol)
  try {
    events.push('Attempting connection with Streamable HTTP transport');
    const streamableTransport = new StreamableHTTPClientTransport(url);
    await client.connect(streamableTransport);
    events.push('Successfully connected using Streamable HTTP transport');
    return { client, transport: streamableTransport };
  } catch (error) {
    // If Streamable HTTP fails, fall back to SSE transport (older protocol)
    events.push(`Streamable HTTP transport failed: ${error instanceof Error ? error.message : String(error)}`);
    events.push('Falling back to SSE transport');
    
    try {
      const sseTransport = new SSEClientTransport(url);
      const sseClient = new Client(
        {
          name: "learnweb",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );
      await sseClient.connect(sseTransport);
      events.push('Successfully connected using SSE transport');
      return { client: sseClient, transport: sseTransport };
    } catch (sseError) {
      events.push(`SSE transport also failed: ${sseError instanceof Error ? sseError.message : String(sseError)}`);
      throw new Error('Could not connect to MCP server with any available transport');
    }
  }
}

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
          let query: string;
          try {
            const parsed = JSON.parse(body);
            query = parsed.query;
          } catch (parseError) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON in request body', events }));
            return;
          }
          
          if (!query || typeof query !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid query parameter', events }));
            return;
          }
          
          events.push('Creating MCP client connection');
          
          // Connect to MCP server with automatic transport detection and fallback
          events.push(`Connecting to MCP endpoint: ${MCP_ENDPOINT}`);
          const { client, transport } = await connectWithBackwardsCompatibility(new URL(MCP_ENDPOINT), events);
          
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
          
          // Extract detailed error information including cause
          let errorMessage = 'Internal server error';
          if (error instanceof Error) {
            errorMessage = error.message;
            // Check for cause chain to provide more diagnostic info
            if ('cause' in error && error.cause instanceof Error) {
              errorMessage += ` (${error.cause.message})`;
            }
          }
          
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: errorMessage,
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
