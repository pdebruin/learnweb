# learnweb

A web application that integrates with Microsoft Learn documentation via MCP (Model Context Protocol).

## Live Demo

A static demo of the UI is available at: https://pdebruin.github.io/learnweb/

**Note:** The GitHub Pages deployment shows the user interface but search functionality is not available as it requires a backend server to proxy MCP requests. To use the full functionality, please run the application from source as described below.

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
> tsc && cp src/index.html dist/index.html
```

4. **Verify the build:**

Check that the `dist/` directory was created with the following files:
```bash
ls dist/
# Should show: index.html  index.js  index.js.map  server.js  server.js.map
```

### Usage

#### Starting the Server

Run the web server:
```bash
npm start
```

**Expected output:**
```
Server running at http://localhost:3000/
```

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
│   ├── index.ts        # Client-side TypeScript code
│   ├── server.ts       # HTTP server implementation
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

If `npm start` fails or the server doesn't respond:

1. **Check if port 3000 is already in use:**
   ```bash
   # On Linux/Mac:
   lsof -i :3000
   
   # On Windows:
   netstat -ano | findstr :3000
   ```

2. **Use a different port:**
   ```bash
   PORT=8080 npm start
   ```

3. **Verify the build completed successfully:**
   ```bash
   ls dist/
   # Should show compiled files
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
- **Port already in use**: Stop other services using port 3000 or use the `PORT` environment variable to use a different port

## Architecture

This web application replicates the functionality of [learncli](https://github.com/pdebruin/learncli) but provides a web-based interface instead of a command-line interface. It uses:

- TypeScript for type safety
- MCP SDK for connecting to Microsoft Learn's MCP server
- A simple HTTP server to serve the application
- Client-side rendering for a responsive user experience

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

**Important**: The GitHub Pages deployment is a static site and cannot run the Node.js backend server. This means the search functionality will not work in the GitHub Pages deployment. The deployment serves as a UI preview only.

To enable search functionality, the application must be run with the Node.js server as described in the "Running from Source" section.