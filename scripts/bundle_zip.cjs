const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const zip = new JSZip();
const ROOT_DIR = path.resolve(__dirname, '..');

const includeDirs = ['database', 'backend', 'src'];
const includeFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'metadata.json', 'README.md', 'server.ts'];

function addFileToZip(filePath, relativePath) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(filePath);
      for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.cache') continue;
        addFileToZip(path.join(filePath, file), path.join(relativePath, file));
      }
    } else if (stats.isFile()) {
      // Don't zip binary files or giant assets, or previous zip files
      if (filePath.endsWith('.zip')) return;
      const content = fs.readFileSync(filePath);
      zip.file(relativePath, content);
    }
  } catch (err) {
    console.error('Error adding:', filePath, err.message);
  }
}

for (const dir of includeDirs) {
  const dirPath = path.join(ROOT_DIR, dir);
  if (fs.existsSync(dirPath)) {
    addFileToZip(dirPath, dir);
  }
}

for (const file of includeFiles) {
  const filePath = path.join(ROOT_DIR, file);
  if (fs.existsSync(filePath)) {
    addFileToZip(filePath, file);
  }
}

// Ensure public directory exists
const publicDir = path.join(ROOT_DIR, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const outputPath = path.join(publicDir, 'smart-parking-complete-project.zip');

zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  .then((buffer) => {
    fs.writeFileSync(outputPath, buffer);
    console.log('Successfully created zip file at:', outputPath, 'Size:', buffer.length, 'bytes');
  })
  .catch((err) => {
    console.error('Failed to generate zip:', err);
    process.exit(1);
  });
