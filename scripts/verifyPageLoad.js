import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function verify() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const errors = [];

  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      errors.push(`Page error: ${err.message}`);
    });

    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    const title = await page.title();
    console.log(`Page title: ${title}`);

    await page.screenshot({ path: 'screenshots/verified_localhost3000.png' });
    console.log('Saved screenshots/verified_localhost3000.png');

    if (errors.length > 0) {
      console.error('Errors found:');
      errors.forEach(e => console.error(e));
      process.exit(1);
    } else {
      console.log('Success! Page loaded with 0 errors.');
    }
  } catch (err) {
    console.error('Fatal verification error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verify();
