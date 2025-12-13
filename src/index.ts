import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const MCP_ENDPOINT = "https://learn.microsoft.com/api/mcp";
const TOOL_NAME = "microsoft_docs_search";

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
  
  addLog(`Found ${results.length} result(s)`, 'success');
  
  results.forEach((result, index) => {
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
      const link = document.createElement('a');
      link.className = 'result-link';
      link.href = linkText;
      link.textContent = 'View documentation →';
      link.target = '_blank';
      resultItem.appendChild(link);
    }
    
    resultsContainer.appendChild(resultItem);
  });
}

async function validateTool(client: Client): Promise<boolean> {
  try {
    const tools = await client.listTools();
    return tools.tools.some((tool: Tool) => tool.name === TOOL_NAME);
  } catch (error) {
    return false;
  }
}

async function searchDocs(query: string): Promise<void> {
  clearLogs();
  addLog(`Starting search with query: "${query}"`, 'info');
  
  const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  
  if (searchButton) searchButton.disabled = true;
  if (searchInput) searchInput.disabled = true;
  
  addLog('Creating MCP client...', 'info');
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
  
  try {
    addLog('Connecting to MCP server...', 'info');
    await client.connect(transport);
    addLog('Connected to MCP server', 'success');
    
    addLog(`Validating tool '${TOOL_NAME}'...`, 'info');
    const toolAvailable = await validateTool(client);
    if (!toolAvailable) {
      addLog(`Tool '${TOOL_NAME}' is not available on the MCP server`, 'error');
      await client.close();
      return;
    }
    addLog(`Tool '${TOOL_NAME}' is available`, 'success');
    
    addLog(`Calling tool '${TOOL_NAME}' with query: "${query}"`, 'info');
    const result = await client.callTool({
      name: TOOL_NAME,
      arguments: {
        query,
      },
    });
    
    addLog('Received response from MCP server', 'success');
    
    if (result.content && Array.isArray(result.content)) {
      let structuredData = null;
      
      for (const item of result.content) {
        if (item.type === 'text' && item.text && typeof item.text === 'string') {
          const trimmed = item.text.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              const parsed = JSON.parse(trimmed);
              structuredData = parsed;
              break;
            } catch (e) {
              // Not valid JSON, continue searching
            }
          }
        }
      }
      
      if (structuredData) {
        let results = Array.isArray(structuredData) ? structuredData : [structuredData];
        
        if (results.length > 0 && results[0] && results[0].results && Array.isArray(results[0].results)) {
          results = results[0].results;
        }
        
        displayResults(results);
      } else {
        addLog('No structured content found in response', 'error');
        displayResults([]);
      }
    } else {
      addLog('Unexpected response format', 'error');
      displayResults([]);
    }
    
    await client.close();
    addLog('Connection closed', 'info');
  } catch (error) {
    addLog(`Error searching docs: ${error instanceof Error ? error.message : String(error)}`, 'error');
    try {
      await client.close();
    } catch (closeError) {
      // Ignore errors during cleanup
    }
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
