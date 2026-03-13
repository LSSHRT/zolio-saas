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

  // Add dark classes to <input, <select, <textarea if they have className
  const regex = /<(input|select|textarea)\b([^>]*)className=(["'{][^>]*?)(?=>|\/>)/g;
  
  content = content.replace(regex, (match, tag, before, classNameMatch) => {
    let classes = classNameMatch;
    
    // Check if it already has dark:bg
    if (!classes.includes('dark:bg-')) {
      // It's tricky to manipulate the string safely if it contains JS expressions,
      // but if it's a simple string like className="w-full border p-2"
      if (classes.startsWith('"') && classes.endsWith('"')) {
        let innerClasses = classes.slice(1, -1);
        if (!innerClasses.includes('dark:bg-slate-800') && !innerClasses.includes('dark:bg-slate-900')) {
             innerClasses += ' dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:dark:border-fuchsia-500';
        }
        return `<${tag}${before}className="${innerClasses.trim()}"`;
      }
    }
    return match; // If complex or already has dark, return unchanged
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated Inputs: ${filePath}`);
  }
}

walkDir('./src/app', processFile);
console.log('Inputs patch done!');
