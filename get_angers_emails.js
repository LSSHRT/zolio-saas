const https = require('https');

async function fetchBing(query) {
  return new Promise((resolve) => {
    https.get(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function fetchQwant(query) {
  return new Promise((resolve) => {
    https.get(`https://lite.qwant.com/?q=${encodeURIComponent(query)}&t=web`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

const extractEmails = (text) => {
  const regex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = text.match(regex);
  return matches ? [...new Set(matches.map(e => e.toLowerCase()))] : [];
};

async function run() {
  const queries = [
    '"@gmail.com" OR "@orange.fr" plombier angers',
    '"@gmail.com" OR "@orange.fr" electricien angers',
    '"@gmail.com" OR "@orange.fr" menuisier angers',
    '"@gmail.com" OR "@orange.fr" peintre angers',
    '"@gmail.com" OR "@orange.fr" artisan batiment angers',
    '"@gmail.com" OR "@orange.fr" maçon angers'
  ];

  const allEmails = new Set();
  const invalid = ['error-lite@duckduckgo.com', 'legal@qwant.net', 'mary@example.com'];

  for (const q of queries) {
    const html1 = await fetchBing(q);
    const html2 = await fetchQwant(q);
    const e1 = extractEmails(html1);
    const e2 = extractEmails(html2);
    
    [...e1, ...e2].forEach(e => {
      if (!invalid.includes(e) && !e.includes('sentry') && !e.includes('example.com') && !e.includes('rating@')) {
        allEmails.add(e);
      }
    });
    // Sleep to avoid rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(Array.from(allEmails).join('\n'));
}

run();
