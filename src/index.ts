const API_ENDPOINT = "/api/search";

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
    addLog('Sending search request to server...', 'info');
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    
    if (!response.ok) {
      let errorData: any = { error: `HTTP ${response.status}` };
      try {
        errorData = await response.json();
      } catch (parseError) {
        addLog('Failed to parse error response from server', 'error');
      }
      
      // Display server-side events even for errors
      if (errorData.events && Array.isArray(errorData.events)) {
        errorData.events.forEach((event: string) => {
          addLog(event, 'info');
        });
      }
      
      addLog(`Error: ${errorData.error || `HTTP ${response.status}`}`, 'error');
      displayResults([]);
      return;
    }
    
    addLog('Received response from server', 'success');
    const result = await response.json();
    
    // Display server-side events if provided
    if (result.events && Array.isArray(result.events)) {
      result.events.forEach((event: string) => {
        addLog(event, 'info');
      });
    }
    
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
