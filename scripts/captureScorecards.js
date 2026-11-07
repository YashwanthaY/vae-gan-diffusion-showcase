import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function capture() {
  const outDir = 'screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));

    // Scroll to benchmark
    const benchEl = await page.$('#benchmark');
    if (benchEl) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), benchEl);
      await new Promise(r => setTimeout(r, 1000));

      // Click "Scorecards"
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.includes('Scorecards')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 1200));
          await page.screenshot({ path: path.join(outDir, 'benchmark_scorecards_1920x1080.png') });
          console.log('Saved benchmark_scorecards_1920x1080.png');
          break;
        }
      }

      // Click "Matrix"
      const buttons2 = await page.$$('button');
      for (const btn of buttons2) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.includes('Matrix')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 1000));
          await page.screenshot({ path: path.join(outDir, 'benchmark_matrix_1920x1080.png') });
          console.log('Saved benchmark_matrix_1920x1080.png');
          break;
        }
      }

      // Click "Dot Plot"
      const buttons3 = await page.$$('button');
      for (const btn of buttons3) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.includes('Dot Plot')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 1000));
          await page.screenshot({ path: path.join(outDir, 'benchmark_dotplot_1920x1080.png') });
          console.log('Saved benchmark_dotplot_1920x1080.png');
          break;
        }
      }
    }

    // Mobile viewport
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const benchMobile = await page.$('#benchmark');
    if (benchMobile) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), benchMobile);
      const mButtons = await page.$$('button');
      for (const btn of mButtons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.includes('Scorecards')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 1000));
          await page.screenshot({ path: path.join(outDir, 'benchmark_scorecards_mobile_390x844.png') });
          console.log('Saved benchmark_scorecards_mobile_390x844.png');
          break;
        }
      }
    }

  } finally {
    await browser.close();
  }
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
