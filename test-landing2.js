const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log(e.message));
  
  // Extract error overlay text
  const errorText = await page.evaluate(() => {
    const portal = document.querySelector('nextjs-portal');
    return portal ? portal.shadowRoot?.innerHTML || portal.innerHTML : 'No error overlay';
  }).catch(e => e.message);
  
  console.log('Error Overlay HTML:', errorText.substring(0, 1000));
  
  await browser.close();
})();
