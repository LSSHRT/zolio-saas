const fs = require('fs');
const glob = require('glob');
const path = require('path');

const traverseDir = (dir, callback) => {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      traverseDir(fullPath, callback);
    } else if (fullPath.endsWith('route.ts')) {
      callback(fullPath);
    }
  });
};

traverseDir('src/app/api', (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Replace { error: "something" } with { error: "something", details: String(error) } if not already there
  const regex = /return NextResponse\.json\(\{\s*error:\s*("[^"]+")\s*\}\s*,\s*\{\s*status:\s*500\s*\}\);/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, 'return NextResponse.json({ error: $1, details: error instanceof Error ? error.message : String(error) }, { status: 500 });');
    fs.writeFileSync(file, content);
    console.log('Updated:', file);
  }
});
