
import { chromium, devices } from 'playwright';

async function auditOverflow() {
  const browser = await chromium.launch();
  const mobile = await browser.newPage({ ...devices['iPhone 14'] });

  const pagesToAudit = ['/dashboard', '/factures', '/clients', '/devis'];
  const allOverflows = [];

  for (const path of pagesToAudit) {
    console.log(`Checking overflow on ${path}...`);
    try {
      await mobile.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' });
      await mobile.waitForTimeout(2000);

      const overflows = await mobile.evaluate(() => {
        const results: any[] = [];
        document.querySelectorAll('*').forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 2 && rect.width > 20) {
            const cs = window.getComputedStyle(el);
            if (cs.position !== 'fixed' && cs.position !== 'absolute') {
              results.push({
                tag: el.tagName,
                classes: (el as HTMLElement).className?.substring?.(0, 100),
                right: Math.round(rect.right),
                viewportWidth: window.innerWidth,
              });
            }
          }
        });
        return results;
      });
      if (overflows.length > 0) {
        allOverflows.push({ path, issues: overflows });
      }
    } catch (e) {
      console.error(`Error auditing ${path}:`, e);
    }
  }

  if (allOverflows.length === 0) {
    console.log('✅ No horizontal overflows detected on mobile!');
  } else {
    console.log('🚨 Horizontal overflows detected:');
    console.log(JSON.stringify(allOverflows, null, 2));
  }

  await browser.close();
}

auditOverflow().catch(console.error);
