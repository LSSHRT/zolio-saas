const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('Page Error:', err.message);
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log(e.message));
  
  // check if there is an error overlay
  const hasErrorOverlay = await page.evaluate(() => {
    return !!document.querySelector('nextjs-portal');
  }).catch(() => false);
  
  console.log('Has Next.js error overlay:', hasErrorOverlay);
  
  await browser.close();
})();
