const fs = require('fs');

let tailwindConfig = fs.readFileSync('tailwind.config.ts', 'utf8');

if (!tailwindConfig.includes('pulse-slow')) {
    tailwindConfig = tailwindConfig.replace(/extend: \{/, `extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },`);
    fs.writeFileSync('tailwind.config.ts', tailwindConfig);
    console.log("Tailwind config patched!");
} else {
    console.log("Tailwind already patched.");
}
