# learnweb

A web application that integrates with Microsoft Learn documentation via MCP (Model Context Protocol).

## Live Demo

Try the app at: https://pdebruin.github.io/learnweb/

The GitHub Pages deployment is a fully static web app that runs entirely in your browser. Search functionality works by connecting directly to the Microsoft Learn MCP server from your browser.

**Note:** If you encounter CORS (Cross-Origin Resource Sharing) errors, the Microsoft Learn API may have restrictions. In that case, you can run the application locally as described below.

## Running from Source

### Prerequisites

- **Node.js**: Version 18.x or higher (20.x recommended)
- **npm**: Version 8.x or higher (comes with Node.js)

To verify your installed versions:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
```

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/pdebruin/learnweb.git
cd learnweb
```

2. **Install dependencies:**
```bash
npm install
```
This will install all required packages including TypeScript, the MCP SDK, and development dependencies.

3. **Build the project:**
```bash
npm run build
```
This command compiles TypeScript files to JavaScript and copies static assets to the `dist/` directory.

**Expected output:**
```
> @pjmdebruin/learnweb@1.0.0 build
> npm run build:client && npm run build:copy
```

4. **Verify the build:**

Check that the `dist/` directory was created with the following files:
```bash
ls dist/
# Should show: index.html  index.js  index.js.map
```

### Usage

#### Starting the Local Server

For local development and testing:
```bash
npm start
```

**Expected output:**
```
Starting up http-server, serving dist
Available on:
  http://localhost:3000
```

The application will automatically open in your default browser.

#### Accessing the Application

1. Open your web browser
2. Navigate to `http://localhost:3000`
3. You should see the learnweb interface with a search box

#### Using the Web Interface

The web interface allows you to:
- **Search Microsoft Learn documentation** by entering a query in the search box
- **View execution progress logs** in real-time as the search is performed
- **See search results** with titles, content snippets, and links to documentation

**Example search queries:**
- "azure functions"
- "typescript decorators"
- "dotnet minimal apis"

#### Execution Logs

The web interface provides detailed execution progress logs:
- **[INFO]** - Execution flow information (MCP connection, tool calling, etc.)
- **[ERROR]** - Error messages if something goes wrong
- **[SUCCESS]** - Successful operations and results

#### Stopping the Server

To stop the server, press `Ctrl+C` in the terminal where it's running.

### Development

#### Available Commands

- **`npm run build`** - Compiles TypeScript to JavaScript and copies static assets to `dist/`
- **`npm start`** - Builds the project and starts the web server (runs `npm run build` first)
- **`npm test`** - Builds the project and runs the test suite

#### Development Workflow

1. Make changes to files in the `src/` directory
2. Run `npm run build` to compile your changes
3. Run `npm start` to test your changes in the browser
4. Run `npm test` to verify tests still pass

#### Project Structure

```
learnweb/
├── src/
│   ├── index.html      # Web interface HTML
│   ├── index.ts        # Client-side TypeScript code (includes MCP client)
│   └── index.test.ts   # Test suite
├── dist/               # Compiled output (created by build)
├── package.json        # Project configuration and dependencies
├── tsconfig.json       # TypeScript compiler configuration
└── README.md           # This file
```

### Troubleshooting

#### Build Fails

If `npm run build` fails:

1. **Ensure you have the correct Node.js version:**
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **Clean install dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Check for TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

#### Server Won't Start

If `npm start` fails or the local server doesn't respond:

1. **Check if port 3000 is already in use:**
   ```bash
   # On Linux/Mac:
   lsof -i :3000
   
   # On Windows:
   netstat -ano | findstr :3000
   ```

2. **Try manually starting the server:**
   ```bash
   npm run build
   npx http-server dist -p 3000
   ```

3. **Verify the build completed successfully:**
   ```bash
   ls dist/
   # Should show: index.html, index.js, index.js.map
   ```

#### Tests Fail

If `npm test` fails:

1. **Ensure the project is built:**
   ```bash
   npm run build
   npm test
   ```

2. **Check for specific test errors** in the output and address them

#### Common Issues

- **"Cannot find module" errors**: Run `npm install` to ensure all dependencies are installed
- **TypeScript compilation errors**: Check that your TypeScript version is 5.9.3 or higher (`npm list typescript`)
- **Port already in use**: Stop other services using port 3000 or manually specify a different port with `npx http-server dist -p <port>`
- **CORS errors in browser**: This may occur if the Microsoft Learn API has CORS restrictions. The app works best when the API allows cross-origin requests. If you encounter persistent CORS issues, the API's CORS policy may need to be updated.

## Architecture

This web application replicates the functionality of [learncli](https://github.com/pdebruin/learncli) but provides a web-based interface instead of a command-line interface. It is a fully static web application that runs entirely in the browser, using:

- TypeScript for type safety
- MCP SDK for connecting to Microsoft Learn's MCP server directly from the browser
- Client-side rendering for a responsive user experience
- esbuild for bundling the application into a single JavaScript file

### MCP Transport Compatibility

The application implements backwards compatibility with MCP servers by supporting both modern and legacy transport protocols:

1. **Streamable HTTP Transport** (modern protocol): The application first attempts to connect using the newer Streamable HTTP transport, which is the recommended protocol for MCP connections.

2. **SSE Transport** (legacy protocol): If the Streamable HTTP transport fails (e.g., with HTTP 405 Method Not Allowed), the application automatically falls back to the older Server-Sent Events (SSE) transport protocol.

This fallback mechanism ensures compatibility with the Microsoft Learn MCP server, which currently only supports the SSE transport protocol. The connection process is logged in the execution logs visible in the web interface, allowing you to see which transport protocol was successfully used.

## Deployment

### GitHub Pages

The project includes a GitHub Actions workflow that automatically builds and deploys the application to GitHub Pages when changes are pushed to the main branch.

**Workflow file**: `.github/workflows/deploy-github-pages.yml`

The workflow:
1. Triggers on pushes to the main branch (when source files change)
2. Can also be manually triggered via workflow_dispatch
3. Builds the application using `npm run build`
4. Deploys the `dist/` directory to GitHub Pages

**Important**: The GitHub Pages deployment is fully functional as a static site. The MCP client runs directly in your browser, connecting to the Microsoft Learn API. This eliminates the need for a backend server.

**CORS Considerations**: The static web app connects directly to the Microsoft Learn MCP API from the browser. If the API does not allow cross-origin requests from the GitHub Pages domain, you may encounter CORS errors. In that case, running the application locally may provide better results, or the API's CORS policy would need to be configured to allow requests from the deployment domain.