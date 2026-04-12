
import { chromium, devices } from 'playwright';

async function runGlobalAudit() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  const routes = [
    { name: 'Landing Page', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Factures', path: '/factures' },
    { name: 'Devis', path: '/devis' },
    { name: 'Clients', path: '/clients' },
    { name: 'Calepin', path: '/calepin' },
    { name: 'Paramètres', path: '/parametres' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Admin', path: '/admin' },
  ];

  const results = [];

  for (const route of routes) {
    console.log(`\n--- Auditing ${route.name} (${route.path}) ---`);
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Mobile', ...devices['iPhone 14'] },
    ];

    for (const vp of viewports) {
      const page = await context.newPage();
      if (vp.name === 'Desktop') {
        await page.setViewportSize({ width: vp.width, height: vp.height });
      } else {
        // devices['iPhone 14'] already sets viewport
      }

      try {
        await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const auditData = await page.evaluate(() => {
          const issues = [];
          
          // 1. Horizontal Overflow
          const doc = document.documentElement;
          if (doc.scrollWidth > doc.clientWidth + 2) {
            issues.push({ type: 'OVERFLOW', severity: 'HIGH', msg: `Horizontal overflow detected: ${doc.scrollWidth}px > ${doc.clientWidth}px` });
          }

          // 2. Radius Consistency
          const radii = new Set();
          document.querySelectorAll('*').forEach(el => {
            const r = window.getComputedStyle(el).borderRadius;
            if (r && r !== '0px') radii.add(r);
          });
          // We expect: 4, 8, 12, 16, 28 px (approx)
          const nonStandard = Array.from(radii).filter(r => {
            const val = parseFloat(r);
            return ![4, 6, 8, 12, 16, 28].includes(val);
          });
          if (nonStandard.length > 0) {
            issues.push({ type: 'DESIGN', severity: 'LOW', msg: `Non-standard radii found: ${nonStandard.join(', ')}` });
          }

          // 3. Touch Targets (Mobile only)
          if (window.innerWidth < 1024) {
            document.querySelectorAll('button, a').forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && (rect.width < 44 || rect.height < 44)) {
                // Only report if it's a meaningful button
                if (el.textContent && el.textContent.trim().length > 0) {
                  issues.push({ type: 'A11Y', severity: 'MEDIUM', msg: `Small touch target: ${el.tagName} (${Math.round(rect.width)}x${Math.round(rect.height)}px)` });
                }
              }
            });
          }

          return issues;
        });

        results.push({
          route: route.name,
          viewport: vp.name,
          issues: auditData,
        });

      } catch (e) {
        console.error(`Error on ${route.name} (${vp.name}):`, e);
        results.push({ route: route.name, viewport: vp.name, error: true });
      } finally {
        await page.close();
      }
    }
  }

  console.log('\n=== FINAL GLOBAL AUDIT REPORT ===');
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

runGlobalAudit().catch(console.error);
