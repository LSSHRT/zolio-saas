const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Function to safely add dark classes if they don't exist
  function addDarkClass(text, target, darkClass) {
    const regex = new RegExp(`(^|\\s|["'\`])(${target})(?=[\\s"'\`]|$)`, 'g');
    return text.replace(regex, (match, p1, p2) => {
      // Check if dark class is already near
      // This is a naive approach, but better than nothing
      return `${p1}${p2} ${darkClass}`;
    });
  }

  // A safer regex replacement approach
  const replacements = [
    { target: 'bg-white', dark: 'dark:bg-gray-800' },
    { target: 'text-gray-900', dark: 'dark:text-white' },
    { target: 'text-gray-800', dark: 'dark:text-gray-100' },
    { target: 'text-gray-700', dark: 'dark:text-gray-200' },
    { target: 'bg-gray-50', dark: 'dark:bg-gray-900' },
    { target: 'bg-gray-100', dark: 'dark:bg-gray-800' },
    { target: 'border-gray-200', dark: 'dark:border-gray-700' },
    { target: 'border-gray-300', dark: 'dark:border-gray-600' }
  ];

  // We only replace if the dark class isn't already somewhere in the same line or element.
  // Actually, let's use a simpler string replacement for common class strings.
  
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip if it already contains dark:
    for (let r of replacements) {
      if (line.includes(r.target) && !line.includes(r.dark)) {
        // Replace target with target + dark class if it's a standalone class
        const regex = new RegExp(`(?<![a-zA-Z0-9:-])(${r.target})(?![a-zA-Z0-9:-])`, 'g');
        line = line.replace(regex, `${r.target} ${r.dark}`);
      }
    }
    
    // Also fix tables missing overflow-x-auto for mobile
    if (line.includes('<table') && !lines[i-1].includes('overflow-x-auto')) {
        // This is a bit tricky, better not to mess with HTML structure blindly
    }
    
    lines[i] = line;
  }
  
  content = lines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir('./src/app', processFile);
console.log('Done!');
