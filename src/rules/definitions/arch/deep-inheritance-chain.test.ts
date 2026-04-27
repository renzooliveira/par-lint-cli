import { describe, it, expect } from 'vitest';
import { deepInheritanceChainRule } from './deep-inheritance-chain.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/deep-inheritance-chain', () => {
  it('detects inheritance deeper than 2 levels', async () => {
    const file = categorizeFile('violations/arch/deep-inheritance.service.ts');
    const findings = await deepInheritanceChainRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toContain('composition');
  });

  it('does not flag shallow inheritance', async () => {
    const file = categorizeFile('valid/arch/shallow-inheritance.service.ts');
    const findings = await deepInheritanceChainRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
