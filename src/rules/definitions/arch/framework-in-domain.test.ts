import { describe, it, expect } from 'vitest';
import { frameworkInDomainRule } from './framework-in-domain.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/framework-in-domain', () => {
  it('detects framework imports in domain files', async () => {
    const file = categorizeFile('violations/arch/framework-in-domain.service.ts');
    const findings = await frameworkInDomainRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag pure domain files', async () => {
    const file = categorizeFile('valid/arch/pure-domain.service.ts');
    const findings = await frameworkInDomainRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
