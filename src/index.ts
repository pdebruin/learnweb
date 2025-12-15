import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const MCP_ENDPOINT = "https://learn.microsoft.com/api/mcp";

// Client configuration for MCP connections
const CLIENT_CONFIG = {
  name: "learnweb",
  version: "1.0.0",
};

const CLIENT_CAPABILITIES = {
  capabilities: {},
};

type MCPConnection = {
  client: Client;
  transport: StreamableHTTPClientTransport | SSEClientTransport;
};

/**
 * Connect to an MCP server with backwards compatibility.
 * Tries Streamable HTTP transport first, then falls back to SSE transport if that fails.
 * 
 * Firefox Compatibility:
 * - Firefox is stricter than Chrome about CORS with EventSource/SSE connections
 * - The native EventSource API doesn't support controlling credentials/CORS
 * - We provide a custom fetch function with explicit CORS settings and withCredentials=false
 * - This prevents "CORS request did not succeed" errors in Firefox
 */
async function connectWithBackwardsCompatibility(url: URL, addLogFn: (msg: string, type?: 'info' | 'error' | 'success') => void): Promise<MCPConnection> {
  const client = new Client(CLIENT_CONFIG, CLIENT_CAPABILITIES);

  // Configure CORS for cross-origin requests (required for Firefox compatibility)
  const corsRequestInit: RequestInit = {
    mode: 'cors',
    credentials: 'omit'
  };

  // Configure EventSource with a custom fetch that properly handles CORS
  // Firefox requires explicit CORS mode and credentials control for SSE/EventSource.
  // The native EventSource API sends credentials by default, which causes CORS failures.
  // By providing a custom fetch, we can set mode='cors' and credentials='omit'.
  const customFetch: typeof fetch = async (url, init) => {
    // Merge settings, ensuring our CORS settings take precedence
    const mergedInit: RequestInit = {
      ...init,
      ...corsRequestInit,
      headers: {
        ...(init?.headers as Record<string, string> || {}),
      }
    };
    return fetch(url, mergedInit);
  };

  const eventSourceInit = {
    // Disable credentials to prevent CORS issues in Firefox
    withCredentials: false,
    // Use our custom fetch that applies CORS settings
    fetch: customFetch
  };

  // Try Streamable HTTP transport first (modern protocol)
  try {
    addLogFn('Attempting connection with Streamable HTTP transport');
    const streamableTransport = new StreamableHTTPClientTransport(url, {
      requestInit: corsRequestInit
    });
    await client.connect(streamableTransport);
    addLogFn('Successfully connected using Streamable HTTP transport');
    return { client, transport: streamableTransport };
  } catch (error) {
    // If Streamable HTTP fails, fall back to SSE transport (older protocol)
    addLogFn(`Streamable HTTP transport failed: ${error instanceof Error ? error.message : String(error)}`);
    addLogFn('Falling back to SSE transport');
    
    try {
      const sseTransport = new SSEClientTransport(url, {
        requestInit: corsRequestInit,
        eventSourceInit: eventSourceInit
      });
      const sseClient = new Client(CLIENT_CONFIG, CLIENT_CAPABILITIES);
      await sseClient.connect(sseTransport);
      addLogFn('Successfully connected using SSE transport');
      return { client: sseClient, transport: sseTransport };
    } catch (sseError) {
      addLogFn(`SSE transport also failed: ${sseError instanceof Error ? sseError.message : String(sseError)}`);
      throw new Error('Could not connect to MCP server with any available transport');
    }
  }
}

