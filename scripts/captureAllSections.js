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
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Overview
    await page.screenshot({ path: path.join(outDir, 'overview_1920x1080.png') });
    console.log('Saved overview_1920x1080.png');

    // 2. Live Lab
    const labEl = await page.$('#live-lab');
    if (labEl) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), labEl);
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(outDir, 'live_lab_4x4_1920x1080.png') });
      console.log('Saved live_lab_4x4_1920x1080.png');
    }

    // 3. Benchmark - View 1: Table
    const benchEl = await page.$('#benchmark');
    if (benchEl) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), benchEl);
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(outDir, 'benchmark_view1_table_1920x1080.png') });
      console.log('Saved benchmark_view1_table_1920x1080.png');

      // Click Model Cards View
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.includes('Model Cards')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 800));
          await page.screenshot({ path: path.join(outDir, 'benchmark_view2_cards_1920x1080.png') });
          console.log('Saved benchmark_view2_cards_1920x1080.png');
          break;
        }
      }

      // Click Radar View
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.includes('Radar')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 800));
          await page.screenshot({ path: path.join(outDir, 'benchmark_view3_radar_1920x1080.png') });
          console.log('Saved benchmark_view3_radar_1920x1080.png');
          break;
        }
      }

      // Click Ranking View
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.includes('Ranking')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 800));
          await page.screenshot({ path: path.join(outDir, 'benchmark_view4_ranking_1920x1080.png') });
          console.log('Saved benchmark_view4_ranking_1920x1080.png');
          break;
        }
      }
    }

    // 4. Evidence
    const evidEl = await page.$('#evidence');
    if (evidEl) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), evidEl);
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(outDir, 'evidence_4x4_1920x1080.png') });
      console.log('Saved evidence_4x4_1920x1080.png');
    }

    // 5. Mobile
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, 'mobile_390x844.png') });
    console.log('Saved mobile_390x844.png');

  } finally {
    await browser.close();
  }
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
