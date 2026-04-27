import { describe, it, expect } from 'vitest';
import { deprecatedHostDecoratorRule } from './deprecated-host-decorator.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/deprecated-host-decorator', () => {
  it('detects @HostBinding and @HostListener', async () => {
    const file = categorizeFile('violations/deprecated-host.component.ts');
    const findings = await deprecatedHostDecoratorRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings.some((f) => f.message.includes('@HostBinding'))).toBe(true);
    expect(findings.some((f) => f.message.includes('@HostListener'))).toBe(true);
  });

  it('does not flag clean component', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await deprecatedHostDecoratorRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