function addLog(message: string, type: 'info' | 'error' | 'success' = 'info') {
  const logsContainer = document.getElementById('logs');
  if (!logsContainer) return;
  
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.textContent = message;
  logsContainer.appendChild(logEntry);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearLogs() {
  const logsContainer = document.getElementById('logs');
  if (logsContainer) {
    logsContainer.innerHTML = '';
  }
}

function displayResults(results: any[]) {
  const resultsContainer = document.getElementById('results');
  if (!resultsContainer) return;
  
  resultsContainer.innerHTML = '';
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
    return;
  }
  
  const displayMessage = results.length > 1 
    ? `Found ${results.length} result(s), displaying top result` 
    : `Found ${results.length} result(s)`;
  addLog(displayMessage, 'success');
  
  // Limit to 1 result as requested
  const limitedResults = results.slice(0, 1);
  
  limitedResults.forEach((result, index) => {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    if (result.title) {
      const title = document.createElement('div');
      title.className = 'result-title';
      title.textContent = result.title;
      resultItem.appendChild(title);
    }
    
    if (result.content) {
      const content = document.createElement('div');
      content.className = 'result-content';
      content.textContent = result.content;
      resultItem.appendChild(content);
    }
    
    const linkField = result.links || result.link;
    if (linkField) {
      const linkText = typeof linkField === 'string' ? linkField : JSON.stringify(linkField);
      // Validate URL to prevent XSS
      try {
        const url = new URL(linkText);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          const link = document.createElement('a');
          link.className = 'result-link';
          link.href = linkText;
          link.textContent = 'View documentation →';
          link.target = '_blank';
          resultItem.appendChild(link);
        }
      } catch (e) {
        // Invalid URL, skip link
      }
    }
    
    resultsContainer.appendChild(resultItem);
  });
}

function findJsonContent(content: any[]): any | null {
  for (const item of content) {
    if (item.type === 'text' && item.text && typeof item.text === 'string') {
      const trimmed = item.text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed);
        } catch (e) {
          // Not valid JSON, continue searching
        }
      }
    }
  }
  return null;
}

function extractNestedResults(structuredData: any): any[] {
  let results = Array.isArray(structuredData) ? structuredData : [structuredData];
  
  // Check if the first item has a 'results' property that is an array
  if (results.length > 0 && results[0] && results[0].results && Array.isArray(results[0].results)) {
    results = results[0].results;
  }
  
  return results;
}

async function searchDocs(query: string): Promise<void> {
  clearLogs();
  addLog(`Starting search with query: "${query}"`, 'info');
  
  const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  
  if (searchButton) searchButton.disabled = true;
  if (searchInput) searchInput.disabled = true;
  
  try {
    addLog('Creating MCP client connection', 'info');
    
    // Connect to MCP server with automatic transport detection and fallback
    addLog(`Connecting to MCP endpoint: ${MCP_ENDPOINT}`, 'info');
    const { client, transport } = await connectWithBackwardsCompatibility(new URL(MCP_ENDPOINT), addLog);
    
    // Validate tool availability
    addLog('Listing available tools', 'info');
    const tools = await client.listTools();
    addLog(`Found ${tools.tools.length} available tool(s)`, 'info');
    const toolAvailable = tools.tools.some((tool: any) => tool.name === 'microsoft_docs_search');
    
    if (!toolAvailable) {
      await client.close();
      addLog('Search tool not available', 'error');
      displayResults([]);
      return;
    }
    
    addLog('Calling microsoft_docs_search tool', 'info');
    // Call the search tool
    const result = await client.callTool({
      name: 'microsoft_docs_search',
      arguments: { query },
    });
    
    addLog('Search completed successfully', 'success');
    addLog('Closing MCP connection', 'info');
    await client.close();
    addLog('Connection closed', 'info');
    
    if (result.content && Array.isArray(result.content)) {
      const structuredData = findJsonContent(result.content);
      
      if (structuredData) {
        const results = extractNestedResults(structuredData);
        displayResults(results);
      } else {
        addLog('No structured content found in response', 'error');
        displayResults([]);
      }
    } else {
      addLog('Unexpected response format', 'error');
      displayResults([]);
    }
  } catch (error) {
    addLog(`Error searching docs: ${error instanceof Error ? error.message : String(error)}`, 'error');
    displayResults([]);
  } finally {
    if (searchButton) searchButton.disabled = false;
    if (searchInput) searchInput.disabled = false;
  }
}

// Set up event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('searchButton');
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  
  if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        searchDocs(query);
      } else {
        addLog('Please enter a search query', 'error');
      }
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          searchDocs(query);
        } else {
          addLog('Please enter a search query', 'error');
        }
      }
    });
  }
});
