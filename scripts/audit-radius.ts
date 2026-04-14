
import { chromium, devices } from 'playwright';

async function auditRadius() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
  });
  const page = await context.newPage();

  const pagesToAudit = ['/dashboard', '/factures', '/clients'];
  const radiusMap = new Map<string, number>();

  for (const path of pagesToAudit) {
    try {
      await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const radii = await page.evaluate(() => {
        const results: { value: string }[] = [];
        document.querySelectorAll('*').forEach((el) => {
          const style = window.getComputedStyle(el);
          const radius = style.borderRadius;
          if (radius && radius !== '0px') {
            results.push({ value: radius });
          }
        });
        return results;
      });

      radii.forEach(r => {
        radiusMap.set(r.value, (radiusMap.get(r.value) || 0) + 1);
      });
    } catch (e) {
      console.error(`Error auditing ${path}:`, e);
    }
  }

  console.log('\n--- Border Radius Distribution ---');
  const sorted = Array.from(radiusMap.entries()).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([val, count]) => {
    console.log(`${val}: ${count} elements`);
  });

  await browser.close();
}

auditRadius().catch(console.error);
