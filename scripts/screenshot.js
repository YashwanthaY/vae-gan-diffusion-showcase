import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const url = process.argv[2] || 'http://localhost:3001';
const outPath = process.argv[3] || 'screenshots/home-parity/legacy_hero_1920x1080.png';
const width = parseInt(process.argv[4] || '1920', 10);
const height = parseInt(process.argv[5] || '1080', 10);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function takeScreenshot() {
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000)); // wait for 3D render
  await page.screenshot({ path: outPath });
  await browser.close();
  console.log(`Screenshot saved to ${outPath}`);
}

takeScreenshot().catch(err => {
  console.error(err);
  process.exit(1);
});

