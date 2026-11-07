import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
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

    // 1. Live Lab - Images
    const labEl = await page.$('#live-lab');
    if (labEl) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), labEl);
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(outDir, 'livelab_images_1920x1080.png') });
      console.log('Saved livelab_images_1920x1080.png');

      // Click "Graphs" or press 'G'
      await page.keyboard.press('KeyG');
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(outDir, 'livelab_graphs_1920x1080.png') });
      console.log('Saved livelab_graphs_1920x1080.png');

      // Switch back to images
      await page.keyboard.press('KeyG');
      await new Promise(r => setTimeout(r, 1000));
    }

    // 2. Evidence Section
    const evidenceEl = await page.$('#evidence');
    if (evidenceEl) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), evidenceEl);
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(outDir, 'evidence_images_1920x1080.png') });
      console.log('Saved evidence_images_1920x1080.png');

      // Toggle to graphs
      await page.keyboard.press('KeyG');
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(outDir, 'evidence_graphs_1920x1080.png') });
      console.log('Saved evidence_graphs_1920x1080.png');

      await page.keyboard.press('KeyG');
      await new Promise(r => setTimeout(r, 800));
    }

    // 3. Mobile Viewport
    await page.setViewport({ width: 390, height: 844 });
    if (labEl) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), labEl);
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(outDir, 'mobile_livelab_390x844.png') });
      console.log('Saved mobile_livelab_390x844.png');
    }

    console.log('All captures completed successfully.');
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    await browser.close();
  }
}

run();
