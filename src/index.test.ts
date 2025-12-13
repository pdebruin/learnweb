import path from 'path';
import fs from 'fs';

describe('learnweb', () => {
  test('server file exists after build', () => {
    // This test ensures the build process works correctly
    const serverPath = path.join(__dirname, '../dist/server.js');
    expect(() => {
      fs.accessSync(serverPath);
    }).not.toThrow();
  });

  test('index.html exists after build', () => {
    const htmlPath = path.join(__dirname, '../dist/index.html');
    expect(() => {
      fs.accessSync(htmlPath);
    }).not.toThrow();
  });

  test('index.js exists after build', () => {
    const jsPath = path.join(__dirname, '../dist/index.js');
    expect(() => {
      fs.accessSync(jsPath);
    }).not.toThrow();
  });
});
