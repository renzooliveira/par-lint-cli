import { describe, it, expect } from 'vitest';
import { ngclassInsteadOfClassBindingRule } from './ngclass-instead-of-class-binding.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('template/ngclass-instead-of-class-binding', () => {
  it('detects [ngClass] and [ngStyle] usage', async () => {
    const file = categorizeFile('violations/template/ngclass-instead-of-class.component.html');
    const findings = await ngclassInsteadOfClassBindingRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(3);
    expect(findings.some((f) => f.message.includes('[class.name]'))).toBe(true);
    expect(findings.some((f) => f.message.includes('[style.prop]'))).toBe(true);
  });

  it('does not flag direct class/style bindings', async () => {
    const file = categorizeFile('valid/template/class-binding.component.html');
    const findings = await ngclassInsteadOfClassBindingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
