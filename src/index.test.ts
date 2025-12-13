import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the server script
const SERVER_PATH = path.join(__dirname, '../dist/server.js');

describe('learnweb', () => {
  test('server file exists after build', () => {
    // This test ensures the build process works correctly
    expect(() => {
      const fs = require('fs');
      fs.accessSync(SERVER_PATH);
    }).not.toThrow();
  });

  test('index.html exists after build', () => {
    const fs = require('fs');
    const htmlPath = path.join(__dirname, '../dist/index.html');
    expect(() => {
      fs.accessSync(htmlPath);
    }).not.toThrow();
  });

  test('index.js exists after build', () => {
    const fs = require('fs');
    const jsPath = path.join(__dirname, '../dist/index.js');
    expect(() => {
      fs.accessSync(jsPath);
    }).not.toThrow();
  });
});
