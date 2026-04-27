import { describe, it, expect } from 'vitest';
import { deprecatedStructuralDirectiveRule } from './deprecated-structural-directive.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('template/deprecated-structural-directive', () => {
  it('detects *ngIf, *ngFor and *ngSwitch', async () => {
    const file = categorizeFile('violations/template/deprecated-structural.component.html');
    const findings = await deprecatedStructuralDirectiveRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings.some((f) => f.message.includes('@if'))).toBe(true);
    expect(findings.some((f) => f.message.includes('@for'))).toBe(true);
    expect(findings.some((f) => f.message.includes('@switch'))).toBe(true);
  });

  it('does not flag modern control flow', async () => {
    const file = categorizeFile('valid/template/modern-control-flow.component.html');
    const findings = await deprecatedStructuralDirectiveRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
