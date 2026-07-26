import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

(async () => {
  console.log('Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') console.error('BROWSER ERROR:', text);
    else console.log('BROWSER LOG:', text);
  });

  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  try {
    await page.goto(`${BASE_URL}/test-utm.html`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    const tests = await page.$$eval('div.test', divs =>
      divs.map(div => {
        const h3 = div.querySelector('h3');
        const isPass = div.classList.contains('pass');
        const isFail = div.classList.contains('fail');
        const name = h3 ? h3.textContent.replace(/[✅❌]\s*/, '').trim() : 'unknown';
        return { name, isPass, isFail };
      })
    );

    const passed = tests.filter(t => t.isPass).length;
    const failed = tests.filter(t => t.isFail).length;
    const total = tests.length;

    console.log(`\n--- RESULTADOS UTM ---`);
    console.log(`Total tests:  ${total}`);
    console.log(`Aprobados:    ${passed}`);
    console.log(`Fallidos:     ${failed}`);
    console.log('----------------------');

    if (failed > 0) {
      console.error('\n❌ Tests fallidos:');
      tests.filter(t => t.isFail).forEach(t => console.error(`   • ${t.name}`));
      console.error(`\nCI FAILED: ${failed}/${total} tests exceden la tolerancia del 5%.`);
      await page.screenshot({ path: 'test-fail.png', fullPage: true });
      await browser.close();
      process.exit(1);
    }

    console.log('\n✅ Todos los tests UTM pasaron. Norma del 5% respetada.');
    await browser.close();
    process.exit(0);

  } catch (err) {
    console.error('\n💥 CRASH:', err.message);
    await page.screenshot({ path: 'test-crash.png', fullPage: true });
    await browser.close();
    process.exit(1);
  }
})();