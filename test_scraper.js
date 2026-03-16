const metiers = ["Plombier", "Electricien", "Menuisier", "Peintre"];
const villes = ["Paris", "Lyon"];

async function testScrape() {
  const metier = metiers[Math.floor(Math.random() * metiers.length)];
  const ville = villes[Math.floor(Math.random() * villes.length)];
  const query = `${metier} ${ville} contact "@gmail.com"`;
  
  console.log("Searching for:", query);
  
  const response = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query), {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0"
    }
  });
  
  const html = await response.text();
  
  const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/gi;
  const emails = html.match(emailRegex);
  
  if (emails) {
    const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))].filter(e => !e.includes('duckduckgo') && !e.includes('sentry') && !e.includes('example'));
    console.log("Found emails:", uniqueEmails);
  } else {
    console.log("No emails found.");
  }
}

testScrape();
