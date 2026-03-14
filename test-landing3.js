const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  try {
    await page.waitForSelector('nextjs-portal', { timeout: 5000 });
    const errorText = await page.evaluate(() => {
      const portal = document.querySelector('nextjs-portal');
      const text = portal ? (portal.shadowRoot ? portal.shadowRoot.textContent : portal.textContent) : 'No error overlay';
      return text;
    });
    console.log('Error text:', errorText.substring(0, 1000));
  } catch (e) {
    console.log('No nextjs-portal found within 5 seconds.');
  }
  
  await browser.close();
})();
