const fs = require('fs');
const glob = require('glob'); // Not available by default, let's use a simple recursive walk
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('page.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src/app');

const dashboardClasses = "flex flex-col min-h-screen pb-24 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm";
const blobHtml = `      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none"></div>`;

let count = 0;
files.forEach(file => {
  if (file === './src/app/page.tsx') return; // Skip main dashboard

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace standard wrappers
  const regex = /<div className="flex flex-col min-h-screen[^"]*w-full[^"]*relative[^"]*">/g;
  content = content.replace(regex, (match) => {
    // Determine original padding bottom to keep it if possible, or just overwrite.
    let pbMatch = match.match(/pb-\d+/);
    let pb = pbMatch ? pbMatch[0] : 'pb-24';
    
    // Some are just "flex flex-col min-h-screen ... relative"
    // Just replace the whole class string but keep the <div> start
    return `<div className="${dashboardClasses.replace('pb-24', pb)}">`;
  });
  
  // Try another regex if they don't have relative
  const regex2 = /<div className="flex flex-col min-h-screen[^"]*w-full[^"]*">/g;
  content = content.replace(regex2, (match) => {
    if(match.includes('tour-dashboard')) return match; // Already updated or dashboard
    let pbMatch = match.match(/pb-\d+/);
    let pb = pbMatch ? pbMatch[0] : 'pb-24';
    return `<div className="${dashboardClasses.replace('pb-24', pb)}">`;
  });

  // Now insert blobs if not already there
  // Find <header> or <motion.div> right after the wrapper to insert blob
  if (content !== originalContent && !content.includes('Background Blobs')) {
      // Find the updated wrapper
      const wrapperRegex = new RegExp(`<div className="${dashboardClasses.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace('pb-24', 'pb-\\d+')}">`);
      content = content.replace(wrapperRegex, (match) => {
          return match + '\n' + blobHtml;
      });
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    count++;
  }
});

console.log(`Updated ${count} files.`);
