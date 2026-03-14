const fs = require('fs');
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
  let newContent = content.replace(/catch\s*\(([^)]+)\)\s*\{([^}]+return NextResponse\.json\(\{\s*error:\s*"([^"]+)"\s*\}\s*,\s*\{\s*status:\s*500\s*\}\);[^}]+)\}/g, (match, errVar, body, errMsg) => {
    // If it has : any, strip it
    let e = errVar.split(':')[0].trim();
    let replacedBody = body.replace(
      new RegExp(`return NextResponse\\.json\\(\\{\\s*error:\\s*"${errMsg}"\\s*\\}\\s*,\\s*\\{\\s*status:\\s*500\\s*\\}\\);`),
      `return NextResponse.json({ error: "${errMsg}", details: ${e} instanceof Error ? ${e}.message : String(${e}) }, { status: 500 });`
    );
    return `catch (${errVar}) {${replacedBody}}`;
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Updated:', file);
  }
});
