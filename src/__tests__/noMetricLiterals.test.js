import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('No Metric Literals in Components Rule', () => {
  const componentsDir = path.resolve(__dirname, '../components');
  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

  const FORBIDDEN_LITERALS = [
    '112.37',
    '242.47',
    '11.32',
    '112.24',
    '242.59',
  ];

  it('verifies that components do not hardcode metric numeric literals', () => {
    const violations = [];

    files.forEach(file => {
      const filePath = path.join(componentsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      FORBIDDEN_LITERALS.forEach(literal => {
        // Check if literal appears in the code (outside comments)
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          // Ignore comments or tests
          if (line.includes(literal) && !line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.trim().startsWith('*')) {
            violations.push(`${file}:${idx + 1} contains hardcoded literal "${literal}": "${line.trim()}"`);
          }
        });
      });
    });

    expect(violations, `Found hardcoded metric literals in components:\n${violations.join('\n')}`).toEqual([]);
  });
});
