import path from 'path';
import fs from 'fs';

describe('learnweb', () => {
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

  test('index.js.map exists after build', () => {
    const mapPath = path.join(__dirname, '../dist/index.js.map');
    expect(() => {
      fs.accessSync(mapPath);
    }).not.toThrow();
  });
});
