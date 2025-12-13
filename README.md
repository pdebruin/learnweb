# learnweb

A web application that integrates with Microsoft Learn documentation via MCP (Model Context Protocol).

## Running from Source

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/pdebruin/learnweb.git
cd learnweb
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Usage

After building, you can run the web server:

```bash
# Start the web server
npm start
```

Then open your browser and navigate to `http://localhost:3000`

The web interface allows you to:
- Search Microsoft Learn documentation by entering a query
- View execution progress logs in real-time
- See search results with titles, content, and links to documentation

#### Logging

The web interface provides execution progress logs when searching documentation:
- `[INFO]` logs show the execution flow (MCP connection, tool calling, etc.)
- `[ERROR]` logs show any errors encountered
- `[SUCCESS]` logs show successful operations

### Development

- **Build**: `npm run build` - Compiles TypeScript to JavaScript and copies static assets
- **Start**: `npm start` - Builds and runs the web server
- **Test**: `npm test` - Builds and runs tests (if available)

## Architecture

This web application replicates the functionality of [learncli](https://github.com/pdebruin/learncli) but provides a web-based interface instead of a command-line interface. It uses:

- TypeScript for type safety
- MCP SDK for connecting to Microsoft Learn's MCP server
- A simple HTTP server to serve the application
- Client-side rendering for a responsive user experience