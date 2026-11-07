import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function hashString(str) {
  if (!str) return '00000000';
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

async function run() {
  const outDir = path.join('screenshots', 'diverse');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const report = {
    seeds: [],
    runs: [],
    reproducibilityPassed: false,
    zeroDuplicatesInGrid: true,
    consecutiveOverlapLow: true,
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));

    // Scroll to live lab
    const labEl = await page.$('#live-lab');
    if (labEl) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }), labEl);
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n--- 1. Testing Diverse Generation with Lock seed: OFF ---');
    const runResults = [];

    for (let i = 1; i <= 6; i++) {
      console.log(`Executing Generate run #${i} ...`);
      const genBtn = await page.$('#generate-btn');
      if (genBtn) {
        await genBtn.click();
      }

      // Wait for generation to complete (button re-enables)
      await page.waitForFunction(() => {
        const btn = document.querySelector('#generate-btn');
        return btn && !btn.disabled && !btn.innerText.includes('Generating');
      }, { timeout: 35000 });

      await new Promise(r => setTimeout(r, 1500));

      // Extract current active seed
      const seedVal = await page.evaluate(() => {
        const input = document.querySelector('#seed-input');
        return input ? input.value : null;
      });

      // Extract all 16 tiles for each model
      const modelTileHashes = await page.evaluate(() => {
        const res = {};
        for (const mKey of ['vae', 'wgan', 'ddpm']) {
          const card = document.querySelector(`#model-card-${mKey}`);
          if (card) {
            res[mKey] = Array.from(card.querySelectorAll('img')).map(img => img.src);
          } else {
            res[mKey] = [];
          }
        }
        return res;
      });

      const hashedData = {
        runIndex: i,
        seed: seedVal,
        vae: (modelTileHashes.vae || []).map(hashString),
        wgan: (modelTileHashes.wgan || []).map(hashString),
        ddpm: (modelTileHashes.ddpm || []).map(hashString),
      };

      report.seeds.push(seedVal);
      runResults.push(hashedData);

      console.log(`  Run #${i} active seed: ${seedVal}`);
      console.log(`  DDPM tiles: ${hashedData.ddpm.length}, unique in grid: ${new Set(hashedData.ddpm).size}`);
      console.log(`  VAE tiles: ${hashedData.vae.length}, unique in grid: ${new Set(hashedData.vae).size}`);
      console.log(`  WGAN tiles: ${hashedData.wgan.length}, unique in grid: ${new Set(hashedData.wgan).size}`);

      // Verify zero duplicates within single 4x4 grid
      if (new Set(hashedData.ddpm).size < hashedData.ddpm.length ||
          new Set(hashedData.vae).size < hashedData.vae.length ||
          new Set(hashedData.wgan).size < hashedData.wgan.length) {
        console.warn(`  Warning: duplicate tiles detected within Run #${i}!`);
        report.zeroDuplicatesInGrid = false;
      }

      // Check overlap with previous run
      if (i > 1) {
        const prev = runResults[i - 2];
        const prevDdpmSet = new Set(prev.ddpm);
        const overlap = hashedData.ddpm.filter(h => prevDdpmSet.has(h));
        console.log(`  DDPM tiles overlapping with Run #${i - 1}: ${overlap.length} / 16`);
        // In offline mode with ~24 unique bank tiles, mathematical minimum overlap between two 16-tile draws is 8
        if (overlap.length > 8) {
          console.warn(`  Overlap higher than expected: ${overlap.length}`);
          report.consecutiveOverlapLow = false;
        }
      }

      if (i === 1) {
        await page.screenshot({ path: path.join(outDir, 'run1_seedA.png') });
        console.log('  Saved screenshots/diverse/run1_seedA.png');
      } else if (i === 2) {
        await page.screenshot({ path: path.join(outDir, 'run2_seedB.png') });
        console.log('  Saved screenshots/diverse/run2_seedB.png');
      }
    }

    console.log('\n--- 2. Testing Reproducibility with Lock seed: ON ---');
    // Find and check Lock seed checkbox
    await page.evaluate(() => {
      const lockBox = document.querySelector('#lock-seed-checkbox') || document.querySelector('input[type="checkbox"][aria-label="Lock seed"]');
      if (lockBox && !lockBox.checked) {
        lockBox.click();
      }
    });
    await new Promise(r => setTimeout(r, 600));

    // Get locked seed
    const lockedSeed = await page.evaluate(() => {
      const input = document.querySelector('#seed-input');
      return input ? input.value : null;
    });

    console.log(`Locked seed is: ${lockedSeed}`);

    // Trigger run with locked seed
    const genBtn = await page.$('#generate-btn');
    if (genBtn) await genBtn.click();
    await page.waitForFunction(() => {
      const btn = document.querySelector('#generate-btn');
      return btn && !btn.disabled && !btn.innerText.includes('Generating');
    }, { timeout: 35000 });
    await new Promise(r => setTimeout(r, 1200));

    const extractModelTiles = () => {
      const res = {};
      for (const mKey of ['vae', 'wgan', 'ddpm']) {
        const card = document.querySelector(`#model-card-${mKey}`);
        if (card) {
          res[mKey] = Array.from(card.querySelectorAll('img')).map(img => img.src);
        } else {
          res[mKey] = [];
        }
      }
      return res;
    };

    const lockedRun1Hashes = await page.evaluate(extractModelTiles);

    // Trigger second run with locked seed
    if (genBtn) await genBtn.click();
    await page.waitForFunction(() => {
      const btn = document.querySelector('#generate-btn');
      return btn && !btn.disabled && !btn.innerText.includes('Generating');
    }, { timeout: 35000 });
    await new Promise(r => setTimeout(r, 1200));

    const lockedRun2Hashes = await page.evaluate(extractModelTiles);

    const locked1H = (lockedRun1Hashes.ddpm || []).map(hashString);
    const locked2H = (lockedRun2Hashes.ddpm || []).map(hashString);

    const identical = locked1H.length === locked2H.length && locked1H.every((h, idx) => h === locked2H[idx]);
    console.log(`Locked seed reproducibility check: ${identical ? 'PASSED (Identical)' : 'FAILED'}`);
    report.reproducibilityPassed = identical;

    // Check seed variance in unlocked mode
    const distinctSeeds = new Set(report.seeds);
    const allSeedsDistinct = distinctSeeds.size === report.seeds.length;
    console.log(`\nAll unlocked seeds distinct: ${allSeedsDistinct} (${distinctSeeds.size}/${report.seeds.length} unique)`);

    // Write report
    const markdownReport = `# Empirical Diversity & Reproducibility Verification Report

- **Date**: ${new Date().toISOString()}
- **Zero Duplicates Within 16-Tile Grids**: ${report.zeroDuplicatesInGrid ? '✅ PASSED (0 duplicate tiles in any 4×4 grid)' : '❌ FAILED'}
- **Consecutive Runs Diversity**: ${report.consecutiveOverlapLow ? '✅ PASSED (Consecutive runs share $\\le$ 8 tiles in finite offline bank)' : '❌ FAILED'}
- **All Unlocked Seeds Distinct**: ${allSeedsDistinct ? '✅ PASSED' : '❌ FAILED'} (${distinctSeeds.size}/${report.seeds.length} unique seeds)
- **Lock Seed Reproducibility**: ${report.reproducibilityPassed ? '✅ PASSED (100% identical outputs when seed locked)' : '❌ FAILED'}

## Seeds Drawn in Sequential Unlocked Runs
${report.seeds.map((s, idx) => `- Run #${idx + 1}: Seed \`${s}\``).join('\n')}

## Tile Overlap Matrix (DDPM 16-tile grids)
${runResults.map((r, i) => {
  if (i === 0) return `- Run #1: Initial fresh batch of 16 distinct tiles`;
  const prevSet = new Set(runResults[i - 1].ddpm);
  const overlap = r.ddpm.filter(h => prevSet.has(h)).length;
  return `- Run #${i + 1} vs Run #${i}: ${overlap} overlapping tiles out of 16 (${Math.round((overlap / 16) * 100)}%)`;
}).join('\n')}
`;

    fs.writeFileSync(path.join(outDir, 'DIVERSITY_REPORT.md'), markdownReport, 'utf8');
    console.log(`\nSaved diversity report to ${path.join(outDir, 'DIVERSITY_REPORT.md')}`);

  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
