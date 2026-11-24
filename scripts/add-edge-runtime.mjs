import fs from 'fs';
import path from 'path';

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      let content = fs.readFileSync(fullPath, 'utf-8');
      if (!content.includes('export const runtime')) {
        content = "export const runtime = 'edge';\n" + content;
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log('Added edge runtime to:', fullPath);
      }
    }
  }
}

processDir('d:/dev-project/bibi-store/src/app');
processDir('d:/dev-project/admin-bibi-store/src/app');
console.log('Finished updating all routes to edge runtime.');
