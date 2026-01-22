# Browser Compatibility Investigation

## Issue Summary
Search functionality works in some browsers but not others when accessing https://blog.pdebruin.org/learnweb/

## CORS Error Analysis

### Error Messages Reported
```
Access to fetch at 'https://learn.microsoft.com/api/mcp' from origin 'https://blog.pdebruin.org' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

GET https://learn.microsoft.com/api/mcp net::ERR_FAILED 405 (Method Not Allowed)
```

## Current Implementation

The code already includes Firefox-specific CORS handling:

### 1. CORS Configuration (Line 36-39)
```typescript
const corsRequestInit: RequestInit = {
  mode: 'cors',
  credentials: 'omit'
};
```

### 2. Custom Fetch for EventSource (Line 45-52)
```typescript
const customFetch: typeof fetch = async (url, init) => {
  const mergedInit: RequestInit = {
    ...init,
    ...corsRequestInit
  };
  return fetch(url, mergedInit);
};
```

### 3. EventSource Init Configuration (Line 54-59)
```typescript
const eventSourceInit = {
  withCredentials: false,
  fetch: customFetch
};
```

## Browser-Specific Behavior

### Working Browsers
Browsers that work are likely those that:
- Have less strict CORS enforcement
- Support the Streamable HTTP transport
- Don't send credentials by default

### Non-Working Browsers
Browsers that don't work may be:
- **Firefox**: Stricter CORS enforcement (already handled with special config)
- **Safari**: Different EventSource implementation
- **Older browsers**: May not support modern fetch options

## Root Cause Analysis

The issue is NOT browser compatibility in the client code. The problem is:

### 1. Server-Side CORS Configuration
The Microsoft Learn MCP API at `https://learn.microsoft.com/api/mcp`:
- Does NOT include `Access-Control-Allow-Origin` header for `https://blog.pdebruin.org`
- Returns 405 (Method Not Allowed) for certain requests
- May only allow specific origins (like GitHub Pages domains)

### 2. Why Some Browsers Work
Some browsers may:
- Be more lenient with CORS preflight checks
- Cache successful OPTIONS requests differently
- Have different default credential policies
- Access through different network paths (proxy, VPN, etc.)

## Verification Steps

### Test 1: Check CORS Headers
```bash
# Test what CORS headers the API returns
curl -I -X OPTIONS https://learn.microsoft.com/api/mcp \
  -H "Origin: https://blog.pdebruin.org" \
  -H "Access-Control-Request-Method: POST"
```

### Test 2: Compare Different Origins
```bash
# Test with GitHub Pages origin
curl -I -X OPTIONS https://learn.microsoft.com/api/mcp \
  -H "Origin: https://pdebruin.github.io" \
  -H "Access-Control-Request-Method: POST"
```

### Test 3: Browser Console
In each browser, check:
1. Network tab for actual requests and responses
2. Console for specific error messages
3. Request headers being sent
4. Response headers received

## Recommendations

### Option 1: Use GitHub Pages URL (Easiest)
Access the app at `https://pdebruin.github.io/learnweb/` instead of the custom domain.
The API may allow requests from GitHub Pages domains.

### Option 2: Local Testing (Development)
Run locally with `npm start` at `http://localhost:3000`.
CORS restrictions don't apply to localhost.

### Option 3: Request API CORS Configuration (Long-term)
Contact Microsoft Learn API team to add `https://blog.pdebruin.org` to their allowed origins list.

### Option 4: Add Proxy Server (Advanced)
Create a server-side proxy that:
- Receives requests from your frontend
- Forwards them to Microsoft Learn API
- Returns responses back to frontend
- Same-origin, so no CORS issues

## Browser Compatibility Matrix

| Browser | Version | Expected Status | Reason |
|---------|---------|-----------------|--------|
| Chrome | Latest | ❌ Fails | CORS policy blocks custom domain |
| Firefox | Latest | ❌ Fails | CORS policy blocks custom domain |
| Safari | Latest | ❌ Fails | CORS policy blocks custom domain |
| Edge | Latest | ❌ Fails | CORS policy blocks custom domain |
| Chrome | Latest | ✅ Works* | *Only on localhost or allowed origins |

## Code Quality Assessment

✅ **The client-side code is correctly implemented:**
- Proper CORS configuration with `credentials: 'omit'`
- Firefox-specific EventSource handling
- Transport fallback mechanism (HTTP → SSE)
- Custom fetch for EventSource CORS control

❌ **The issue is server-side:**
- API doesn't allow the custom domain origin
- This is not fixable in client code
- Requires API configuration change

## User Action Items

1. **Immediate Testing:**
   - Try accessing `https://pdebruin.github.io/learnweb/` in different browsers
   - Try accessing on localhost (`npm start`)
   - Compare which browsers work and which don't
   - Check browser console for specific error messages

2. **Report Findings:**
   - Which browsers work vs. don't work
   - Whether GitHub Pages URL works
   - Whether localhost works
   - Specific error messages from each browser

3. **Long-term Solution:**
   - Decide between GitHub Pages URL vs. custom domain
   - If custom domain is required, request CORS allowlist addition from Microsoft
   - Consider implementing a proxy server if API team can't add custom domain
