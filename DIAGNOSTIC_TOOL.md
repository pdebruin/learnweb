# Browser Compatibility Diagnostic Tool

## Purpose

This diagnostic tool helps identify browser-specific CORS and connectivity issues when accessing the LearnWeb application from different origins.

## How to Use

### Option 1: Access from Deployed Site

Visit the diagnostic tool at:
- **Custom Domain**: https://blog.pdebruin.org/learnweb/diagnostic.html
- **GitHub Pages**: https://pdebruin.github.io/learnweb/diagnostic.html

### Option 2: Run Locally

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the local server:
   ```bash
   npm start
   ```

3. Access the diagnostic tool:
   ```
   http://localhost:3000/diagnostic.html
   ```

## What It Tests

The diagnostic tool performs the following tests:

### 1. Browser Detection
- Displays current browser name, version, and platform
- Shows the current origin (important for CORS)
- Displays user agent string

### 2. CORS Headers Test
- Sends OPTIONS request (CORS preflight)
- Checks for `Access-Control-Allow-Origin` header
- Checks for `Access-Control-Allow-Methods` header
- Reports whether the server allows cross-origin requests

### 3. Fetch API Test
- Tests modern Fetch API with CORS settings
- Uses `mode: 'cors'` and `credentials: 'omit'`
- Reports success/failure and response details

### 4. EventSource Test
- Tests Server-Sent Events (SSE) connection
- Uses `withCredentials: false` setting
- Reports connection state and errors

## Interpreting Results

### ✅ Success Messages (Green)
- Feature is supported and working
- Connection succeeded
- CORS headers are present and allow the request

### ❌ Error Messages (Red)
- Feature failed or is not supported
- CORS policy blocked the request
- Connection failed

### ⚠️ Warning Messages (Orange)
- Partial success or timeout
- Missing optional headers
- Connection issues

### ℹ️ Info Messages (Blue)
- General information
- Configuration details
- Progress updates

## Common Issues and Solutions

### Issue: All tests show CORS errors

**Cause**: The Microsoft Learn API does not allow requests from your current origin.

**Solutions**:
1. Try accessing from `https://pdebruin.github.io/learnweb/diagnostic.html`
2. Run locally at `http://localhost:3000/diagnostic.html`
3. Request Microsoft to add your domain to their CORS allowlist

### Issue: Works in Chrome but not Firefox

**Cause**: Firefox has stricter CORS enforcement for EventSource.

**Solution**: The main app already includes Firefox-specific handling. If the diagnostic shows this issue, it's an API-level problem, not a client code issue.

### Issue: Works on localhost but not on deployed site

**Cause**: CORS restrictions don't apply to localhost, but do apply to web domains.

**Solution**: This confirms the issue is server-side CORS configuration. Use localhost for development, or request CORS allowlist addition.

### Issue: 405 Method Not Allowed

**Cause**: The API endpoint doesn't support the HTTP method being used.

**Solution**: This is a server-side issue. The API may not support the transport method being attempted.

## Browser Compatibility Results

Share your test results by:

1. Run the "Run All Tests" button
2. Take a screenshot of the results
3. Note which browser and version you're using
4. Report findings in the GitHub issue

## Expected Results by Origin

| Origin | Expected Result | Reason |
|--------|----------------|---------|
| `http://localhost:3000` | ✅ All tests pass | CORS doesn't apply to localhost |
| `https://pdebruin.github.io` | ✅ May work | GitHub Pages often allowed |
| `https://blog.pdebruin.org` | ❌ CORS errors | Custom domain not in API allowlist |

## Technical Details

The diagnostic tool tests the exact same CORS configuration used in the main application:

```javascript
// CORS configuration
{
  mode: 'cors',
  credentials: 'omit'
}

// EventSource configuration  
{
  withCredentials: false
}
```

This ensures that diagnostic results accurately reflect the behavior of the main application.

## Next Steps

Based on diagnostic results:

1. **If localhost works but deployed site doesn't**: Server-side CORS issue
2. **If GitHub Pages works but custom domain doesn't**: Request CORS allowlist addition
3. **If nothing works in any browser**: API may be down or changed
4. **If works in some browsers but not others**: Note which browsers and versions

Report findings with screenshots to help identify the root cause.
