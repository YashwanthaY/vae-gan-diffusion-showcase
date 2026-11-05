/**
 * Unit tests for CSV / LaTeX string generation.
 * These run in the browser-free Vitest environment,
 * so we test the pure helper logic directly.
 */
import { describe, it, expect } from 'vitest';

// Inline the helpers (same logic as OutputsTab1Results)
function makeCSV(rows) {
  const header = 'Model,Class,Seed,Steps,NFE,Guidance,Mode,Latency,img/s,Diversity';
  const body = rows.map(r =>
    [r.model, r.class, r.seed, r.steps, r.nfe, r.guidance, r.mode, r.latency, r.ips, r.diversity].join(',')
  );
  return [header, ...body].join('\n');
}

function makeLatex(rows) {
  const body = rows.map(r =>
    `  ${r.model} & ${r.class} & ${r.seed} & ${r.steps} & ${r.nfe} & ${r.guidance} & ${r.mode} & ${r.latency} & ${r.ips} & ${r.diversity} \\\\`
  );
  return [
    '\\begin{tabular}{llllllllll}',
    '\\hline',
    '  Model & Class & Seed & Steps & NFE & CFG & Mode & Latency & img/s & Diversity \\\\',
    '\\hline',
    ...body,
    '\\hline',
    '\\end{tabular}',
  ].join('\n');
}

const MOCK_ROWS = [
  { model: 'β-VAE', class: 'dog', seed: 42, steps: 50, nfe: 2, guidance: 1.5, mode: 'gpu', latency: '0.12s', ips: '133.33', diversity: '0.4512' },
  { model: 'DDPM',  class: 'dog', seed: 42, steps: 50, nfe: 100, guidance: 1.5, mode: 'gpu', latency: '3.21s', ips: '4.98', diversity: '0.5231' },
];

describe('CSV export', () => {
  it('starts with correct header', () => {
    const csv = makeCSV(MOCK_ROWS);
    expect(csv.startsWith('Model,Class,Seed')).toBe(true);
  });

  it('has correct row count (header + data rows)', () => {
    const lines = makeCSV(MOCK_ROWS).split('\n');
    expect(lines.length).toBe(MOCK_ROWS.length + 1);
  });

  it('contains model names', () => {
    const csv = makeCSV(MOCK_ROWS);
    expect(csv).toContain('β-VAE');
    expect(csv).toContain('DDPM');
  });
});

describe('LaTeX export', () => {
  it('wraps in tabular environment', () => {
    const tex = makeLatex(MOCK_ROWS);
    expect(tex).toContain('\\begin{tabular}');
    expect(tex).toContain('\\end{tabular}');
  });

  it('contains data rows with & separator', () => {
    const tex = makeLatex(MOCK_ROWS);
    expect(tex).toContain('β-VAE &');
    expect(tex).toContain('DDPM &');
  });

  it('ends rows with \\\\', () => {
    const tex = makeLatex(MOCK_ROWS);
    const rowLines = tex.split('\n').filter(l => l.includes(' & '));
    expect(rowLines.every(l => l.trim().endsWith('\\\\'))).toBe(true);
  });
});
